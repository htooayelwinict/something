import { beforeEach, describe, expect, it, vi } from "vitest";
import { AiProviderError } from "@/lib/ai/provider";

const generateContentStream = vi.hoisted(() => vi.fn());

vi.mock("@google/genai", () => ({
  GoogleGenAI: class {
    models = { generateContentStream };
  },
}));

import { GeminiProvider } from "@/lib/ai/gemini";

async function collect(stream: AsyncIterable<string>) {
  const chunks: string[] = [];
  for await (const chunk of stream) chunks.push(chunk);
  return chunks.join("");
}

describe("GeminiProvider", () => {
  beforeEach(() => generateContentStream.mockReset());

  it("uses the caller's completion budget", async () => {
    generateContentStream.mockResolvedValue((async function* () {
      yield { text: "ပြီးပါပြီ", candidates: [{ finishReason: "STOP" }] };
    })());
    const provider = new GeminiProvider("test-secret", "gemini-test");

    await expect(collect(provider.stream({ prompt: "အပြည့်အစုံ ဖြေပါ", maxTokens: 5_000 }))).resolves.toBe("ပြီးပါပြီ");
    expect(generateContentStream).toHaveBeenCalledWith(expect.objectContaining({
      config: expect.objectContaining({ maxOutputTokens: 5_000 }),
    }));
  });

  it("rejects a stream that the model stopped at its output limit", async () => {
    generateContentStream.mockResolvedValue((async function* () {
      yield { text: "မပြီးသေး", candidates: [{ finishReason: "MAX_TOKENS" }] };
    })());
    const provider = new GeminiProvider("test-secret", "gemini-test");

    await expect(collect(provider.stream({ prompt: "အပြည့်အစုံ ဖြေပါ" }))).rejects.toEqual(new AiProviderError("truncated"));
  });
});
