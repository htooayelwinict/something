export type AiStreamRequest = {
  prompt: string;
  signal?: AbortSignal;
};

export interface AiProvider {
  stream(request: AiStreamRequest): AsyncIterable<string>;
}

export class AiProviderError extends Error {
  constructor(public readonly code: "not_configured" | "timeout" | "quota" | "provider_error") {
    super(code);
  }
}
