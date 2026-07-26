import {
  AIProviderManager,
  getAIProviderManager,
  resetAIProviderManagerForTests,
} from "./manager.js";
import type { AiStatsSnapshot } from "./stats.js";
import type {
  ChatCompletionResult,
  ChatMessage,
  ChatOptions,
  ProviderName,
} from "./types.js";
import { configuredProviders, loadAiConfig } from "./config.js";

export type {
  ChatCompletionResult,
  ChatMessage,
  ChatOptions,
  ProviderName,
  AIProvider,
} from "./types.js";
export {
  AllProvidersFailedError,
  ProviderError,
  isFailoverError,
} from "./errors.js";
export { AIProviderManager, getAIProviderManager, resetAIProviderManagerForTests };

/**
 * Facade used by the agent runtime (and any caller):
 *   await ai.chat(messages, { tools })
 *   await ai.generate(prompt)
 */
export const ai = {
  chat(
    messages: ChatMessage[],
    options?: ChatOptions,
  ): Promise<ChatCompletionResult> {
    return getAIProviderManager().chat(messages, options);
  },

  generate(
    prompt: string,
    options?: ChatOptions,
  ): Promise<{ text: string; provider: ProviderName; model: string }> {
    return getAIProviderManager().generate(prompt, options);
  },

  getStats(): AiStatsSnapshot {
    return getAIProviderManager().stats.snapshot();
  },

  hasAnyProvider(): boolean {
    return getAIProviderManager().hasAnyProvider();
  },

  configuredProviders(): ProviderName[] {
    return configuredProviders(loadAiConfig());
  },
};
