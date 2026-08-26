import type { AiProvider } from "./provider";
import { FakeAiProvider } from "./fake";
import { GeminiProvider } from "./gemini";

export function getAiProvider(): AiProvider {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return new FakeAiProvider();
  return new GeminiProvider(apiKey, process.env.GEMINI_MODEL ?? "gemini-2.5-flash");
}
