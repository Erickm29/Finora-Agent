import type { AIProvider } from "../types.js";
import { createOpenAiCompatibleProvider } from "./openai-compatible.js";

export function createGroqProvider(apiKey: string, baseUrl: string): AIProvider {
  return createOpenAiCompatibleProvider({
    name: "groq",
    apiKey,
    baseUrl,
  });
}
