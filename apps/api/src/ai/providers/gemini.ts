import type { AIProvider } from "../types.js";
import { createOpenAiCompatibleProvider } from "./openai-compatible.js";

export function createGeminiProvider(
  apiKey: string,
  baseUrl: string,
): AIProvider {
  return createOpenAiCompatibleProvider({
    name: "gemini",
    apiKey,
    baseUrl,
  });
}
