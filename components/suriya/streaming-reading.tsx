"use client";

import { useEffect, useState } from "react";
import { RefreshCw, Sparkles } from "lucide-react";

type ReadingState = "generating" | "complete" | "failed";

export function getInitialReadingState(initialStatus: string, initialText?: string | null): { text: string; status: ReadingState } {
  if (initialText) return { text: initialText, status: "complete" };
  if (initialStatus === "failed") return { text: "", status: "failed" };
  return { text: "", status: "generating" };
}

export function shouldStartReadingStream(initialStatus: string, initialText: string | null | undefined, attempt: number) {
  if (initialText) return false;
  return initialStatus !== "failed" || attempt > 0;
}

const RETRY_DELAY_MS = 3000;
const MAX_RETRIES = 5;

/** A 409 means another request is generating the same reading; poll a few times before giving up. */
export function retryDelayFor(status: number, retries: number): number | null {
  return status === 409 && retries < MAX_RETRIES ? RETRY_DELAY_MS : null;
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
        if (!response.ok || !response.body) throw new Error("stream_failed");
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        for (;;) {
          const { value, done } = await reader.read();
          if (done) break;
          setText((current) => current + decoder.decode(value, { stream: true }));
        }
        setStatus("complete");
      } catch {
        if (!controller.signal.aborted) setStatus("failed");
      }
    })();
    return () => controller.abort();
  }, [attempt, endpoint, id, initialStatus, initialText]);

  return (
    <section className="surface prose-card streaming-reading" aria-labelledby={headingId}>
      <div className="section-title">
        <h2 id={headingId}>{title}</h2>
        {status === "generating" ? <span className="tag"><Sparkles size={12} aria-hidden="true" /> ရေးသားနေသည်</span> : (
          <span className="tag">{interpretationMode === "model" ? "AI အဓိပ္ပာယ်ဖွင့်" : "စက်တွင်းတွက်ချက်အဖြေ"}</span>
        )}
      </div>
      {text ? <div className="reading-copy" aria-live="polite">{text}</div> : status === "generating" ? (
        <p className="page-lede" role="status">တွက်ချက်ထားသော ဇာတာအချက်အလက်ကို အဓိပ္ပာယ်ဖွင့်နေပါတယ်…</p>
      ) : (
        <div className="empty-state">
          <h3>ဖတ်ကြားမှု ခေတ္တရပ်သွားပါတယ်</h3>
          <p>သင့်ဇာတာအချက်အလက်ကို သိမ်းထားပါတယ်။ အသစ်တွက်ရန်မလိုဘဲ ပြန်လည်စမ်းနိုင်ပါတယ်။</p>
          <button className="ghost-button" type="button" onClick={() => { setStatus("generating"); setText(""); setAttempt((value) => value + 1); }}><RefreshCw size={16} aria-hidden="true" /> ပြန်စမ်းမည်</button>
        </div>
      )}
    </section>
  );
}
