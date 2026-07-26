import {
  Bot,
  type Context,
  InlineKeyboard,
  Keyboard,
  webhookCallback,
} from "grammy";
import { randomUUID } from "node:crypto";
import { FinoraError } from "@finora/shared";
import { env } from "../env.js";
import { getGoalAnalysisService, services } from "../container.js";
import { formatAnalysisForChat } from "../analysis/format.js";
import { getMarketContext } from "../analysis/market-context.js";
import { runAgentTurn, type AgentReply } from "../agent/runtime.js";
import { registerChannelNotifier } from "../agent/notifier.js";
import {
  formatAssetQuote,
  formatPortfolioBalance,
  getAssetQuote,
  getStocksPortfolio,
} from "../integrations/wallbit.js";
import { formatPendingActionMessage } from "./digest-format.js";

let bot: Bot | null = null;

type GoalRow = Awaited<ReturnType<ReturnType<typeof services>["goals"]["list"]>>[number];

type GoalsApi = ReturnType<typeof services>["goals"] & {
  setPrimary?: (userId: string, goalId: string) => Promise<{ id: string; name: string }>;
  cancel?: (userId: string, goalId: string) => Promise<{ id: string; name: string }>;
};

function isPrimaryMeta(goal: GoalRow): boolean {
  return goal.metadata?.is_primary === true;
}

/** Metas visibles (soft-delete = cancelled fuera de listas activas). */
function listActiveGoals(goals: GoalRow[]): GoalRow[] {
  return goals.filter((g) => g.status !== "cancelled");
}

/**
 * Regla compartida sprint2: is_primary → primera active → goals[0].
 * Solo entre metas no canceladas.
 */
function pickPrimaryGoal(goals: GoalRow[]): GoalRow | undefined {
  const active = listActiveGoals(goals);
  if (!active.length) return undefined;
  return (
    active.find(isPrimaryMeta) ??
    active.find((g) => g.status === "active") ??
    active[0]
  );
}

async function getPrimaryGoal(userId: string): Promise<GoalRow | null> {
  const goals = await services().goals.list(userId);
  return pickPrimaryGoal(goals) ?? null;
}

async function setPrimaryGoal(
  userId: string,
  goalId: string,
): Promise<{ id: string; name: string }> {
  const goalsApi = services().goals as GoalsApi;
  if (typeof goalsApi.setPrimary === "function") {
    return goalsApi.setPrimary(userId, goalId);
  }
  // Fallback: PATCH metadata si domain no expone setPrimary.
  const all = await goalsApi.list(userId);
  const target = all.find((g) => g.id === goalId);
  if (!target || target.status === "cancelled") {
    throw new FinoraError("GOAL_NOT_FOUND", "Meta no encontrada", 404);
  }
  for (const g of all) {
    if (g.id === goalId) continue;
    if (!isPrimaryMeta(g)) continue;
    await goalsApi.patch(userId, g.id, {
      metadata: { ...g.metadata, is_primary: false },
    });
  }
  const updated = await goalsApi.patch(userId, goalId, {
    metadata: { ...target.metadata, is_primary: true },
  });
  return { id: updated.id, name: updated.name };
}

async function cancelGoal(
  userId: string,
  goalId: string,
): Promise<{ id: string; name: string }> {
  const goalsApi = services().goals as GoalsApi;
  if (typeof goalsApi.cancel === "function") {
    return goalsApi.cancel(userId, goalId);
  }
  const updated = await goalsApi.patch(userId, goalId, { status: "cancelled" });
  return { id: updated.id, name: updated.name };
}

function findGoalByNameOrIndex(
  goals: GoalRow[],
  query: string,
): GoalRow | undefined {
  const q = query.trim().toLowerCase();
  if (!q) return undefined;
  const asNum = Number(q);
  if (Number.isInteger(asNum) && asNum >= 1 && asNum <= goals.length) {
    return goals[asNum - 1];
  }
  return (
    goals.find((g) => g.name.toLowerCase() === q) ??
    goals.find((g) => g.name.toLowerCase().includes(q))
  );
}

