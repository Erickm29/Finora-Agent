import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { CircuitBreaker } from "./circuit-breaker.js";
import {
  AllProvidersFailedError,
  isFailoverError,
  ProviderError,
} from "./errors.js";
import { AIProviderManager } from "./manager.js";
import type {
  AIProvider,
  ChatCompletionResult,
  ChatMessage,
  ChatOptions,
  ProviderName,
  ResolvedAiConfig,
} from "./types.js";

function baseConfig(overrides?: Partial<ResolvedAiConfig>): ResolvedAiConfig {
  return {
    order: ["groq", "gemini", "openrouter"],
    models: {
      groq: ["llama-test"],
      gemini: ["gemini-test"],
      openrouter: ["or-test"],
    },
    retry: { maxAttempts: 2, baseDelayMs: 1 },
    circuitBreaker: { failureThreshold: 2, cooldownMs: 60_000 },
    providers: {
      groq: { apiKey: "x", baseUrl: "http://localhost" },
      gemini: { apiKey: "x", baseUrl: "http://localhost" },
      openrouter: { apiKey: "x", baseUrl: "http://localhost" },
    },
    ...overrides,
  };
}

function mockProvider(
  name: ProviderName,
  impl: (
    messages: ChatMessage[],
    options: ChatOptions & { model: string },
  ) => Promise<ChatCompletionResult> | ChatCompletionResult,
): AIProvider {
  return {
    name,
    async chat(messages, options) {
      return impl(messages, options);
    },
  };
}

function okResult(
  provider: ProviderName,
  model: string,
  text = "hola",
): ChatCompletionResult {
  return {
    provider,
    model,
    latencyMs: 5,
    message: { role: "assistant", content: text, refusal: null },
  };
}

describe("isFailoverError", () => {
  it("treats 429/500/502/503 as failover", () => {
    assert.equal(isFailoverError(new ProviderError("x", { status: 429, retriable: true })), true);
    assert.equal(isFailoverError({ status: 429, message: "rate" }), true);
    assert.equal(isFailoverError({ status: 500 }), true);
    assert.equal(isFailoverError({ status: 502 }), true);
    assert.equal(isFailoverError({ status: 503 }), true);
  });

  it("treats timeout/connection messages as failover", () => {
    assert.equal(isFailoverError(new Error("connect ETIMEDOUT")), true);
    assert.equal(isFailoverError(new Error("fetch failed")), true);
    assert.equal(isFailoverError({ code: "ECONNRESET" }), true);
  });

  it("does not failover on 400 validation", () => {
    assert.equal(isFailoverError({ status: 400, message: "bad request" }), false);
    assert.equal(
      isFailoverError(new ProviderError("invalid json", { status: 400, retriable: false })),
      false,
    );
  });
});

describe("CircuitBreaker", () => {
  it("opens after threshold and skips until cooldown", () => {
    const cb = new CircuitBreaker({ failureThreshold: 2, cooldownMs: 60_000 });
    assert.equal(cb.canRequest("groq"), true);
    cb.recordFailure("groq");
    assert.equal(cb.getState("groq"), "closed");
    cb.recordFailure("groq");
    assert.equal(cb.getState("groq"), "open");
    assert.equal(cb.canRequest("groq"), false);
    cb.recordSuccess("groq");
    assert.equal(cb.getState("groq"), "closed");
  });
});

describe("AIProviderManager", () => {
  it("failovers from Groq 429 to Gemini success", async () => {
    const providers = new Map<ProviderName, AIProvider>([
      [
        "groq",
        mockProvider("groq", () => {
          throw new ProviderError("rate limit", {
            status: 429,
            provider: "groq",
            retriable: true,
          });
        }),
      ],
      [
        "gemini",
        mockProvider("gemini", (_m, opts) => okResult("gemini", opts.model, "ok")),
      ],
    ]);

    const mgr = new AIProviderManager(
      baseConfig({ order: ["groq", "gemini"] }),
      providers,
    );
    const result = await mgr.chat([{ role: "user", content: "hi" }]);
    assert.equal(result.provider, "gemini");
    assert.equal(result.message.content, "ok");
    assert.equal(mgr.stats.snapshot().byProvider.groq.failovers > 0, true);
  });

  it("does not failover on non-retriable 400", async () => {
    const providers = new Map<ProviderName, AIProvider>([
      [
        "groq",
        mockProvider("groq", () => {
          throw new ProviderError("bad request", {
            status: 400,
            provider: "groq",
            retriable: false,
          });
        }),
      ],
      [
        "gemini",
        mockProvider("gemini", () => okResult("gemini", "gemini-test")),
      ],
    ]);

    const mgr = new AIProviderManager(
      baseConfig({ order: ["groq", "gemini"] }),
      providers,
    );
    await assert.rejects(
      () => mgr.chat([{ role: "user", content: "hi" }]),
      (err: unknown) => err instanceof ProviderError && err.status === 400,
    );
  });

  it("throws AllProvidersFailedError when all fail", async () => {
    const fail = (name: ProviderName) =>
      mockProvider(name, () => {
        throw new ProviderError("down", {
          status: 503,
          provider: name,
          retriable: true,
        });
      });

    const mgr = new AIProviderManager(
      baseConfig(),
      new Map([
        ["groq", fail("groq")],
        ["gemini", fail("gemini")],
        ["openrouter", fail("openrouter")],
      ]),
    );

    await assert.rejects(
      () => mgr.chat([{ role: "user", content: "hi" }]),
      (err: unknown) => err instanceof AllProvidersFailedError,
    );
  });

  it("skips provider when circuit is open", async () => {
    let groqCalls = 0;
    const providers = new Map<ProviderName, AIProvider>([
      [
        "groq",
        mockProvider("groq", () => {
          groqCalls += 1;
          throw new ProviderError("429", {
            status: 429,
            provider: "groq",
            retriable: true,
          });
        }),
      ],
      [
        "gemini",
        mockProvider("gemini", (_m, opts) => okResult("gemini", opts.model)),
      ],
    ]);

    const mgr = new AIProviderManager(
      baseConfig({
        order: ["groq", "gemini"],
        circuitBreaker: { failureThreshold: 1, cooldownMs: 60_000 },
        retry: { maxAttempts: 1, baseDelayMs: 1 },
      }),
      providers,
    );

    // First call: groq fails → circuit opens → gemini succeeds
    await mgr.chat([{ role: "user", content: "1" }]);
    const afterFirst = groqCalls;

    // Second call: groq circuit open → skip
    await mgr.chat([{ role: "user", content: "2" }]);
    assert.equal(groqCalls, afterFirst);
  });
});
