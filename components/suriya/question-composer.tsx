"use client";

import { FormEvent, useState } from "react";
import { ArrowRight } from "lucide-react";
import { readingTechniques, type ReadingTechnique } from "@/lib/content/demo";
import { TechniqueCard } from "./technique-card";

const MAX_QUESTION_LENGTH = 500;

export function QuestionComposer({ initialQuestion = "" }: { initialQuestion?: string }) {
  const [question, setQuestion] = useState(initialQuestion.slice(0, MAX_QUESTION_LENGTH));
  const [technique, setTechnique] = useState<ReadingTechnique["id"]>("janma");
  const [status, setStatus] = useState("");
  const [pending, setPending] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!question.trim() || pending) return;
    setPending(true);
    setStatus("သင့်ဇာတာအချက်အလက်များကို စစ်ဆေးနေပါတယ်…");
    try {
      const response = await fetch("/api/readings", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ question: question.trim(), kind: technique }),
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
        <div><strong>သင့်ဇာတာနှင့် ချိတ်ဆက်ထားသည်</strong><p>မွေးဇာတာနှင့် ဂဏန်းဗေဒင်တွက်ချက်မှုကို အခြေခံပြီး အဖြေပေးပါမယ်။</p></div>
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
      <button className="primary-button" type="submit" disabled={!question.trim() || pending}>
        {pending ? "တွက်ချက်နေပါတယ်…" : "သုရိယကို မေးမည်"}
        {!pending && <ArrowRight size={17} aria-hidden="true" />}
      </button>
      {status && <p className="form-message" role="status">{status}</p>}
    </form>
  );
}