function formatMarketSummary(
  ctx: Awaited<ReturnType<typeof getMarketContext>>,
): string {
  const lines: string[] = ["Mercado (resumen corto)"];

  if (ctx.stub || ctx.source === "partial" || ctx.source === "fallback") {
    lines.push(`Fuente: ${ctx.source} — no es ejecución de trades.`);
  } else {
    lines.push(`Fuente: ${ctx.source}`);
  }

  const rate = ctx.wallbit.rate;
  if (rate?.rate != null) {
    lines.push(
      `Tipo: ${rate.from}→${rate.to} ≈ ${Number(rate.rate).toLocaleString("es-BO")}`,
    );
  }

  const cash = ctx.wallbit.portfolio?.usd_cash;
  if (cash != null) {
    lines.push(`Caja inversión: USD ${Number(cash).toLocaleString("es-BO")}`);
  }

  for (const a of ctx.wallbit.assets.slice(0, 3)) {
    lines.push(
      a.price != null
        ? `• ${a.symbol}: ${Number(a.price).toLocaleString("es-BO")}`
        : `• ${a.symbol}`,
    );
  }

  for (const insight of ctx.insights.slice(0, 2)) {
    lines.push(insight);
  }

  if (ctx.macro?.summary && lines.length < 7) {
    const snippet = ctx.macro.summary.replace(/\s+/g, " ").trim().slice(0, 180);
    if (snippet) {
      lines.push(`Macro BO: ${snippet}${snippet.length >= 180 ? "…" : ""}`);
    }
  }

  if (lines.length === 1) {
    lines.push("Sin datos de mercado por ahora. Probá de nuevo en un rato.");
  }

  return lines.slice(0, 8).join("\n");
}

/** Límite de la Bot API de Telegram por mensaje. */
const TELEGRAM_MAX_CHARS = 4096;

function splitForTelegram(text: string): string[] {
  if (text.length <= TELEGRAM_MAX_CHARS) return [text];
  const chunks: string[] = [];
  let rest = text;
  while (rest.length > TELEGRAM_MAX_CHARS) {
    const slice = rest.slice(0, TELEGRAM_MAX_CHARS);
    const breakAt = Math.max(slice.lastIndexOf("\n"), slice.lastIndexOf(" "));
    // Solo cortamos por espacio si no desperdicia media página.
    const end =
      breakAt > TELEGRAM_MAX_CHARS / 2 ? breakAt : TELEGRAM_MAX_CHARS;
    chunks.push(rest.slice(0, end).trimEnd());
    rest = rest.slice(end).trimStart();
  }
  if (rest) chunks.push(rest);
  return chunks;
}

async function sendReplies(ctx: Context, replies: AgentReply[]) {
  for (const reply of replies) {
    const chunks = splitForTelegram(reply.text);
    for (let i = 0; i < chunks.length; i++) {
      await ctx.reply(chunks[i], {
        // El teclado va solo en el último fragmento del mensaje.
        reply_markup:
          i === chunks.length - 1
            ? keyboardFromButtons(reply.buttons)
            : undefined,
      });
    }
  }
}

/** Copy para el usuario final: el detalle interno queda solo en los logs. */
function userFacingError(err: unknown): string {
  if (err instanceof FinoraError) {
    switch (err.code) {
      case "ACTION_NOT_FOUND":
        return "No encontré esa acción. Pedime que la prepare de nuevo.";
      case "ACTION_CONFLICT":
        return "Esa acción ya la resolviste antes.";
      case "ACTION_EXPIRED":
        return "Esa acción expiró. Pedime que la prepare de nuevo.";
      case "INSUFFICIENT_FUNDS":
        return "No hay suficiente acumulado en la meta para ese monto.";
      case "GOAL_NOT_FOUND":
        return "No encontré esa meta. Usá /meta para ver las que tenés.";
      case "WALLBIT_FAILED":
        return "No pude preparar la conversión en Wallbit. Probemos en un rato.";
    }
  }
  return "Tuve un problema técnico procesando eso. Probá de nuevo en un momento.";
}

async function resolveUser(ctx: {
  from?: { id: number; first_name?: string; username?: string };
}) {
  const tgId = ctx.from?.id;
  if (!tgId) throw new Error("No telegram user");
  const repos = services().repos;
  let profile = await repos.profiles.getByTelegramId(tgId);
  if (!profile) {
    profile = await repos.profiles.upsertTelegramProfile({
      id: randomUUID(),
      telegramUserId: tgId,
      displayName: ctx.from?.first_name ?? ctx.from?.username ?? null,
    });
  }
  return profile;
}

function keyboardFromButtons(
  buttons?: { label: string; callbackData: string }[],
) {
  if (!buttons?.length) return undefined;
  const kb = new InlineKeyboard();
  for (const b of buttons) {
    kb.text(b.label, b.callbackData).row();
  }
  return kb;
}

/** Teclado fijo: el usuario toca y Telegram manda el comando como texto. */
function mainReplyKeyboard() {
  return new Keyboard()
    .text("/saldo")
    .text("/mercado")
    .text("/progreso")
    .row()
    .text("/nuevameta")
    .text("/meta")
    .text("/plan")
    .row()
    .text("/priorizar")
    .text("/microahorro")
    .text("/proteger")
    .row()
    .text("/ayuda")
    .resized()
    .persistent();
}

type NewGoalStep = "ask_name" | "ask_amount" | "ask_months";

type NewGoalDraft = {
  step: NewGoalStep;
  name?: string;
  amountBobs?: number;
  targetMonths?: number;
};

