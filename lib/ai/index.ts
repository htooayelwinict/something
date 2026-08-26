import type { AiProvider } from "./provider";
import { DeterministicAiProvider } from "./fake";
import { GeminiProvider } from "./gemini";

export type AiProviderSelection = {
  provider: AiProvider;
  mode: "deterministic" | "model";
};

export function getAiProvider(fallbackText: string): AiProviderSelection {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return { provider: new DeterministicAiProvider(fallbackText), mode: "deterministic" };
  }
  return {
    provider: new GeminiProvider(apiKey, process.env.GEMINI_MODEL ?? "gemini-2.5-flash"),
    mode: "model",
  };
}
