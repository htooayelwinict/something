import type { AiProvider } from "./provider";
import { DeterministicAiProvider } from "./fake";
import { GeminiProvider } from "./gemini";
import { OpenRouterProvider } from "./openrouter";

export type AiProviderSelection = {
  provider: AiProvider;
  mode: "deterministic" | "model";
};

const MODEL_FALLBACK_RETRY_MS = 15 * 60_000;

export function getConfiguredInterpretationMode(): AiProviderSelection["mode"] {
  return process.env.GEMINI_API_KEY || process.env.OPENROUTER_API_KEY ? "model" : "deterministic";
}

export function interpretationCacheVersion(
  promptVersion: string,
  mode: AiProviderSelection["mode"],
) {
  return `${promptVersion}:${mode}`;
}

export function shouldReuseCompletedPeriodInterpretation(
  cachedMode: AiProviderSelection["mode"],
  configuredMode: AiProviderSelection["mode"],
  updatedAt: string,
  now = new Date(),
) {
  if (cachedMode === "model" || configuredMode === "deterministic") return true;
  const updatedAtMs = Date.parse(updatedAt);
  return Number.isFinite(updatedAtMs) && now.valueOf() - updatedAtMs < MODEL_FALLBACK_RETRY_MS;
}

export function getAiProvider(fallbackText: string): AiProviderSelection {
  const geminiApiKey = process.env.GEMINI_API_KEY;
  if (geminiApiKey) {
    return {
      provider: new GeminiProvider(geminiApiKey, process.env.GEMINI_MODEL ?? "gemini-2.5-flash"),
      mode: "model",
    };
  }
  const openRouterApiKey = process.env.OPENROUTER_API_KEY;
  if (openRouterApiKey) {
    return {
      provider: new OpenRouterProvider(
        openRouterApiKey,
        process.env.LLM_MODEL ?? "openrouter/auto",
        process.env.OPENROUTER_API_URL || undefined,
      ),
      mode: "model",
    };
  }
  return { provider: new DeterministicAiProvider(fallbackText), mode: "deterministic" };
}