/** Drafts de /nuevameta en memoria del proceso (se pierden al reiniciar la API). */
const newGoalDrafts = new Map<number, NewGoalDraft>();

function clearNewGoalDraft(telegramUserId: number) {
  newGoalDrafts.delete(telegramUserId);
}

function parsePositiveAmount(raw: string): number | null {
  const cleaned = raw.trim().replace(/\s/g, "").replace(/,/g, ".");
  const n = Number(cleaned.replace(/[^\d.]/g, ""));
  if (!Number.isFinite(n) || n <= 0) return null;
  return Math.round(n);
}

function parseMonths(raw: string): number | null {
  const n = Number(raw.trim().replace(/[^\d]/g, ""));
  if (!Number.isInteger(n) || n < 1 || n > 120) return null;
  return n;
}

/**
 * Atajo: `/nuevameta Laptop | 8500 | 10` o `/nuevameta Laptop 8500 10`.
 * El nombre puede tener espacios si usamos pipes; sin pipes, el último número
 * es meses, el penúltimo monto, y el resto el nombre.
 */
function parseNewGoalShortcut(raw: string): {
  name: string;
  amountBobs: number;
  targetMonths: number;
} | null {
  const text = raw.trim();
  if (!text) return null;

  if (text.includes("|")) {
    const parts = text.split("|").map((p) => p.trim()).filter(Boolean);
    if (parts.length < 3) return null;
    const targetMonths = parseMonths(parts[parts.length - 1]!);
    const amountBobs = parsePositiveAmount(parts[parts.length - 2]!);
    const name = parts.slice(0, -2).join(" ").trim();
    if (!name || amountBobs == null || targetMonths == null) return null;
    return { name, amountBobs, targetMonths };
  }

  const tokens = text.split(/\s+/).filter(Boolean);
  if (tokens.length < 3) return null;
  const targetMonths = parseMonths(tokens[tokens.length - 1]!);
  const amountBobs = parsePositiveAmount(tokens[tokens.length - 2]!);
  const name = tokens.slice(0, -2).join(" ").trim();
  if (!name || amountBobs == null || targetMonths == null) return null;
  return { name, amountBobs, targetMonths };
}

async function createGoalAndScheduleReport(
  ctx: Context,
  profileId: string,
  input: { name: string; amountBobs: number; targetMonths: number },
) {
  const baseMonthly = Math.max(
    1,
    Math.ceil(input.amountBobs / input.targetMonths),
  );
  const goal = await services().goals.create(profileId, {
    name: input.name,
    target_amount_bobs: input.amountBobs,
    target_months: input.targetMonths,
    base_monthly_bobs: baseMonthly,
  });

  const chatId = String(ctx.chat?.id ?? ctx.from?.id ?? "");
  await ctx.reply(
    `Guardé “${goal.name}”: Bs ${input.amountBobs.toLocaleString("es-BO")} en ${input.targetMonths} meses ` +
      `(≈ Bs ${baseMonthly.toLocaleString("es-BO")}/mes).\n` +
      "Estoy armando el informe de inversión para llegar más rápido. Te llega en unos segundos.",
    { reply_markup: mainReplyKeyboard() },
  );

  if (!chatId) return;

  getGoalAnalysisService().schedule(goal, async (analysis, analyzedGoal) => {
    try {
      await sendProactiveMessage(
        chatId,
        formatAnalysisForChat(analyzedGoal, analysis),
      );
    } catch (err) {
      console.error("[finora] no se pudo enviar informe de /nuevameta", err);
    }
  });
}

