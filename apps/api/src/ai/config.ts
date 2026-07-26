import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import type {
  AiProvidersFileConfig,
  ProviderName,
  ResolvedAiConfig,
} from "./types.js";

const DEFAULT_FILE: AiProvidersFileConfig = {
  providers: ["groq", "gemini", "openrouter"],
  models: {
    groq: ["llama-3.3-70b-versatile", "qwen/qwen3-32b"],
    gemini: ["gemini-2.5-flash"],
    openrouter: ["deepseek/deepseek-chat-v3", "qwen/qwen3-32b"],
  },
  retry: { maxAttempts: 3, baseDelayMs: 500 },
  circuitBreaker: { failureThreshold: 3, cooldownMs: 60_000 },
};

const ALL: ProviderName[] = ["groq", "gemini", "openrouter"];

function repoRoot(): string {
  // apps/api/src/ai → ../../../.. = monorepo root? 
  // ai -> src -> api -> apps -> root = ../../../../
  return resolve(fileURLToPath(new URL(".", import.meta.url)), "../../../..");
}

function apiRoot(): string {
  // apps/api/src/ai → ../.. = apps/api
  return resolve(fileURLToPath(new URL(".", import.meta.url)), "../..");
}

function loadFileConfig(): AiProvidersFileConfig {
  const override = process.env.AI_PROVIDERS_CONFIG?.trim();
  const candidates = [
    override
      ? resolve(process.cwd(), override)
      : null,
    override ? resolve(repoRoot(), override) : null,
    resolve(apiRoot(), "config/ai-providers.json"),
    resolve(repoRoot(), "apps/api/config/ai-providers.json"),
  ].filter(Boolean) as string[];

  for (const path of candidates) {
    try {
      const raw = readFileSync(path, "utf8");
      const parsed = JSON.parse(raw) as Partial<AiProvidersFileConfig>;
      return {
        providers: (parsed.providers?.length
          ? parsed.providers
          : DEFAULT_FILE.providers) as ProviderName[],
        models: {
          groq: parsed.models?.groq?.length
            ? parsed.models.groq
            : DEFAULT_FILE.models.groq,
          gemini: parsed.models?.gemini?.length
            ? parsed.models.gemini
            : DEFAULT_FILE.models.gemini,
          openrouter: parsed.models?.openrouter?.length
            ? parsed.models.openrouter
            : DEFAULT_FILE.models.openrouter,
        },
        retry: {
          maxAttempts:
            parsed.retry?.maxAttempts ?? DEFAULT_FILE.retry.maxAttempts,
          baseDelayMs:
            parsed.retry?.baseDelayMs ?? DEFAULT_FILE.retry.baseDelayMs,
        },
        circuitBreaker: {
          failureThreshold:
            parsed.circuitBreaker?.failureThreshold ??
            DEFAULT_FILE.circuitBreaker.failureThreshold,
          cooldownMs:
            parsed.circuitBreaker?.cooldownMs ??
            DEFAULT_FILE.circuitBreaker.cooldownMs,
        },
      };
    } catch {
      // try next candidate
    }
  }
  return DEFAULT_FILE;
}

function normalizeOrder(
  providers: ProviderName[],
  defaultProvider?: string,
): ProviderName[] {
  const seen = new Set<ProviderName>();
  const order: ProviderName[] = [];
  for (const p of providers) {
    if (ALL.includes(p) && !seen.has(p)) {
      seen.add(p);
      order.push(p);
    }
  }
  for (const p of ALL) {
    if (!seen.has(p)) order.push(p);
  }

  const preferred = (defaultProvider ?? "").toLowerCase() as ProviderName;
  if (ALL.includes(preferred)) {
    return [preferred, ...order.filter((p) => p !== preferred)];
  }
  return order;
}

export function loadAiConfig(): ResolvedAiConfig {
  const file = loadFileConfig();
  const order = normalizeOrder(file.providers, process.env.DEFAULT_PROVIDER);

  // Env GEMINI_MODEL can prepend preferred gemini model
  const geminiModels = [...file.models.gemini];
  const envGemini = process.env.GEMINI_MODEL?.trim();
  if (envGemini && !geminiModels.includes(envGemini)) {
    geminiModels.unshift(envGemini);
  }

  return {
    order,
    models: {
      groq: file.models.groq,
      gemini: geminiModels,
      openrouter: file.models.openrouter,
    },
    retry: file.retry,
    circuitBreaker: file.circuitBreaker,
    providers: {
      groq: {
        apiKey: process.env.GROQ_API_KEY ?? "",
        baseUrl:
          process.env.GROQ_BASE_URL?.trim() ||
          "https://api.groq.com/openai/v1",
      },
      gemini: {
        apiKey: process.env.GEMINI_API_KEY ?? "",
        baseUrl:
          process.env.GEMINI_BASE_URL?.trim() ||
          "https://generativelanguage.googleapis.com/v1beta/openai/",
      },
      openrouter: {
        apiKey: process.env.OPENROUTER_API_KEY ?? "",
        baseUrl:
          process.env.OPENROUTER_BASE_URL?.trim() ||
          "https://openrouter.ai/api/v1",
      },
    },
  };
}

export function configuredProviders(config: ResolvedAiConfig): ProviderName[] {
  return config.order.filter((name) => Boolean(config.providers[name].apiKey));
}
