import type { Metadata } from "next";
import { CircleHelp, LockKeyhole, Sparkles } from "lucide-react";
import { AppShell } from "@/components/suriya/app-shell";
import { QuestionComposer } from "@/components/suriya/question-composer";
import { QuotaPill } from "@/components/suriya/quota-pill";
import { RecentReadingsRail } from "@/components/suriya/recent-readings-rail";
import { TarotUpsell } from "@/components/suriya/tarot-upsell";
import { listReadings } from "@/db/repositories/readings";
import { dailyQuota } from "@/lib/readings/quota";
import { getDailyExperience } from "@/lib/services/daily";

export const metadata: Metadata = { title: "မေးမြန်းရန်", alternates: { canonical: "/ask" } };

export default async function AskPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const daily = await getDailyExperience();
  const readings = daily.user ? await listReadings(daily.user.userId).catch(() => []) : [];
  const { q = "" } = await searchParams;
  const quota = daily.user ? dailyQuota(readings, new Date()) : null;
  const rail = daily.user
    ? <RecentReadingsRail readings={readings} />
    : undefined;
  const explainer = (
    <details className="ask-method-disclosure disclosure-card surface">
      <summary><span>အဖြေတွက်ချက်ပုံ</span><small>နည်းလမ်း ၃ မျိုး</small></summary>
      <section className="ask-explainer disclosure-content" aria-labelledby="answer-method-title">
        <span className="ask-explainer-icon"><CircleHelp size={20} aria-hidden="true" /></span>
        <p className="eyebrow">ပွင့်လင်းမြင်သာမှု</p>
        <h2 className="sr-only" id="answer-method-title">အဖြေတွက်ချက်ပုံ</h2>
        <ol>
          <li><Sparkles size={14} aria-hidden="true" /><span><strong>မွေးဇာတာ</strong>မွေးချိန်၊ လဂ်နှင့် လက်ရှိဒဿာကာလ</span></li>
          <li><span aria-hidden="true">◉</span><span><strong>မေးချိန်နှင့် အချိန်ရွေးမှု</strong>မေးသည့်အချိန် သို့မဟုတ် နေထွက်၊ Hora နှင့် Panchanga</span></li>
          <li><LockKeyhole size={14} aria-hidden="true" /><span><strong>ကိုယ်ပိုင်အချက်အလက်</strong>သင့်အကောင့်ပိုင် ဖတ်စာတွင်သာ အသုံးပြုသည်</span></li>
        </ol>
        <p>Model key မချိတ်ထားချိန်တွင် စက်တွင်း deterministic အဖြေကို ပြသပါမယ်။</p>
      </section>
    </details>
  );
  return (
    <AppShell rail={rail}>
      <header className="page-heading">
        <p className="eyebrow">သုရိယကို မေးရန် · ကိုယ်ပိုင်ဖတ်စာ</p>
        <h1 className="page-title">သုရိယကို မေးပါ</h1>
        <p className="page-lede">အရေးကြီးဆုံးမေးခွန်းတစ်ခုကို ရှင်းရှင်းလင်းလင်း ရေးပြီး သင့်လိုအပ်ချက်နှင့် ကိုက်ညီသော တွက်ချက်နည်းကို ရွေးပါ။</p>
        {quota ? <QuotaPill used={quota.used} limit={quota.limit} /> : <p className="ask-quota-hint">မေးခွန်းမေးရန် အကောင့်ဝင်ပါ · တစ်နေ့ ၃ ကြိမ် အခမဲ့ မေးနိုင်ပါသည်။</p>}
      </header>
      {quota && quota.remaining === 0 ? (
        <TarotUpsell variant="quota" resetsAt={quota.resetsAt} />
      ) : (
        <section className="surface form-card ask-composer-card" aria-label="ဗေဒင် မေးခွန်းရေးရန်"><QuestionComposer initialQuestion={q} authenticated={Boolean(daily.user)} timezone={daily.chart.location.timezone} /></section>
      )}
      {explainer}
    </AppShell>
  );
}