/** Devuelve true si el mensaje fue consumido por el wizard (no pasa al agente). */
async function handleNewGoalWizardText(
  ctx: Context,
  telegramUserId: number,
  text: string,
): Promise<boolean> {
  const draft = newGoalDrafts.get(telegramUserId);
  if (!draft) return false;

  const trimmed = text.trim();
  if (!trimmed) return true;

  if (/^\/?cancelar$/i.test(trimmed) || /^cancelar$/i.test(trimmed)) {
    clearNewGoalDraft(telegramUserId);
    await ctx.reply("Listo, cancelé la creación de la meta.", {
      reply_markup: mainReplyKeyboard(),
    });
    return true;
  }

  // Si el usuario manda otro comando, abortamos el wizard.
  if (trimmed.startsWith("/") && !trimmed.startsWith("/cancelar")) {
    clearNewGoalDraft(telegramUserId);
    return false;
  }

  if (draft.step === "ask_name") {
    if (trimmed.length < 2) {
      await ctx.reply("Necesito un nombre un poco más claro. ¿Qué meta querés?");
      return true;
    }
    draft.name = trimmed.slice(0, 120);
    draft.step = "ask_amount";
    newGoalDrafts.set(telegramUserId, draft);
    await ctx.reply(
      `Meta: “${draft.name}”.\n¿Cuál es el monto objetivo en Bs? (ej. 8500)`,
    );
    return true;
  }

  if (draft.step === "ask_amount") {
    const amount = parsePositiveAmount(trimmed);
    if (amount == null) {
      await ctx.reply("No entendí el monto. Mandame un número en Bs, ej. 8500.");
      return true;
    }
    draft.amountBobs = amount;
    draft.step = "ask_months";
    newGoalDrafts.set(telegramUserId, draft);
    await ctx.reply(
      `Monto: Bs ${amount.toLocaleString("es-BO")}.\n¿En cuántos meses querés lograrlo? (1–120)`,
    );
    return true;
  }

  if (draft.step === "ask_months") {
    const months = parseMonths(trimmed);
    if (months == null) {
      await ctx.reply("Decime un plazo en meses entre 1 y 120 (ej. 10).");
      return true;
    }
    const name = draft.name;
    const amountBobs = draft.amountBobs;
    clearNewGoalDraft(telegramUserId);
    if (!name || amountBobs == null) {
      await ctx.reply("Se me perdió el borrador. Probá de nuevo con /nuevameta.");
      return true;
    }
    const profile = await resolveUser(ctx);
    try {
      await createGoalAndScheduleReport(ctx, profile.id, {
        name,
        amountBobs,
        targetMonths: months,
      });
    } catch (err) {
      console.error("[finora] /nuevameta create error", err);
      await ctx.reply(userFacingError(err), {
        reply_markup: mainReplyKeyboard(),
      });
    }
    return true;
  }

  return false;
}

function defaultMicrosavingAmount(baseMonthlyBobs: number): number {
  return Math.max(50, Math.round(baseMonthlyBobs * 0.1));
}

function actionButtons(actionId: string) {
  return [
    { label: "Confirmar", callbackData: `action:confirm:${actionId}` },
    { label: "Cancelar", callbackData: `action:cancel:${actionId}` },
  ];
}

async function replyAssetQuote(ctx: Context, rawSymbol: string) {
  const symbol = rawSymbol.trim().toUpperCase();
  if (!symbol) {
    await ctx.reply(
      "Decime el ticker. Ejemplo: /accion NVDA o /precio AAPL",
      { reply_markup: mainReplyKeyboard() },
    );
    return;
  }
  await ctx.replyWithChatAction("typing").catch(() => undefined);
  try {
    const quote = await getAssetQuote(symbol);
    if (!quote) {
      await ctx.reply(
        `No encontré “${symbol}” en Wallbit. Probá otro ticker (ej. NVDA, AAPL).`,
        { reply_markup: mainReplyKeyboard() },
      );
      return;
    }
    await ctx.reply(formatAssetQuote(quote), {
      reply_markup: mainReplyKeyboard(),
    });
  } catch (err) {
    console.error("[finora] cotización Wallbit error", err);
    await ctx.reply(
      "No pude consultar ese precio en Wallbit ahora. Probá de nuevo en un rato.",
      { reply_markup: mainReplyKeyboard() },
    );
  }
}

/**
 * Track B / digest: notifica una pending_action con riesgos/beneficios + botones.
 * Reexportado vía notifier helpers; el bot también lo usa si hace falta.
 */
export async function sendPendingActionToChat(
  chatId: string,
  action: { id: string; kind: string; payload: Record<string, unknown> },
) {
  const formatted = formatPendingActionMessage(action);
  await sendProactiveMessage(chatId, formatted.text, {
    buttons: formatted.buttons,
  });
}

let cachedBotUsername: string | null = null;

/**
 * Username real del bot para armar el deep link de vinculación. Estaba
 * hardcodeado como "FinoraBot", que apunta a otro bot y rompía el flujo.
 */
export async function getBotUsername(): Promise<string | null> {
  if (env.telegramBotUsername) return env.telegramBotUsername;
  if (cachedBotUsername) return cachedBotUsername;
  const b = getBot();
  if (!b) return null;
  try {
    const me = await b.api.getMe();
    cachedBotUsername = me.username;
    return cachedBotUsername;
  } catch (err) {
    console.error("[finora] no se pudo resolver el username del bot", err);
    return null;
  }
}

/** Mensaje proactivo (sin `ctx`), p. ej. plan listo o digest con botones. */
async function sendProactiveMessage(
  chatId: string,
  text: string,
  options?: { buttons?: { label: string; callbackData: string }[] },
) {
  const b = getBot();
  if (!b) return;
  const chunks = splitForTelegram(text);
  for (let i = 0; i < chunks.length; i++) {
    const isLast = i === chunks.length - 1;
    await b.api.sendMessage(chatId, chunks[i], {
      reply_markup: isLast ? keyboardFromButtons(options?.buttons) : undefined,
    });
  }
}

