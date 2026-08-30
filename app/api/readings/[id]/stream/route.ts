import { getChatGPTUser } from "@/app/chatgpt-auth";
import { completeReading, failReading, getReading } from "@/db/repositories/readings";
import { getAiProvider } from "@/lib/ai";
import { buildReadingPrompt } from "@/lib/ai/prompt";
import { buildDeterministicReading } from "@/lib/readings/deterministic";
import type { ReadingSnapshotLike } from "@/lib/readings/snapshot";
import { readingInterpretationSchema } from "@/lib/schemas/reading";

export const dynamic = "force-dynamic";

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getChatGPTUser();
  if (!user) return new Response("unauthorized", { status: 401 });
  const { id } = await params;
  const reading = await getReading(user.userId, id).catch(() => null);
  if (!reading) return new Response("not found", { status: 404 });
  if (reading.status === "complete" && reading.responseText) {
    return new Response(reading.responseText, { headers: streamHeaders(reading.interpretationMode) });
  }

  const input = readingInterpretationSchema.safeParse({ kind: reading.kind, question: reading.question });
  if (!input.success) return new Response("invalid reading", { status: 422 });
  const snapshot = reading.chartSnapshot as unknown as ReadingSnapshotLike;
  const prompt = buildReadingPrompt(snapshot, input.data);
  const fallback = buildDeterministicReading(snapshot, input.data);
  const { provider, mode } = getAiProvider(fallback.text);
  const { readable, writable } = new TransformStream<Uint8Array, Uint8Array>();
  const writer = writable.getWriter();
  const encoder = new TextEncoder();
  const abortController = new AbortController();
  request.signal.addEventListener("abort", () => abortController.abort(), { once: true });

  void (async () => {
    let finalText = "";
    try {
      for await (const chunk of provider.stream({ prompt, signal: abortController.signal, maxTokens: 2_400 })) {
        finalText += chunk;
        await writer.write(encoder.encode(chunk));
      }
      if (finalText.trim()) await completeReading(user.userId, id, finalText, mode);
      await writer.close();
    } catch (error) {
      const code = error instanceof Error ? error.message.slice(0, 40) : "provider_error";
      await failReading(user.userId, id, code).catch(() => undefined);
      await writer.abort(error).catch(() => undefined);
    }
  })();

  return new Response(readable, { headers: streamHeaders(mode) });
}

function streamHeaders(mode?: "deterministic" | "model") {
  return {
    "content-type": "text/plain; charset=utf-8",
    "cache-control": "private, no-store, no-transform",
    "x-content-type-options": "nosniff",
    ...(mode ? { "x-interpretation-mode": mode } : {}),
  };
}
