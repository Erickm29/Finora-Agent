import { Bot, type Context, InlineKeyboard, webhookCallback } from "grammy";
import { randomUUID } from "node:crypto";
import { FinoraError } from "@finora/shared";
import { env } from "../env.js";
import { services } from "../container.js";
import { runAgentTurn, type AgentReply } from "../agent/runtime.js";

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

export function getBot(): Bot | null {
  if (!env.telegramBotToken) return null;
  if (bot) return bot;

  bot = new Bot(env.telegramBotToken);

  bot.command("start", async (ctx) => {
    const payload = ctx.match?.toString() ?? "";
    if (payload.startsWith("link_")) {
      const token = payload.slice("link_".length);
      const linkStore = (globalThis as unknown as { __finoraLinks?: Map<string, string> })
        .__finoraLinks;
      const userId = linkStore?.get(token);
      if (userId && ctx.from) {
        await services().repos.profiles.linkTelegram(userId, ctx.from.id);
        linkStore?.delete(token);
        await ctx.reply("Cuenta vinculada. Ya podés ver tus metas en el dashboard.");
        return;
      }
      // Sin este aviso el usuario cree que vinculó y queda en un perfil aparte.
      await ctx.reply(
        "Ese enlace de vinculación no es válido o ya expiró. Generá uno nuevo desde el dashboard.",
      );
      return;
    }
    await resolveUser(ctx);
    await ctx.reply(
      "Hola, soy Finora — tu mentor financiero en Bolivia (Bs).\n" +
        "Contame tu meta o usá /meta, /progreso, /ayuda.",
    );
  });

  bot.command("ayuda", async (ctx) => {
    await ctx.reply(
      "Comandos:\n/start — comenzar\n/meta — ver o crear meta\n/progreso — avance\n/ayuda — esta ayuda\n\nTambién podés escribir en lenguaje natural.",
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
    const goals = await services().goals.list(profile.id);
    const active = goals.find((g) => g.status === "active") ?? goals[0];
    if (!active) {
      await ctx.reply("Todavía no hay una meta activa.");
      return;
    }
    await ctx.reply(
      `${active.name}: ${active.accumulatedBobs} de ${active.targetAmountBobs} Bs.\n` +
        `Cuota base sugerida: ${active.baseMonthlyBobs} Bs/mes.`,
    );
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