export function getBot(): Bot | null {
  if (!env.telegramBotToken) return null;
  if (bot) return bot;

  bot = new Bot(env.telegramBotToken);
  registerChannelNotifier("telegram", sendProactiveMessage);

  // Red de seguridad: sin esto, un handler que lanza deja al usuario sin
  // respuesta y el error solo aparece en los logs.
  bot.catch(async ({ error, ctx }) => {
    console.error("[finora] telegram handler error", error);
    try {
      await ctx.reply(userFacingError(error));
    } catch (replyErr) {
      console.error("[finora] no se pudo avisar del error", replyErr);
    }
  });

  bot.command("start", async (ctx) => {
    const payload = ctx.match?.toString() ?? "";
    if (payload.startsWith("link_")) {
      const token = payload.slice("link_".length);
      const userId = ctx.from
        ? await services().repos.profiles.consumeLinkToken(token)
        : null;

      if (!userId || !ctx.from) {
        // Sin este aviso el usuario cree que vinculó y queda en un perfil aparte.
        await ctx.reply(
          "Ese enlace de vinculación no es válido, ya se usó o expiró. Generá uno nuevo desde el dashboard.",
        );
        return;
      }

      const handle = ctx.from.username
        ? `@${ctx.from.username}`
        : (ctx.from.first_name ?? null);
      // Absorbe el perfil que el bot haya creado antes de vincular, así las
      // metas que ya existían en el chat aparecen en el dashboard.
      await services().repos.profiles.linkTelegram(userId, ctx.from.id, handle);
      await ctx.reply(
        "Cuenta vinculada. Tus metas de este chat y las del dashboard son ahora la misma cuenta.\n" +
          "Usá el teclado de abajo o /ayuda.",
        { reply_markup: mainReplyKeyboard() },
      );
      return;
    }
    await resolveUser(ctx);
    await ctx.reply(
      "Hola, soy Finora — tu mentor financiero en Bolivia (Bs).\n" +
        "Tocá /nuevameta para crear una meta y recibir un informe de inversión, " +
        "o usá el teclado: /saldo, /mercado, /progreso, /ayuda.",
      { reply_markup: mainReplyKeyboard() },
    );
  });

  bot.command("ayuda", async (ctx) => {
    await ctx.reply(
      "Comandos:\n" +
        "/start — comenzar\n" +
        "/nuevameta — crear meta + informe de inversión\n" +
        "/cancelar — abortar el wizard de nueva meta\n" +
        "/saldo — saldo / posiciones Wallbit\n" +
        "/accion TICKER — cotización (ej. /accion NVDA)\n" +
        "/precio TICKER — alias de /accion\n" +
        "/meta — ver metas activas\n" +
        "/progreso — avance de la meta prioritaria\n" +
        "/plan — plan de inversión de la meta prioritaria\n" +
        "/microahorro — preparar un aporte chico (requiere confirmación)\n" +
        "/proteger — preparar conversión a USD vía Wallbit (requiere confirmación)\n" +
        "/priorizar — elegir meta prioritaria (ej. /priorizar 1)\n" +
        "/eliminar — archivar meta prioritaria (o /eliminar nombre)\n" +
        "/mercado — resumen corto Wallbit/macro\n" +
        "/ayuda — esta ayuda\n\n" +
        "También podés escribir en lenguaje natural (ej. “¿cuánto está AAPL?”).\n" +
        "Nada de dinero se mueve sin tu OK.",
      { reply_markup: mainReplyKeyboard() },
    );
  });

  bot.command("nuevameta", async (ctx) => {
    try {
      const profile = await resolveUser(ctx);
      const tgId = ctx.from?.id;
      if (!tgId) return;

      const shortcut = parseNewGoalShortcut(ctx.match?.toString() ?? "");
      if (shortcut) {
        clearNewGoalDraft(tgId);
        await createGoalAndScheduleReport(ctx, profile.id, shortcut);
        return;
      }

      newGoalDrafts.set(tgId, { step: "ask_name" });
      await ctx.reply(
        "Vamos a crear una meta.\n" +
          "Decime qué querés lograr. Después te armo un informe de en qué conviene apoyarte " +
          "para llegar más rápido (siempre con tu confirmación si hay que mover plata).\n\n" +
          "Ejemplo: laptop, viaje a Santa Cruz, fondo de emergencia.\n" +
          "Atajo: /nuevameta Laptop 8500 10\n" +
          "Para abortar: /cancelar",
        { reply_markup: mainReplyKeyboard() },
      );
    } catch (err) {
      console.error("[finora] /nuevameta error", err);
      await ctx.reply(userFacingError(err), {
        reply_markup: mainReplyKeyboard(),
      });
    }
  });

  bot.command("cancelar", async (ctx) => {
    const tgId = ctx.from?.id;
    if (tgId && newGoalDrafts.has(tgId)) {
      clearNewGoalDraft(tgId);
      await ctx.reply("Listo, cancelé la creación de la meta.", {
        reply_markup: mainReplyKeyboard(),
      });
      return;
    }
    await ctx.reply("No hay un wizard de meta en curso.", {
      reply_markup: mainReplyKeyboard(),
    });
  });

  bot.command("saldo", async (ctx) => {
    await ctx.replyWithChatAction("typing").catch(() => undefined);
    try {
      const portfolio = await getStocksPortfolio();
      await ctx.reply(formatPortfolioBalance(portfolio), {
        reply_markup: mainReplyKeyboard(),
      });
    } catch (err) {
      console.error("[finora] /saldo error", err);
      await ctx.reply(
        "No pude consultar tu saldo en Wallbit ahora. Probá de nuevo en un rato.",
        { reply_markup: mainReplyKeyboard() },
      );
    }
  });

  bot.command("accion", async (ctx) => {
    await replyAssetQuote(ctx, ctx.match?.toString() ?? "");
  });

  bot.command("precio", async (ctx) => {
    await replyAssetQuote(ctx, ctx.match?.toString() ?? "");
  });

  bot.command("meta", async (ctx) => {
    const profile = await resolveUser(ctx);
    const goals = listActiveGoals(await services().goals.list(profile.id));
    if (!goals.length) {
      await ctx.reply('No tenés metas aún. Escribí por ejemplo: "Quiero comprar una laptop".');
      return;
    }
    const primary = pickPrimaryGoal(goals);
    const lines = goals.map((g, i) => {
      const star = primary && g.id === primary.id ? " ★" : "";
      return `${i + 1}. ${g.name}${star}: ${g.accumulatedBobs}/${g.targetAmountBobs} Bs (${Math.round(g.progressRatio * 100)}%)`;
    });
    await ctx.reply(`Tus metas:\n${lines.join("\n")}\n\n★ = prioritaria (/priorizar N)`);
  });

  bot.command("progreso", async (ctx) => {
    const profile = await resolveUser(ctx);
    const active = await getPrimaryGoal(profile.id);
    if (!active) {
      await ctx.reply("Todavía no hay una meta activa.");
      return;
    }
    const mark = isPrimaryMeta(active) ? " (prioritaria)" : "";
    await ctx.reply(
      `${active.name}${mark}: ${active.accumulatedBobs} de ${active.targetAmountBobs} Bs.\n` +
        `Cuota base sugerida: ${active.baseMonthlyBobs} Bs/mes.`,
    );
  });

  bot.command("plan", async (ctx) => {
    try {
      const profile = await resolveUser(ctx);
      const active = await getPrimaryGoal(profile.id);
      if (!active) {
        await ctx.reply(
          'Todavía no hay una meta. Escribí por ejemplo: "Quiero ahorrar para una laptop".',
        );
        return;
      }

      const analysis = await getGoalAnalysisService().get(profile.id, active.id);
      if (!analysis || analysis.status === "pending") {
        await ctx.reply(
          `Estoy armando el plan de inversión para "${active.name}". ` +
            "En unos segundos te llega solo, o pedime /plan de nuevo.",
        );
        return;
      }
      if (analysis.status === "failed" || !analysis.content) {
        await ctx.reply(
          `No pude completar el análisis de "${active.name}" esta vez. ` +
            "Podés pedirme que lo regenere desde el dashboard o crear otra meta.",
        );
        return;
      }

      await sendReplies(ctx, [
        { type: "text", text: formatAnalysisForChat(active, analysis) },
      ]);
    } catch (err) {
      console.error("[finora] telegram /plan error", err);
      await ctx.reply(userFacingError(err));
    }
  });

  bot.command("microahorro", async (ctx) => {
    try {
      const profile = await resolveUser(ctx);
      const active = await getPrimaryGoal(profile.id);
      if (!active) {
        await ctx.reply(
          "Necesito una meta activa para sugerir un microahorro. Creá una primero.",
        );
        return;
      }

      const amountBobs = defaultMicrosavingAmount(active.baseMonthlyBobs);
      const action = await services().microsavings.suggest({
        userId: profile.id,
        goalId: active.id,
        amountBobs,
        note: "Sugerido desde /microahorro",
        channel: "telegram",
      });

      await sendReplies(ctx, [
        {
          type: "text",
          text:
            `Prepararé un microahorro de Bs ${amountBobs.toLocaleString("es-BO")} ` +
            `para "${active.name}".\n` +
            "No se mueve nada hasta que confirmés.",
          buttons: actionButtons(action.id),
        },
      ]);
    } catch (err) {
      console.error("[finora] telegram /microahorro error", err);
      await ctx.reply(userFacingError(err));
    }
  });

  bot.command("proteger", async (ctx) => {
    try {
      const profile = await resolveUser(ctx);
      const active = await getPrimaryGoal(profile.id);
      if (!active) {
        await ctx.reply(
          "Necesito una meta activa para preparar la protección en dólares.",
        );
        return;
      }

      const remaining = Math.max(
        0,
        active.targetAmountBobs - active.accumulatedBobs,
      );
      const amountBobs = Math.max(
        50,
        Math.min(
          remaining || active.baseMonthlyBobs,
          Math.round(active.baseMonthlyBobs),
        ),
      );

      const action = await services().pendingActions.prepareWallbitConvert({
        userId: profile.id,
        goalId: active.id,
        amountBobs,
        toCurrency: "USD",
        channel: "telegram",
      });

      await sendReplies(ctx, [
        {
          type: "text",
          text:
            `Dejé preparada una conversión Wallbit de Bs ${amountBobs.toLocaleString("es-BO")} → USD ` +
            `para "${active.name}".\n` +
            "Queda lista para tu confirmación. La conversión real requiere cuenta Wallbit; " +
            "si aún no está conectada, al confirmar solo queda registrada la preparación (stub).",
          buttons: actionButtons(action.id),
        },
      ]);
    } catch (err) {
      console.error("[finora] telegram /proteger error", err);
      await ctx.reply(userFacingError(err));
    }
  });

  bot.command("priorizar", async (ctx) => {
    const profile = await resolveUser(ctx);
    const goals = listActiveGoals(await services().goals.list(profile.id));
    if (!goals.length) {
      await ctx.reply("No tenés metas activas para priorizar.");
      return;
    }

    const arg = (ctx.match?.toString() ?? "").trim();
    if (!arg) {
      const primary = pickPrimaryGoal(goals);
      const lines = goals.map((g, i) => {
        const star = primary && g.id === primary.id ? " ★" : "";
        return `${i + 1}. ${g.name}${star}`;
      });
      const kb = new InlineKeyboard();
      for (let i = 0; i < Math.min(goals.length, 5); i++) {
        kb
          .text(
            `${i + 1}. ${goals[i].name}`.slice(0, 40),
            `goal:primary:${goals[i].id}`,
          )
          .row();
      }
      await ctx.reply(
        `¿Cuál priorizamos?\n${lines.join("\n")}\n\nRespondé /priorizar N o tocá un botón.`,
        { reply_markup: kb },
      );
      return;
    }

    const picked = findGoalByNameOrIndex(goals, arg);
    if (!picked) {
      await ctx.reply("No encontré esa meta. Probá /priorizar y elegí el número.");
      return;
    }
    await setPrimaryGoal(profile.id, picked.id);
    await ctx.reply(
      `Listo. “${picked.name}” es ahora tu meta prioritaria.\n` +
        `/progreso, /plan y /microahorro la usan primero.`,
    );
  });

  bot.command("eliminar", async (ctx) => {
    const profile = await resolveUser(ctx);
    const goals = listActiveGoals(await services().goals.list(profile.id));
    if (!goals.length) {
      await ctx.reply("No tenés metas activas para eliminar.");
      return;
    }

    const arg = (ctx.match?.toString() ?? "").trim();
    const target = arg
      ? findGoalByNameOrIndex(goals, arg)
      : pickPrimaryGoal(goals);

    if (!target) {
      await ctx.reply(
        "No encontré esa meta. Usá /meta y después /eliminar nombre o número.",
      );
      return;
    }

    const kb = new InlineKeyboard()
      .text("Sí, archivar", `goal:cancel:${target.id}`)
      .text("No, dejarla", "goal:keep");
    await ctx.reply(
      `¿Seguro que querés archivar “${target.name}”?\n` +
        `No borra el historial: queda cancelada y sale de las listas activas.`,
      { reply_markup: kb },
    );
  });

  bot.command("mercado", async (ctx) => {
    await ctx.replyWithChatAction("typing").catch(() => undefined);
    try {
      const market = await getMarketContext();
      await ctx.reply(formatMarketSummary(market), {
        reply_markup: mainReplyKeyboard(),
      });
    } catch (err) {
      console.error("[finora] /mercado error", err);
      await ctx.reply(
        "No pude armar el resumen de mercado ahora. Probá de nuevo en un rato.",
        { reply_markup: mainReplyKeyboard() },
      );
    }
  });

  bot.on("callback_query:data", async (ctx) => {
    try {
      const profile = await resolveUser(ctx);
      const data = ctx.callbackQuery.data ?? "";

      // Callbacks de metas (solo bot): no pasan por el flujo de dinero del agente.
      if (data === "goal:keep") {
        await ctx.reply("Ok, la meta sigue activa.");
        return;
      }
      if (data.startsWith("goal:cancel:")) {
        const goalId = data.slice("goal:cancel:".length);
        const cancelled = await cancelGoal(profile.id, goalId);
        await ctx.reply(
          `Archivé “${cancelled.name}”. Ya no aparece en metas activas.\n` +
            `Si querés otra prioritaria: /priorizar`,
        );
        return;
      }
      if (data.startsWith("goal:primary:")) {
        const goalId = data.slice("goal:primary:".length);
        const primary = await setPrimaryGoal(profile.id, goalId);
        await ctx.reply(
          `Listo. “${primary.name}” es ahora tu meta prioritaria.`,
        );
        return;
      }

      const result = await runAgentTurn({
        userId: profile.id,
        channel: "telegram",
        text: null,
        callbackData: data,
        externalChatId: String(ctx.chat?.id ?? ctx.from?.id),
      });
      await sendReplies(ctx, result.replies);
    } catch (err) {
      console.error("[finora] telegram callback error", err);
      await ctx.reply(userFacingError(err));
    } finally {
      // Sin esto el botón queda girando indefinidamente cuando algo falla.
      await ctx.answerCallbackQuery().catch(() => undefined);
    }
  });

  bot.on("message:text", async (ctx) => {
    const text = ctx.message.text;
    const tgId = ctx.from?.id;

    // Wizard /nuevameta: textos libres (los /comandos los atienden sus handlers).
    if (tgId && newGoalDrafts.has(tgId)) {
      if (text.startsWith("/")) {
        // Otro comando aborta el borrador; /cancelar lo limpia su propio handler.
        if (!/^\/cancelar(?:@\w+)?\b/i.test(text)) {
          clearNewGoalDraft(tgId);
        }
        return;
      }
      try {
        const handled = await handleNewGoalWizardText(ctx, tgId, text);
        if (handled) return;
      } catch (err) {
        console.error("[finora] wizard nuevameta error", err);
        clearNewGoalDraft(tgId);
        await ctx.reply(userFacingError(err), {
          reply_markup: mainReplyKeyboard(),
        });
        return;
      }
    }

    if (text.startsWith("/")) return;
    try {
      await ctx.replyWithChatAction("typing").catch(() => undefined);
      const profile = await resolveUser(ctx);
      const result = await runAgentTurn({
        userId: profile.id,
        channel: "telegram",
        text,
        externalChatId: String(ctx.chat.id),
      });
      await sendReplies(ctx, result.replies);
    } catch (err) {
      console.error("[finora] telegram message error", err);
      await ctx.reply(userFacingError(err));
    }
  });

  return bot;
}

