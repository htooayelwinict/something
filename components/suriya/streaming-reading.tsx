"use client";

import { useEffect, useState } from "react";
import { RefreshCw, Sparkles } from "lucide-react";

export function StreamingReading({ id, initialText }: { id: string; initialText?: string | null; initialStatus: string }) {
  const [text, setText] = useState(initialText ?? "");
  const [status, setStatus] = useState(initialText ? "complete" : "generating");
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    if (initialText) return;
    const controller = new AbortController();
    void (async () => {
      try {
        const response = await fetch(`/api/readings/${id}/stream`, { signal: controller.signal });
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
  }, [attempt, id, initialText]);

  return (
    <section className="surface prose-card" aria-labelledby="reading-answer">
      <div className="section-title">
        <h2 id="reading-answer">သုရိယ၏ အမြင်</h2>
        {status === "generating" && <span className="tag"><Sparkles size={12} aria-hidden="true" /> ရေးသားနေသည်</span>}
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
