import type { AiProvider, AiStreamRequest } from "./provider";

export class DeterministicAiProvider implements AiProvider {
  constructor(private readonly text: string) {}

  async *stream({ signal }: AiStreamRequest): AsyncIterable<string> {
    const chunks = this.text.split(/(\n\n)/).filter(Boolean);
    for (const chunk of chunks) {
      if (signal?.aborted) return;
      yield chunk;
    }
  }
}
