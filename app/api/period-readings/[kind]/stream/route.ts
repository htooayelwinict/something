import { completePeriodReading, createPeriodReading, failPeriodReading, findPeriodReading, resetPeriodReading } from "@/db/repositories/period-readings";
import { getAiProvider, getConfiguredInterpretationMode, interpretationCacheVersion, shouldReuseCompletedPeriodInterpretation } from "@/lib/ai";
import { PERIOD_PROMPT_VERSION } from "@/lib/ai/period-prompt";
import { isPeriodKind } from "@/lib/readings/period";
import { parseStoredTimestamp } from "@/lib/readings/quota";
import { periodReadingFor, resolvePeriodSubject } from "@/lib/services/period-reading";

export const dynamic = "force-dynamic";

const GENERATING_GRACE_MS = 2 * 60_000;

function textHeaders(mode?: "deterministic" | "model") {
  return {
    "content-type": "text/plain; charset=utf-8",
    "cache-control": "private, no-store, no-transform",
    "x-content-type-options": "nosniff",
    ...(mode ? { "x-interpretation-mode": mode } : {}),
  };
}

export async function GET(request: Request, { params }: { params: Promise<{ kind: string }> }) {
  const { kind } = await params;
  if (!isPeriodKind(kind)) return new Response("not found", { status: 404 });
  const subject = await resolvePeriodSubject(kind);
  if (!subject) return new Response("unauthorized", { status: 401 });

  const now = new Date();
  const bundle = periodReadingFor(subject.profile, kind, now);
  const configuredMode = getConfiguredInterpretationMode();
  const cacheVersion = interpretationCacheVersion(PERIOD_PROMPT_VERSION, configuredMode);

  // Cache lookup. If the database is unavailable we still answer with the deterministic text.
  let rowId: string | null = null;
  try {
    let row = await findPeriodReading(subject.userId, kind, bundle.period.key, cacheVersion);
    if (
      row?.status === "complete"
      && row.responseText
      && shouldReuseCompletedPeriodInterpretation(row.interpretationMode, configuredMode, row.updatedAt, now)
    ) {
      return new Response(row.responseText, { headers: textHeaders(row.interpretationMode) });
    }
    if (row?.status === "generating" && now.valueOf() - parseStoredTimestamp(row.updatedAt).valueOf() < GENERATING_GRACE_MS) {
      return Response.json({ status: "generating" }, { status: 202, headers: { "cache-control": "private, no-store", "retry-after": "3" } });
    }
    if (row) {
      await resetPeriodReading(row.id);
    } else {
      row = await createPeriodReading({
        userId: subject.userId,
        kind,
        periodKey: bundle.period.key,
        periodStart: bundle.period.start,
        periodEnd: bundle.period.end,
        evidence: bundle.evidence as unknown as Record<string, unknown>,
        calculationVersion: bundle.evidence.calculationVersion,
        rulesetVersion: bundle.evidence.rulesetVersion,
        promptVersion: cacheVersion,
      });
      if (row?.status === "complete" && row.responseText) return new Response(row.responseText, { headers: textHeaders() });
    }
    rowId = row?.id ?? null;
  } catch {
    rowId = null;
  }

  if (!rowId) return new Response(bundle.fallback, { headers: textHeaders("deterministic") });

  const { provider, mode } = getAiProvider(bundle.fallback);
  const { readable, writable } = new TransformStream<Uint8Array, Uint8Array>();
  const writer = writable.getWriter();
  const encoder = new TextEncoder();
  const abortController = new AbortController();
  request.signal.addEventListener("abort", () => abortController.abort(), { once: true });
  const id = rowId;

  void (async () => {
    let finalText = "";
    try {
      for await (const chunk of provider.stream({ prompt: bundle.prompt, signal: abortController.signal })) {
        finalText += chunk;
        await writer.write(encoder.encode(chunk));
      }
      if (finalText.trim()) {
        await completePeriodReading(id, finalText, mode);
      } else {
        throw new Error("empty_provider_answer");
      }
      await writer.close();
    } catch (error) {
      // Chunks already sent are not retracted; a refresh shows the stored fallback.
      const code = error instanceof Error ? error.message.slice(0, 40) : "provider_error";
      if (abortController.signal.aborted) {
        await failPeriodReading(id, code).catch(() => undefined);
      } else {
        await completePeriodReading(id, bundle.fallback, "deterministic")
          .catch(() => failPeriodReading(id, code).catch(() => undefined));
      }
      await writer.abort(error).catch(() => undefined);
    }
  })();

  return new Response(readable, { headers: textHeaders(mode) });
}