export function telegramWebhookMiddleware() {
  if (env.telegramMode !== "webhook") return null;
  const b = getBot();
  if (!b) return null;
  return webhookCallback(b, "hono");
}

/**
 * Registra el webhook en Telegram (producción / Render).
 * URL: `${PUBLIC_API_URL}/webhooks/telegram` + secret opcional.
 */
export async function registerTelegramWebhook(): Promise<void> {
  if (env.telegramMode !== "webhook") return;
  const b = getBot();
  if (!b) {
    console.info("[finora] TELEGRAM_BOT_TOKEN vacío — webhook no registrado.");
    return;
  }

  const base = env.publicApiUrl.replace(/\/+$/, "");
  if (!base || base.includes("localhost") || base.includes("127.0.0.1")) {
    console.warn(
      "[finora] PUBLIC_API_URL parece local — no registro webhook. " +
        `Valor actual: ${base || "(vacío)"}`,
    );
    return;
  }

  const url = `${base}/webhooks/telegram`;
  try {
    await b.api.setWebhook(url, {
      secret_token: env.telegramWebhookSecret || undefined,
      drop_pending_updates: false,
    });
    console.info(`[finora] Telegram webhook registrado: ${url}`);
  } catch (err) {
    console.error("[finora] falló setWebhook", err);
    throw err;
  }
}

export async function startTelegramPolling() {
  if (env.telegramMode !== "local") return;
  const b = getBot();
  if (!b) {
    console.info("[finora] TELEGRAM_BOT_TOKEN vacío — bot deshabilitado.");
    return;
  }
  console.info("[finora] Telegram long polling (local).");

  // Sin apagado ordenado, Telegram sigue creyendo que hay un consumidor activo
  // y el siguiente arranque compite con el anterior por los updates.
  const shutdown = (signal: string) => {
    console.info(`[finora] ${signal} recibido — deteniendo bot.`);
    void b.stop();
  };
  process.once("SIGINT", () => shutdown("SIGINT"));
  process.once("SIGTERM", () => shutdown("SIGTERM"));

  await b.start({
    onStart: (info) => console.info(`[finora] Bot @${info.username} online`),
  });
}
