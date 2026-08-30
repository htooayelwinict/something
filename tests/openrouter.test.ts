import { afterEach, describe, expect, it, vi } from "vitest";
import { DeterministicAiProvider } from "@/lib/ai/fake";
import { GeminiProvider } from "@/lib/ai/gemini";
import { getAiProvider, getConfiguredInterpretationMode, interpretationCacheVersion, shouldReuseCompletedPeriodInterpretation } from "@/lib/ai";
import { OpenRouterProvider, openRouterChatEndpoint } from "@/lib/ai/openrouter";
import { AiProviderError } from "@/lib/ai/provider";

async function collect(stream: AsyncIterable<string>) {
  const chunks: string[] = [];
  for await (const chunk of stream) chunks.push(chunk);
  return chunks.join("");
}

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("OpenRouterProvider", () => {
  it("streams split SSE deltas through the OpenAI-compatible endpoint", async () => {
    const encoder = new TextEncoder();
    const body = new ReadableStream<Uint8Array>({
      start(controller) {
        controller.enqueue(encoder.encode('data: {"choices":[{"delta":{"content":"မင်္ဂ'));
        controller.enqueue(encoder.encode('လာ"}}]}\n\ndata: {"choices":[{"delta":{"content":"ပါ"}}]}\n\ndata: [DONE]\n\n'));
        controller.close();
      },
    });
    const fetcher = vi.fn(async () => new Response(body, { status: 200 }));
    const provider = new OpenRouterProvider(
      "test-secret",
      "anthropic/claude-sonnet-4",
      "https://openrouter.example/api/v1/",
      fetcher,
    );

    await expect(collect(provider.stream({ prompt: "မြန်မာလို ဖြေပါ" }))).resolves.toBe("မင်္ဂလာပါ");
    expect(fetcher).toHaveBeenCalledOnce();
    const [url, init] = fetcher.mock.calls[0];
    expect(url).toBe("https://openrouter.example/api/v1/chat/completions");
    expect(init?.headers).toMatchObject({
      Authorization: "Bearer test-secret",
      "Content-Type": "application/json",
    });
    expect(JSON.parse(String(init?.body))).toEqual({
      model: "anthropic/claude-sonnet-4",
      messages: [{ role: "user", content: "မြန်မာလို ဖြေပါ" }],
      stream: true,
      temperature: 0.35,
      max_tokens: 1200,
    });
  });

  it("accepts a full chat-completions URL without duplicating its suffix", () => {
    expect(openRouterChatEndpoint("https://openrouter.ai/api/v1/chat/completions")).toBe(
      "https://openrouter.ai/api/v1/chat/completions",
    );
  });

  it("maps HTTP 429 to a quota error", async () => {
    const fetcher = vi.fn(async () => new Response("limited", { status: 429 }));
    const provider = new OpenRouterProvider("test-secret", "test/model", undefined, fetcher);

    await expect(collect(provider.stream({ prompt: "hello" }))).rejects.toEqual(new AiProviderError("quota"));
  });
});

describe("AI provider selection", () => {
  it("uses the configured OpenRouter model when Gemini is absent", () => {
    vi.stubEnv("GEMINI_API_KEY", "");
    vi.stubEnv("OPENROUTER_API_KEY", "test-secret");
    vi.stubEnv("LLM_MODEL", "openai/gpt-5-mini");
    vi.stubEnv("OPENROUTER_API_URL", "https://openrouter.example/api/v1");

    const selection = getAiProvider("fallback");

    expect(selection.provider).toBeInstanceOf(OpenRouterProvider);
    expect(selection.mode).toBe("model");
    expect(getConfiguredInterpretationMode()).toBe("model");
  });

  it("keeps Gemini compatibility and precedence", () => {
    vi.stubEnv("GEMINI_API_KEY", "gemini-secret");
    vi.stubEnv("OPENROUTER_API_KEY", "openrouter-secret");

    expect(getAiProvider("fallback").provider).toBeInstanceOf(GeminiProvider);
  });

  it("uses the deterministic provider when no model key is configured", () => {
    vi.stubEnv("GEMINI_API_KEY", "");
    vi.stubEnv("OPENROUTER_API_KEY", "");

    const selection = getAiProvider("fallback");

    expect(selection.provider).toBeInstanceOf(DeterministicAiProvider);
    expect(selection.mode).toBe("deterministic");
    expect(getConfiguredInterpretationMode()).toBe("deterministic");
  });

  it("keeps deterministic and model period caches separate", () => {
    expect(interpretationCacheVersion("suriya-period-1", "deterministic")).toBe("suriya-period-1:deterministic");
    expect(interpretationCacheVersion("suriya-period-1", "model")).toBe("suriya-period-1:model");
  });

  it("retries a model-backed deterministic fallback after a cooldown", () => {
    const now = new Date("2026-08-31T00:20:00.000Z");

    expect(shouldReuseCompletedPeriodInterpretation("deterministic", "model", "2026-08-31T00:10:01.000Z", now)).toBe(true);
    expect(shouldReuseCompletedPeriodInterpretation("deterministic", "model", "2026-08-31T00:00:00.000Z", now)).toBe(false);
    expect(shouldReuseCompletedPeriodInterpretation("deterministic", "deterministic", "2026-08-01T00:00:00.000Z", now)).toBe(true);
    expect(shouldReuseCompletedPeriodInterpretation("model", "model", "2026-08-01T00:00:00.000Z", now)).toBe(true);
  });
});
