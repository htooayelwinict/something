"use client";

import { FormEvent, useState } from "react";
import { ArrowRight } from "lucide-react";
import { readingTechniques, type ReadingTechnique } from "@/lib/content/demo";
import { TechniqueCard } from "./technique-card";
import type { MuhurtaEventTypeInput, ReadingRequestInput } from "@/lib/schemas/reading";

const MAX_QUESTION_LENGTH = 500;

export function defaultMuhurtaTargetDate(now = new Date()) {
  return new Date(now.valueOf() + 86_400_000).toISOString().slice(0, 10);
}

function maximumMuhurtaTargetDate(now = new Date()) {
  return new Date(now.valueOf() + 90 * 86_400_000).toISOString().slice(0, 10);
}

export function buildReadingPayload(
  question: string,
  technique: ReadingTechnique["id"],
  targetDate: string,
  eventType: MuhurtaEventTypeInput,
): ReadingRequestInput {
  const normalizedQuestion = question.trim();
  return technique === "muhurta"
    ? { kind: technique, question: normalizedQuestion, targetDate, eventType }
    : { kind: technique, question: normalizedQuestion };
}

export function unauthenticatedAskTarget(authenticated: boolean) {
  return authenticated ? null : "/login?return_to=/ask";
}

export function QuestionComposer({ initialQuestion = "", authenticated }: { initialQuestion?: string; authenticated: boolean }) {
  const [question, setQuestion] = useState(initialQuestion.slice(0, MAX_QUESTION_LENGTH));
  const [technique, setTechnique] = useState<ReadingTechnique["id"]>("janma");
  const [targetDate, setTargetDate] = useState(() => defaultMuhurtaTargetDate());
  const [eventType, setEventType] = useState<MuhurtaEventTypeInput>("general");
  const [status, setStatus] = useState("");
  const [pending, setPending] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!question.trim() || pending) return;
    const signInTarget = unauthenticatedAskTarget(authenticated);
    if (signInTarget) {
      window.location.assign(signInTarget);
      return;
    }
    setPending(true);
    setStatus("သင့်ဇာတာအချက်အလက်များကို စစ်ဆေးနေပါတယ်…");
    try {
      const response = await fetch("/api/readings", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(buildReadingPayload(question, technique, targetDate, eventType)),
      });
      if (response.status === 401) {
        window.location.assign("/login?return_to=/ask");
        return;
      }
      if (response.status === 409) {
        window.location.assign("/onboarding");
        return;
      }
      const result = (await response.json()) as { id?: string; error?: string };
      if (!response.ok || !result.id) throw new Error(result.error ?? "reading_failed");
      window.location.assign(`/readings/${result.id}`);
    } catch {
      setStatus("လောလောဆယ် ဖတ်ကြားမှု မစတင်နိုင်သေးပါ။ နောက်တစ်ကြိမ် ပြန်စမ်းကြည့်ပါ။");
      setPending(false);
    }
  }

  return (
    <form className="composer" onSubmit={submit}>
      <div className="composer-welcome">
        <span aria-hidden="true">✦</span>
        <div><strong>တွက်ချက်နည်းကို သင်ရွေးနိုင်သည်</strong><p>မွေးဇာတာ၊ မေးချိန်ဇာတာ သို့မဟုတ် အချိန်ရွေးချယ်မှုကို သီးခြားတွက်ချက်ပေးပါမယ်။</p></div>
      </div>
      <div className="field-group">
        <label className="field-label" htmlFor="question">သင့်မေးခွန်းကို ရေးပါ</label>
        <textarea
          className="text-area"
          id="question"
          name="question"
          maxLength={MAX_QUESTION_LENGTH}
          placeholder="ဥပမာ — လက်ရှိအလုပ်အကိုင်အတွက် ဘယ်အရာကို ဦးစားပေးသင့်ပါသလဲ။"
          value={question}
          onChange={(event) => setQuestion(event.target.value)}
          required
        />
        <div className="field-meta"><span>တစ်ကြိမ်လျှင် မေးခွန်းတစ်ခု</span><span>{question.length}/{MAX_QUESTION_LENGTH}</span></div>
      </div>
      <fieldset className="field-group">
        <legend className="group-label">ဖတ်ကြားမည့်နည်းလမ်း</legend>
        <div className="technique-grid">
          {readingTechniques.map((item) => <TechniqueCard key={item.id} technique={item} selected={technique === item.id} onSelect={setTechnique} />)}
        </div>
      </fieldset>
      {technique === "prashna" && (
        <p className="field-meta">မေးခွန်းပေးပို့သည့်အချိန်နှင့် သိမ်းထားသောနေရာကို အသုံးပြုပြီး မေးချိန်ဇာတာအသစ် တွက်ပါမယ်။</p>
      )}
      {technique === "muhurta" && (
        <div className="form-grid-two">
          <div className="field-group">
            <label className="field-label" htmlFor="muhurta-date">စတင်လိုသည့်ရက်</label>
            <input
              className="text-field"
              id="muhurta-date"
              type="date"
              min={new Date().toISOString().slice(0, 10)}
              max={maximumMuhurtaTargetDate()}
              value={targetDate}
              onChange={(event) => setTargetDate(event.target.value)}
              required
            />
          </div>
          <div className="field-group">
            <label className="field-label" htmlFor="muhurta-event">လုပ်ဆောင်မှုအမျိုးအစား</label>
            <select className="select-field" id="muhurta-event" value={eventType} onChange={(event) => setEventType(event.target.value as MuhurtaEventTypeInput)}>
              <option value="general">အထွေထွေ စတင်မှု</option>
              <option value="work">အလုပ်နှင့် လုပ်ငန်း</option>
              <option value="relationship">ဆက်ဆံရေး</option>
              <option value="travel">ခရီးသွားခြင်း</option>
            </select>
          </div>
          <p className="field-meta muhurta-location-note">သိမ်းထားသောနေရာ၏ နေထွက်၊ နေဝင်၊ Hora၊ Rahu Kalam နှင့် Panchanga ကို အသုံးပြုပါမယ်။</p>
        </div>
      )}
      <button className="primary-button" type="submit" disabled={!question.trim() || pending}>
        {pending ? "တွက်ချက်နေပါတယ်…" : "သုရိယကို မေးမည်"}
        {!pending && <ArrowRight size={17} aria-hidden="true" />}
      </button>
      {status && <p className="form-message" role="status">{status}</p>}
    </form>
  );
}
