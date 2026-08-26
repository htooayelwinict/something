import type { Metadata } from "next";
import { AppShell } from "@/components/suriya/app-shell";
import { QuestionComposer } from "@/components/suriya/question-composer";

export const metadata: Metadata = { title: "မေးမြန်းရန်" };

export default function AskPage() {
  return (
    <AppShell>
      <header className="page-heading">
        <p className="eyebrow">Personal reading</p>
        <h1 className="page-title">ကြယ်တာရာများကို မေးပါ</h1>
        <p className="page-lede">အရေးကြီးဆုံးမေးခွန်းတစ်ခုကို ရှင်းရှင်းလင်းလင်း ရေးပါ။ တွက်ချက်ထားသော ဇာတာအချက်အလက်ကို မြန်မာဘာသာဖြင့် အဓိပ္ပာယ်ဖွင့်ပေးပါမယ်။</p>
      </header>
      <section className="surface form-card" aria-label="ဗေဒင် မေးခွန်းရေးရန်"><QuestionComposer /></section>
    </AppShell>
  );
}
