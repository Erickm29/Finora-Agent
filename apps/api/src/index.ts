import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { assertRuntimeEnv, env } from "./env.js";
import { v1 } from "./routes/v1.js";
import {
  getBot,
  startTelegramPolling,
  telegramWebhookMiddleware,
} from "./bot/telegram.js";

assertRuntimeEnv();

const app = new Hono();
app.use("*", cors());

app.get("/health", (c) =>
  c.json({
    ok: true,
    service: "finora-api",
    memoryStore: env.useMemory,
    supabase: !env.useMemory && Boolean(env.supabaseUrl),
    telegram: Boolean(env.telegramBotToken),
    gemini: Boolean(env.geminiApiKey),
  }),
);

app.route("/v1", v1);

const webhook = telegramWebhookMiddleware();
if (webhook) {
  app.post("/webhooks/telegram", async (c) => {
    if (
      env.telegramWebhookSecret &&
      c.req.header("x-telegram-bot-api-secret-token") !==
        env.telegramWebhookSecret
    ) {
      return c.json({ error: "invalid secret" }, 401);
    }
    return webhook(c);
  });
}

serve({ fetch: app.fetch, port: env.port }, (info) => {
  console.info(`[finora] API listening on http://localhost:${info.port}`);
  console.info(`[finora] GET /health`);
});

// Start bot polling without blocking HTTP server
void (async () => {
  try {
    getBot();
    if (env.telegramMode === "local") {
      await startTelegramPolling();
    } else if (env.telegramBotToken) {
      console.info(
        `[finora] Webhook mode — set Telegram webhook to ${env.publicApiUrl}/webhooks/telegram`,
      );
    }
  } catch (err) {
    console.error("[finora] Telegram bootstrap error", err);
  }
})();

export default app;
