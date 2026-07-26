import OpenAI from "openai";
import type {
  AIProvider,
  ChatCompletionResult,
  ChatMessage,
  ChatOptions,
  ProviderName,
} from "../types.js";
import { toProviderError } from "../errors.js";

export function createOpenAiCompatibleProvider(opts: {
  name: ProviderName;
  apiKey: string;
  baseUrl: string;
  defaultHeaders?: Record<string, string>;
}): AIProvider {
  const client = new OpenAI({
    apiKey: opts.apiKey,
    baseURL: opts.baseUrl,
    defaultHeaders: opts.defaultHeaders,
  });

  return {
    name: opts.name,
    async chat(
      messages: ChatMessage[],
      options: ChatOptions & { model: string },
    ): Promise<ChatCompletionResult> {
      const started = Date.now();
      try {
        const completion = await client.chat.completions.create(
          {
            model: options.model,
            messages,
            tools: options.tools?.length ? options.tools : undefined,
          },
          options.signal ? { signal: options.signal } : undefined,
        );
        const message = completion.choices[0]?.message;
        if (!message) {
          throw toProviderError(
            new Error("Empty completion from provider"),
            opts.name,
          );
        }
        return {
          message,
          provider: opts.name,
          model: options.model,
          latencyMs: Date.now() - started,
        };
      } catch (err) {
        throw toProviderError(err, opts.name);
      }
    },
  };
}
