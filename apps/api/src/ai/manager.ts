import { CircuitBreaker } from "./circuit-breaker.js";
import { configuredProviders, loadAiConfig } from "./config.js";
import {
  AllProvidersFailedError,
  errorMessage,
  extractStatus,
  isFailoverError,
  toProviderError,
} from "./errors.js";
import { createGeminiProvider } from "./providers/gemini.js";
import { createGroqProvider } from "./providers/groq.js";
import { createOpenRouterProvider } from "./providers/openrouter.js";
import { AiStats } from "./stats.js";
import type {
  AIProvider,
  ChatCompletionResult,
  ChatMessage,
  ChatOptions,
  ProviderName,
  ResolvedAiConfig,
} from "./types.js";

function displayName(name: ProviderName): string {
  switch (name) {
    case "groq":
      return "Groq";
    case "gemini":
      return "Gemini";
    case "openrouter":
      return "OpenRouter";
  }
}

async function sleep(ms: number) {
  await new Promise((r) => setTimeout(r, ms));
}

export class AIProviderManager {
  private readonly config: ResolvedAiConfig;
  private readonly providers = new Map<ProviderName, AIProvider>();
  private readonly breaker: CircuitBreaker;
  readonly stats = new AiStats();

  constructor(
    config: ResolvedAiConfig = loadAiConfig(),
    injectedProviders?: Map<ProviderName, AIProvider>,
  ) {
    this.config = config;
    this.breaker = new CircuitBreaker(config.circuitBreaker);

    if (injectedProviders) {
      for (const [name, provider] of injectedProviders) {
        this.providers.set(name, provider);
      }
      return;
    }

    const g = config.providers.groq;
    if (g.apiKey) {
      this.providers.set("groq", createGroqProvider(g.apiKey, g.baseUrl));
    }
    const gem = config.providers.gemini;
    if (gem.apiKey) {
      this.providers.set(
        "gemini",
        createGeminiProvider(gem.apiKey, gem.baseUrl),
      );
    }
    const or = config.providers.openrouter;
    if (or.apiKey) {
      this.providers.set(
        "openrouter",
        createOpenRouterProvider(or.apiKey, or.baseUrl),
      );
    }
  }

  hasAnyProvider(): boolean {
    return this.providers.size > 0;
  }

  configuredNames(): ProviderName[] {
    return configuredProviders(this.config);
  }

  /**
   * Chat with automatic provider/model failover for infrastructure errors only.
   */
  async chat(
    messages: ChatMessage[],
    options: ChatOptions = {},
  ): Promise<ChatCompletionResult> {
    const failures: Array<{
      provider: ProviderName;
      model?: string;
      error: string;
    }> = [];

    const order = this.config.order.filter((name) => this.providers.has(name));
    if (!order.length) {
      throw new AllProvidersFailedError([
        {
          provider: "gemini",
          error: "No AI providers configured (missing API keys)",
        },
      ]);
    }

    for (const name of order) {
      const provider = this.providers.get(name)!;
      const label = displayName(name);

      if (!this.breaker.canRequest(name)) {
        console.info(
          `[AI] Skipping ${label} (circuit ${this.breaker.getState(name)})`,
        );
        failures.push({
          provider: name,
          error: `circuit ${this.breaker.getState(name)}`,
        });
        continue;
      }

      console.info(`[AI] Trying ${label}...`);

      const models = options.model
        ? [options.model]
        : this.config.models[name];

      let providerHadFailoverFailure = false;

      for (const model of models) {
        try {
          const result = await this.chatWithRetry(
            provider,
            messages,
            { ...options, model },
            label,
          );
          this.breaker.recordSuccess(name);
          this.stats.recordSuccess(name, model, result.latencyMs);
          console.info(`[AI] ${label} success.`);
          return result;
        } catch (err) {
          const pe = toProviderError(err, name);
          const status = pe.status ?? extractStatus(err);
          const failover = isFailoverError(pe);

          if (!failover) {
            console.error(
              `[AI] ${label} non-failover error (${status ?? "n/a"}): ${pe.message}`,
            );
            this.stats.recordError(name, false);
            throw pe;
          }

          providerHadFailoverFailure = true;
          this.stats.recordError(name, true);
          console.warn(
            `[AI] ${label} failed (${status ?? "error"}) on ${model}`,
          );
          failures.push({
            provider: name,
            model,
            error: `${status ?? "error"}: ${pe.message.slice(0, 200)}`,
          });
          // try next model for same provider
        }
      }

      if (providerHadFailoverFailure) {
        this.breaker.recordFailure(name);
        console.info(`[AI] Switching to next provider...`);
      }
    }

    throw new AllProvidersFailedError(failures);
  }

  async generate(
    prompt: string,
    options: ChatOptions = {},
  ): Promise<{ text: string; provider: ProviderName; model: string }> {
    const result = await this.chat([{ role: "user", content: prompt }], options);
    const raw = result.message.content;
    const text = typeof raw === "string" ? raw : raw == null ? "" : String(raw);
    return { text, provider: result.provider, model: result.model };
  }

  private async chatWithRetry(
    provider: AIProvider,
    messages: ChatMessage[],
    options: ChatOptions & { model: string },
    label: string,
  ): Promise<ChatCompletionResult> {
    const { maxAttempts, baseDelayMs } = this.config.retry;
    let lastErr: unknown;

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      if (attempt > 0) {
        const delay = baseDelayMs * 2 ** (attempt - 1);
        console.warn(
          `[AI] ${label} retry ${attempt}/${maxAttempts - 1} in ${delay}ms`,
        );
        await sleep(delay);
      }
      try {
        return await provider.chat(messages, options);
      } catch (err) {
        lastErr = err;
        if (!isFailoverError(err) || attempt >= maxAttempts - 1) {
          throw err;
        }
      }
    }
    throw lastErr;
  }
}

let singleton: AIProviderManager | null = null;

export function getAIProviderManager(): AIProviderManager {
  if (!singleton) singleton = new AIProviderManager();
  return singleton;
}

/** Test helper — reset singleton between unit tests. */
export function resetAIProviderManagerForTests(
  manager?: AIProviderManager | null,
): void {
  singleton = manager ?? null;
}

export function errorSummary(err: unknown): string {
  return errorMessage(err);
}
