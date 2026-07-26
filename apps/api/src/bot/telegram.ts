import { Bot, InlineKeyboard, webhookCallback } from "grammy";
import { randomUUID } from "node:crypto";
import { env } from "../env.js";
import { services } from "../container.js";
import { runAgentTurn } from "../agent/runtime.js";

let bot: Bot | null = null;

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
    const profile = await resolveUser(ctx);
    const data = ctx.callbackQuery.data;
    const result = await runAgentTurn({
      userId: profile.id,
      channel: "telegram",
      text: null,
      callbackData: data,
      externalChatId: String(ctx.chat?.id ?? ctx.from?.id),
    });
    await ctx.answerCallbackQuery();
    for (const reply of result.replies) {
      await ctx.reply(reply.text, {
        reply_markup: keyboardFromButtons(reply.buttons),
      });
    }
  });

  bot.on("message:text", async (ctx) => {
    if (ctx.message.text.startsWith("/")) return;
    try {
      const profile = await resolveUser(ctx);
      const result = await runAgentTurn({
        userId: profile.id,
        channel: "telegram",
        text: ctx.message.text,
        externalChatId: String(ctx.chat.id),
      });
      for (const reply of result.replies) {
        await ctx.reply(reply.text, {
          reply_markup: keyboardFromButtons(reply.buttons),
        });
      }
    } catch (err) {
      console.error("[finora] telegram message error", err);
      const msg =
        err && typeof err === "object" && "message" in err
          ? String((err as { message: string }).message)
          : "Hubo un problema procesando tu mensaje.";
      await ctx.reply(msg.slice(0, 400));
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
  await b.start({
    onStart: (info) => console.info(`[finora] Bot @${info.username} online`),
  });
}
