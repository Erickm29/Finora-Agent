import type OpenAI from "openai";

export type ProviderName = "groq" | "gemini" | "openrouter";

export type ChatMessage = OpenAI.Chat.Completions.ChatCompletionMessageParam;

export type ChatTool = OpenAI.Chat.Completions.ChatCompletionTool;

export interface ChatOptions {
  tools?: ChatTool[];
  /** Force a single model; otherwise manager walks the provider model list. */
  model?: string;
  signal?: AbortSignal;
}

export interface ChatCompletionResult {
  message: OpenAI.Chat.Completions.ChatCompletionMessage;
  provider: ProviderName;
  model: string;
  latencyMs: number;
}

export interface AIProvider {
  readonly name: ProviderName;
  chat(
    messages: ChatMessage[],
    options: ChatOptions & { model: string },
  ): Promise<ChatCompletionResult>;
}

export interface ProviderModels {
  groq: string[];
  gemini: string[];
  openrouter: string[];
}

export interface AiProvidersFileConfig {
  providers: ProviderName[];
  models: ProviderModels;
  retry: {
    maxAttempts: number;
    baseDelayMs: number;
  };
  circuitBreaker: {
    failureThreshold: number;
    cooldownMs: number;
  };
}

export interface ProviderRuntimeConfig {
  apiKey: string;
  baseUrl: string;
}

export interface ResolvedAiConfig {
  order: ProviderName[];
  models: ProviderModels;
  retry: { maxAttempts: number; baseDelayMs: number };
  circuitBreaker: { failureThreshold: number; cooldownMs: number };
  providers: Record<ProviderName, ProviderRuntimeConfig>;
}
