import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { assertRuntimeEnv, env } from "./env.js";
import { v1 } from "./routes/v1.js";
import { ai } from "./ai/index.js";
import {
  getBot,
  registerTelegramWebhook,
  startTelegramPolling,
  telegramWebhookMiddleware,
} from "./bot/telegram.js";
import { startDigestScheduler } from "./jobs/digest-scheduler.js";

assertRuntimeEnv();

/** Local Vite + legacy Next defaults. */
const LOCAL_CORS_ORIGINS = [
  "http://localhost:5173",
  "http://127.0.0.1:5173",
  "http://localhost:3000",
  "http://127.0.0.1:3000",
];

function splitOrigins(raw: string | undefined): string[] {
  if (!raw?.trim()) return [];
  return raw
    .split(",")
    .map((o) => o.trim().replace(/\/+$/, ""))
    .filter(Boolean);
}

/**
 * Orígenes del dashboard (Vercel) + local.
 * `WEB_APP_URL` y `CORS_ORIGINS` aceptan varios valores separados por coma.
 */
function corsOrigins(): string[] {
  const fromEnv = [
    ...splitOrigins(env.webAppUrl),
    ...splitOrigins(process.env.CORS_ORIGINS),
  ];
  return [...new Set([...LOCAL_CORS_ORIGINS, ...fromEnv])];
}

function isAllowedCorsOrigin(origin: string, allowed: string[]): boolean {
  if (allowed.includes(origin)) return true;
  // Previews / aliases de Vercel sin listar cada URL en Render.
  try {
    const host = new URL(origin).hostname;
    return host === "vercel.app" || host.endsWith(".vercel.app");
  } catch {
    return false;
  }
}

const allowedCorsOrigins = corsOrigins();

const app = new Hono();
app.use(
  "*",
  cors({
    origin: (origin) => {
      if (!origin) return allowedCorsOrigins[0] ?? "*";
      return isAllowedCorsOrigin(origin, allowedCorsOrigins) ? origin : null;
    },
    allowHeaders: [
      "Content-Type",
      "Authorization",
      "X-User-Id",
      "X-Requested-With",
    ],
    allowMethods: ["GET", "POST", "PATCH", "PUT", "DELETE", "OPTIONS"],
    credentials: true,
  }),
);

app.get("/health", (c) => {
  const stats = ai.getStats();
  return c.json({
    ok: true,
    service: "finora-api",
    memoryStore: env.useMemory,
    supabase: !env.useMemory && Boolean(env.supabaseUrl),
    telegram: Boolean(env.telegramBotToken),
    gemini: Boolean(env.geminiApiKey),
    ai: {
      configured: ai.configuredProviders(),
      lastProvider: stats.lastProvider,
      lastModel: stats.lastModel,
      byProvider: stats.byProvider,
    },
  });
});

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
  console.info(
    `[finora] CORS allowlist: ${allowedCorsOrigins.join(", ")} (+ *.vercel.app)`,
  );
});

// Start bot without blocking HTTP server
void (async () => {
  try {
    getBot();
    if (env.telegramMode === "local") {
      await startTelegramPolling();
    } else if (env.telegramBotToken) {
      await registerTelegramWebhook();
    }
  } catch (err) {
    console.error("[finora] Telegram bootstrap error", err);
  }
})();

// Digest Wallbit: loop local (~60s). Solo prepara pending_actions.
startDigestScheduler();

export default app;
