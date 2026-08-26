import { GoogleGenAI } from "@google/genai";
import { AiProviderError, type AiProvider, type AiStreamRequest } from "./provider";

export class GeminiProvider implements AiProvider {
  constructor(private readonly apiKey: string, private readonly model: string) {}

  async *stream({ prompt, signal }: AiStreamRequest): AsyncIterable<string> {
    try {
      const client = new GoogleGenAI({ apiKey: this.apiKey });
      const response = await client.models.generateContentStream({
        model: this.model,
        contents: prompt,
        config: { temperature: 0.35, maxOutputTokens: 1200, abortSignal: signal },
      });
      for await (const chunk of response) {
        if (signal?.aborted) return;
        if (chunk.text) yield chunk.text;
      }
    } catch (error) {
      if (signal?.aborted) throw new AiProviderError("timeout");
      const message = error instanceof Error ? error.message.toLowerCase() : "";
      if (message.includes("quota") || message.includes("429")) throw new AiProviderError("quota");
      throw new AiProviderError("provider_error");
    }
  }
}
