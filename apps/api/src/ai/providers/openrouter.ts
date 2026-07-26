import type { AIProvider } from "../types.js";
import { createOpenAiCompatibleProvider } from "./openai-compatible.js";

export function createOpenRouterProvider(
  apiKey: string,
  baseUrl: string,
): AIProvider {
  return createOpenAiCompatibleProvider({
    name: "openrouter",
    apiKey,
    baseUrl,
    defaultHeaders: {
      "HTTP-Referer": process.env.PUBLIC_API_URL ?? "http://localhost:3001",
      "X-Title": "Finora Agent",
    },
  });
}
