"use client";

import { useEffect, useState } from "react";
import { RefreshCw, Sparkles } from "lucide-react";

type ReadingState = "generating" | "complete" | "failed";
type InterpretationMode = "deterministic" | "model";

export function getInitialReadingState(initialStatus: string, initialText?: string | null): { text: string; status: ReadingState } {
  if (initialText) return { text: initialText, status: "complete" };
  if (initialStatus === "failed") return { text: "", status: "failed" };
  return { text: "", status: "generating" };
}

export function failedReadingState(): { text: string; status: ReadingState } {
  return { text: "", status: "failed" };
}

export function interpretationModeFromHeader(value: string | null, fallback: InterpretationMode): InterpretationMode {
  return value === "model" || value === "deterministic" ? value : fallback;
}

export function readingStatusAnnouncement(status: ReadingState) {
  if (status === "generating") return "ဖတ်စာ ရေးသားနေသည်။";
  if (status === "complete") return "ဖတ်စာ အဆင်သင့်ဖြစ်ပါပြီ။";
  return "ဖတ်ကြားမှု ခေတ္တရပ်သွားသည်။";
}

export function shouldStartReadingStream(initialStatus: string, initialText: string | null | undefined, attempt: number) {
  if (initialText) return false;
  return initialStatus !== "failed" || attempt > 0;
}

const RETRY_DELAY_MS = 3000;
const MAX_RETRIES = 5;
const COLLAPSE_AFTER_CHARACTERS = 500;
const PREVIEW_CHARACTERS = 420;

export function isPendingReadingStatus(status: number) {
  return status === 202 || status === 409;
}

/** Another request is generating the same reading; poll a few times before giving up. */
export function retryDelayFor(status: number, retries: number): number | null {
  return isPendingReadingStatus(status) && retries < MAX_RETRIES ? RETRY_DELAY_MS : null;
}

export function shouldCollapseReading(text: string, status: ReadingState) {
  return status === "complete" && text.length > COLLAPSE_AFTER_CHARACTERS;
}

export function readingPreview(text: string) {
  if (text.length <= PREVIEW_CHARACTERS) return text;
  const candidate = text.slice(0, PREVIEW_CHARACTERS);
  const wordBoundary = Math.max(candidate.lastIndexOf(" "), candidate.lastIndexOf("\n"));
  const end = wordBoundary >= PREVIEW_CHARACTERS * 0.7 ? wordBoundary : PREVIEW_CHARACTERS;
  return `${candidate.slice(0, end).trimEnd()}…`;
}

function sleep(ms: number, signal: AbortSignal) {
  return new Promise<void>((resolve) => {
    const timer = setTimeout(resolve, ms);
    signal.addEventListener("abort", () => { clearTimeout(timer); resolve(); }, { once: true });
  });
}

export function StreamingReading({
  id,
  initialText,
  initialStatus,
  interpretationMode = "deterministic",
  endpoint,
  title = "သုရိယ၏ အမြင်",
  headingId = "reading-answer",
}: {
  id: string;
  initialText?: string | null;
  initialStatus: string;
  interpretationMode?: "deterministic" | "model";
  /** Defaults to the saved-reading stream for `id`. */
  endpoint?: string;
  title?: string;
  headingId?: string;
}) {
  const initial = getInitialReadingState(initialStatus, initialText);
  const [text, setText] = useState(initial.text);
  const [status, setStatus] = useState<ReadingState>(initial.status);
  const [attempt, setAttempt] = useState(0);
  const [expanded, setExpanded] = useState(false);
  const [mode, setMode] = useState<InterpretationMode>(interpretationMode);

  useEffect(() => {
    if (!shouldStartReadingStream(initialStatus, initialText, attempt)) return;
    const controller = new AbortController();
    void (async () => {
      try {
        const url = endpoint ?? `/api/readings/${id}/stream`;
        let response = await fetch(url, { signal: controller.signal });
        for (let retries = 0; ; retries += 1) {
          const delay = retryDelayFor(response.status, retries);
          if (delay === null) break;
          await sleep(delay, controller.signal);
          if (controller.signal.aborted) return;
          response = await fetch(url, { signal: controller.signal });
        }
        if (isPendingReadingStatus(response.status) || !response.ok || !response.body) throw new Error("stream_failed");
        setMode(interpretationModeFromHeader(response.headers.get("x-interpretation-mode"), interpretationMode));
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        for (;;) {
          const { value, done } = await reader.read();
          if (done) break;
          setText((current) => current + decoder.decode(value, { stream: true }));
        }
        setStatus("complete");
      } catch {
        if (!controller.signal.aborted) {
          const failed = failedReadingState();
          setText(failed.text);
          setStatus(failed.status);
        }
      }
    })();
    return () => controller.abort();
  }, [attempt, endpoint, id, initialStatus, initialText, interpretationMode]);

  const collapsible = shouldCollapseReading(text, status);
  const readingCopyId = `${headingId}-copy`;
  const visibleText = collapsible && !expanded ? readingPreview(text) : text;

  return (
    <section className="surface prose-card streaming-reading" aria-labelledby={headingId}>
      <span className="sr-only" role="status">{readingStatusAnnouncement(status)}</span>
      <div className="section-title">
        <h2 id={headingId}>{title}</h2>
        {status === "generating" ? <span className="tag"><Sparkles size={12} aria-hidden="true" /> ရေးသားနေသည်</span> : (
          <span className="tag">{mode === "model" ? "AI အဓိပ္ပာယ်ဖွင့်" : "စက်တွင်းတွက်ချက်အဖြေ"}</span>
        )}
      </div>
      {text ? <>
        <div id={readingCopyId} className="reading-copy">{visibleText}</div>
        {collapsible ? (
          <button className="reading-toggle" type="button" aria-controls={readingCopyId} aria-expanded={expanded} onClick={() => setExpanded((value) => !value)}>
            {expanded ? "အကျဉ်းချုံ့ရန်" : "အပြည့်ဖတ်ရန်"}<span aria-hidden="true">{expanded ? " ↑" : " ↓"}</span>
          </button>
        ) : null}
      </> : status === "generating" ? (
        <p className="page-lede">တွက်ချက်ထားသော ဇာတာအချက်အလက်ကို အဓိပ္ပာယ်ဖွင့်နေပါတယ်…</p>
      ) : (
        <div className="empty-state">
          <h3>ဖတ်ကြားမှု ခေတ္တရပ်သွားပါတယ်</h3>
          <p>သင့်ဇာတာအချက်အလက်ကို သိမ်းထားပါတယ်။ အသစ်တွက်ရန်မလိုဘဲ ပြန်လည်စမ်းနိုင်ပါတယ်။</p>
          <button className="ghost-button" type="button" onClick={() => { setStatus("generating"); setText(""); setExpanded(false); setAttempt((value) => value + 1); }}><RefreshCw size={16} aria-hidden="true" /> ပြန်စမ်းမည်</button>
        </div>
      )}
    </section>
  );
}
