import { GoogleGenAI } from "@google/genai";
import { AiProviderError, type AiProvider, type AiStreamRequest } from "./provider";

export class GeminiProvider implements AiProvider {
  constructor(private readonly apiKey: string, private readonly model: string) {}

  async *stream({ prompt, signal, maxTokens }: AiStreamRequest): AsyncIterable<string> {
    try {
      const client = new GoogleGenAI({ apiKey: this.apiKey });
      const response = await client.models.generateContentStream({
        model: this.model,
        contents: prompt,
        config: { temperature: 0.35, maxOutputTokens: maxTokens ?? 1200, abortSignal: signal },
      });
      let finishReason: string | null = null;
      for await (const chunk of response) {
        if (signal?.aborted) return;
        const reason = chunk.candidates?.[0]?.finishReason;
        if (reason) finishReason = String(reason);
        if (chunk.text) yield chunk.text;
      }
      if (finishReason === "MAX_TOKENS") throw new AiProviderError("truncated");
    } catch (error) {
      if (error instanceof AiProviderError) throw error;
      if (signal?.aborted) throw new AiProviderError("timeout");
      const message = error instanceof Error ? error.message.toLowerCase() : "";
      if (message.includes("quota") || message.includes("429")) throw new AiProviderError("quota");
      throw new AiProviderError("provider_error");
    }
  }
}
