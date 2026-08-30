import { AiProviderError, type AiProvider, type AiStreamRequest } from "./provider";

type Fetcher = (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>;

const DEFAULT_OPENROUTER_URL = "https://openrouter.ai/api/v1";

export function openRouterChatEndpoint(apiUrl = DEFAULT_OPENROUTER_URL) {
  const normalized = apiUrl.trim().replace(/\/+$/, "");
  return normalized.endsWith("/chat/completions") ? normalized : `${normalized}/chat/completions`;
}

function eventDelta(line: string): string | null {
  const trimmed = line.trim();
  if (!trimmed.startsWith("data:")) return null;
  const payload = trimmed.slice(5).trim();
  if (!payload || payload === "[DONE]") return null;
  const event = JSON.parse(payload) as {
    choices?: Array<{ delta?: { content?: unknown } }>;
    error?: unknown;
  };
  if (event.error) throw new AiProviderError("provider_error");
  const content = event.choices?.[0]?.delta?.content;
  return typeof content === "string" ? content : null;
}

export class OpenRouterProvider implements AiProvider {
  constructor(
    private readonly apiKey: string,
    private readonly model: string,
    private readonly apiUrl = DEFAULT_OPENROUTER_URL,
    private readonly fetcher: Fetcher = fetch,
  ) {}

  async *stream({ prompt, signal }: AiStreamRequest): AsyncIterable<string> {
    try {
      const response = await this.fetcher(openRouterChatEndpoint(this.apiUrl), {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: this.model,
          messages: [{ role: "user", content: prompt }],
          stream: true,
          temperature: 0.35,
          max_tokens: 1200,
        }),
        signal,
      });

      if (!response.ok) {
        throw new AiProviderError(response.status === 429 ? "quota" : "provider_error");
      }
      if (!response.body) throw new AiProviderError("provider_error");

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      for (;;) {
        const { value, done } = await reader.read();
        buffer += decoder.decode(value, { stream: !done });
        let newline = buffer.indexOf("\n");
        while (newline >= 0) {
          const line = buffer.slice(0, newline);
          buffer = buffer.slice(newline + 1);
          const delta = eventDelta(line);
          if (delta) yield delta;
          newline = buffer.indexOf("\n");
        }
        if (done) break;
        if (signal?.aborted) return;
      }
      const finalDelta = eventDelta(buffer);
      if (finalDelta) yield finalDelta;
    } catch (error) {
      if (error instanceof AiProviderError) throw error;
      if (signal?.aborted) throw new AiProviderError("timeout");
      const message = error instanceof Error ? error.message.toLowerCase() : "";
      if (message.includes("quota") || message.includes("429")) throw new AiProviderError("quota");
      throw new AiProviderError("provider_error");
    }
  }
}
