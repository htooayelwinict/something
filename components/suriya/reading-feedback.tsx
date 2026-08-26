"use client";

import { useState } from "react";
import { ThumbsDown, ThumbsUp } from "lucide-react";
import type { ReadingFeedback as FeedbackValue } from "@/lib/schemas/feedback";

export function ReadingFeedback({ id, initialValue }: { id: string; initialValue?: FeedbackValue | null }) {
  const [value, setValue] = useState<FeedbackValue | null>(initialValue ?? null);
  const [status, setStatus] = useState("");

  async function save(next: FeedbackValue) {
    if (status === "သိမ်းနေသည်…") return;
    setStatus("သိမ်းနေသည်…");
    try {
      const response = await fetch(`/api/readings/${id}/feedback`, {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ value: next }),
      });
      if (!response.ok) throw new Error("feedback_failed");
      setValue(next);
      setStatus("သင့်မှတ်ချက်ကို သိမ်းပြီးပါပြီ။");
    } catch {
      setStatus("မှတ်ချက် မသိမ်းနိုင်သေးပါ။ ပြန်စမ်းကြည့်ပါ။");
    }
  }

  return (
    <section className="reading-feedback" aria-labelledby="feedback-title">
      <div><p className="eyebrow">YOUR FEEDBACK</p><h2 id="feedback-title">ဤအဖြေက အသုံးဝင်ပါသလား။</h2></div>
      <div className="feedback-actions">
        <button type="button" aria-pressed={value === "useful"} onClick={() => void save("useful")}><ThumbsUp size={16} aria-hidden="true" /> အသုံးဝင်သည်</button>
        <button type="button" aria-pressed={value === "not_useful"} onClick={() => void save("not_useful")}><ThumbsDown size={16} aria-hidden="true" /> မကူညီပါ</button>
      </div>
      <p className="feedback-status" role="status" aria-live="polite">{status}</p>
    </section>
  );
}
