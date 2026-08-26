import type { Metadata } from "next";
import { CircleHelp, LockKeyhole, Sparkles } from "lucide-react";
import { AppShell } from "@/components/suriya/app-shell";
import { IdentityRail } from "@/components/suriya/identity-rail";
import { QuestionComposer } from "@/components/suriya/question-composer";
import { RecentReadingsRail } from "@/components/suriya/recent-readings-rail";
import { listReadings } from "@/db/repositories/readings";
import { getDailyExperience } from "@/lib/services/daily";

export const metadata: Metadata = { title: "မေးမြန်းရန်" };

export default async function AskPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const daily = await getDailyExperience();
  const readings = daily.user ? await listReadings(daily.user.userId).catch(() => []) : [];
  const { q = "" } = await searchParams;
  const rail = daily.user
    ? <RecentReadingsRail readings={readings} />
    : <IdentityRail {...daily.identity} personalized={daily.personalized} />;
  const explainer = (
    <section className="ask-explainer" aria-labelledby="answer-method-title">
      <span className="ask-explainer-icon"><CircleHelp size={20} aria-hidden="true" /></span>
      <p className="eyebrow">TRANSPARENT BY DESIGN</p>
      <h2 id="answer-method-title">အဖြေတွက်ချက်ပုံ</h2>
      <ol>
        <li><Sparkles size={14} aria-hidden="true" /><span><strong>ဇာတာတွက်ချက်မှု</strong>Ascendant၊ Moon နှင့် နေ့စဉ်ဂြိုဟ်တည်နေရာ</span></li>
        <li><span aria-hidden="true">#</span><span><strong>ဂဏန်းဗေဒင်</strong>မွေးရက်မှ Life Path တွက်ချက်မှု</span></li>
        <li><LockKeyhole size={14} aria-hidden="true" /><span><strong>ကိုယ်ပိုင်အချက်အလက်</strong>သင့်အကောင့်ပိုင် ဖတ်စာတွင်သာ အသုံးပြုသည်</span></li>
      </ol>
      <p>Model key မချိတ်ထားချိန်တွင် စက်တွင်း deterministic အဖြေကို ပြသပါမယ်။</p>
    </section>
  );
  return (
    <AppShell rail={rail} aside={explainer}>
      <header className="page-heading">
        <p className="eyebrow">ASK SURIYA · PERSONAL READING</p>
        <h1 className="page-title">သုရိယကို မေးပါ</h1>
        <p className="page-lede">အရေးကြီးဆုံးမေးခွန်းတစ်ခုကို ရှင်းရှင်းလင်းလင်း ရေးပါ။ တွက်ချက်ထားသော ဇာတာအချက်အလက်ကို မြန်မာဘာသာဖြင့် အဓိပ္ပာယ်ဖွင့်ပေးပါမယ်။</p>
      </header>
      <section className="surface form-card ask-composer-card" aria-label="ဗေဒင် မေးခွန်းရေးရန်"><QuestionComposer initialQuestion={q} authenticated={Boolean(daily.user)} /></section>
    </AppShell>
  );
}
