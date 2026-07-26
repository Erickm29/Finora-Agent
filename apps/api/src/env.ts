import { config as loadEnv } from "dotenv";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(fileURLToPath(new URL(".", import.meta.url)), "../../..");
loadEnv({ path: resolve(root, ".env") });

function required(name: string, fallback?: string): string {
  const v = process.env[name] ?? fallback;
  if (v === undefined || v === "") {
    throw new Error(`Missing env ${name}`);
  }
  return v;
}

export const env = {
  port: Number(process.env.PORT ?? 3001),
  nodeEnv: process.env.NODE_ENV ?? "development",
  telegramMode: (process.env.TELEGRAM_MODE ?? "local") as "local" | "webhook",
  publicApiUrl: process.env.PUBLIC_API_URL ?? "http://localhost:3001",
  webAppUrl: process.env.WEB_APP_URL ?? "http://localhost:3000",
  useMemory:
    process.env.USE_MEMORY_STORE === "true" ||
    !process.env.SUPABASE_URL ||
    process.env.SUPABASE_URL.includes("your-project"),
  supabaseUrl: process.env.SUPABASE_URL ?? "",
  supabaseAnonKey: process.env.SUPABASE_ANON_KEY ?? "",
  supabaseServiceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY ?? "",
  telegramBotToken: process.env.TELEGRAM_BOT_TOKEN ?? "",
  telegramWebhookSecret: process.env.TELEGRAM_WEBHOOK_SECRET ?? "",
  /** Opcional: si falta se resuelve con getMe al armar el deep link. */
  telegramBotUsername: process.env.TELEGRAM_BOT_USERNAME ?? "",
  geminiApiKey: process.env.GEMINI_API_KEY ?? "",
  geminiModel: process.env.GEMINI_MODEL ?? "gemini-2.5-flash",
  geminiBaseUrl:
    process.env.GEMINI_BASE_URL ??
    "https://generativelanguage.googleapis.com/v1beta/openai/",
  groqApiKey: process.env.GROQ_API_KEY ?? "",
  groqBaseUrl:
    process.env.GROQ_BASE_URL ?? "https://api.groq.com/openai/v1",
  openRouterApiKey: process.env.OPENROUTER_API_KEY ?? "",
  openRouterBaseUrl:
    process.env.OPENROUTER_BASE_URL ?? "https://openrouter.ai/api/v1",
  defaultProvider: process.env.DEFAULT_PROVIDER ?? "",
  aiProvidersConfig: process.env.AI_PROVIDERS_CONFIG ?? "",
  firecrawlApiKey: process.env.FIRECRAWL_API_KEY ?? "",
  exaApiKey: process.env.EXA_API_KEY ?? "",
  wallbitApiKey: process.env.WALLBIT_API_KEY ?? "",
  wallbitApiUrl: process.env.WALLBIT_API_URL ?? "",
  elevenLabsApiKey: process.env.ELEVENLABS_API_KEY ?? "",
  elevenLabsVoiceId: process.env.ELEVENLABS_VOICE_ID ?? "",
};

export function assertRuntimeEnv() {
  if (!env.useMemory) {
    required("SUPABASE_URL");
    required("SUPABASE_SERVICE_ROLE_KEY");
  }
}
