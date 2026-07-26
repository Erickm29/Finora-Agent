import { Bot, type Context, InlineKeyboard, webhookCallback } from "grammy";
import { randomUUID } from "node:crypto";
import { FinoraError } from "@finora/shared";
import { env } from "../env.js";
import { getGoalAnalysisService, services } from "../container.js";
import { formatAnalysisForChat } from "../analysis/format.js";
import { runAgentTurn, type AgentReply } from "../agent/runtime.js";
import { registerChannelNotifier } from "../agent/notifier.js";

let bot: Bot | null = null;

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

/** Misma regla que /progreso: meta activa, o la primera si no hay status active. */
async function getPrimaryGoal(userId: string) {
  const goals = await services().goals.list(userId);
  return goals.find((g) => g.status === "active") ?? goals[0] ?? null;
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

/** Mensaje proactivo (sin `ctx`), por ejemplo el plan de inversión ya listo. */
async function sendProactiveMessage(chatId: string, text: string) {
  const b = getBot();
  if (!b) return;
  for (const chunk of splitForTelegram(text)) {
    await b.api.sendMessage(chatId, chunk);
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
        "Cuenta vinculada. Tus metas de este chat y las del dashboard son ahora la misma cuenta.",
      );
      return;
    }
    await resolveUser(ctx);
    await ctx.reply(
      "Hola, soy Finora — tu mentor financiero en Bolivia (Bs).\n" +
        "Contame tu meta o usá /meta, /progreso, /plan, /microahorro, /proteger, /ayuda.",
    );
  });

  bot.command("ayuda", async (ctx) => {
    await ctx.reply(
      "Comandos:\n" +
        "/start — comenzar\n" +
        "/meta — ver tus metas\n" +
        "/progreso — avance de la meta activa\n" +
        "/plan — plan de inversión de la meta activa\n" +
        "/microahorro — preparar un aporte chico (requiere confirmación)\n" +
        "/proteger — preparar conversión a USD vía Wallbit (requiere confirmación)\n" +
        "/ayuda — esta ayuda\n\n" +
        "También podés escribir en lenguaje natural. Nada de dinero se mueve sin tu OK.",
    );
  });

  bot.command("meta", async (ctx) => {
    const profile = await resolveUser(ctx);
    const goals = await services().goals.list(profile.id);
    if (!goals.length) {
      await ctx.reply('No tenés metas aún. Escribí por ejemplo: "Quiero comprar una laptop".');
      return;
    }
    const lines = goals.map(
      (g) =>
        `• ${g.name}: ${g.accumulatedBobs}/${g.targetAmountBobs} Bs (${Math.round(g.progressRatio * 100)}%)`,
    );
    await ctx.reply(`Tus metas:\n${lines.join("\n")}`);
  });

  bot.command("progreso", async (ctx) => {
    const profile = await resolveUser(ctx);
    const active = await getPrimaryGoal(profile.id);
    if (!active) {
      await ctx.reply("Todavía no hay una meta activa.");
      return;
    }
    await ctx.reply(
      `${active.name}: ${active.accumulatedBobs} de ${active.targetAmountBobs} Bs.\n` +
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

  bot.on("callback_query:data", async (ctx) => {
    try {
      const profile = await resolveUser(ctx);
      const result = await runAgentTurn({
        userId: profile.id,
        channel: "telegram",
        text: null,
        callbackData: ctx.callbackQuery.data,
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
    if (ctx.message.text.startsWith("/")) return;
    try {
      await ctx.replyWithChatAction("typing").catch(() => undefined);
      const profile = await resolveUser(ctx);
      const result = await runAgentTurn({
        userId: profile.id,
        channel: "telegram",
        text: ctx.message.text,
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
