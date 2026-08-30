import { LogIn } from "lucide-react";
import { chatGPTSignInPath } from "@/app/chatgpt-auth";
import { AppShell } from "@/components/suriya/app-shell";
import { IdentityRail } from "@/components/suriya/identity-rail";
import { MethodFootnote } from "@/components/suriya/method-footnote";
import { PeriodOverview } from "@/components/suriya/period-overview";
import { PeriodTabs } from "@/components/suriya/period-tabs";
import { StreamingReading } from "@/components/suriya/streaming-reading";
import { TarotUpsell } from "@/components/suriya/tarot-upsell";
import { getConfiguredInterpretationMode } from "@/lib/ai";
import { periodCopy } from "@/lib/content/period-copy";
import { getDailyExperience } from "@/lib/services/daily";
import { periodReadingFor } from "@/lib/services/period-reading";

/** Shared server page for /daily/week and /daily/month. */
export async function PeriodPage({ kind, path }: { kind: "weekly" | "monthly"; path: string }) {
  const daily = await getDailyExperience();
  const copy = periodCopy[kind];
  const rail = daily.personalized ? <IdentityRail {...daily.identity} personalized /> : undefined;
  if (!daily.personalized) {
    return (
      <AppShell rail={rail}>
        <header className="page-heading">
          <p className="eyebrow">{copy.eyebrow}</p>
          <h1 className="page-title">{copy.title}</h1>
          <p className="page-lede">{copy.lede}</p>
        </header>
        <PeriodTabs active={kind} />
        <section className="surface empty-state period-signin">
          <LogIn size={34} aria-hidden="true" />
          <h2>ဝင်ရောက်ပြီး အပတ်စဉ်နှင့် လစဉ် ဖတ်စာကို အခမဲ့ ရယူပါ</h2>
          <p><strong>သင့်မွေးချိန်အတိုင်း တွက်ချက်ပေးမည်။</strong> {daily.user ? "မွေးဇာတာအချက်အလက် ထည့်သွင်းပြီးပါက သင့်ကိုယ်ပိုင် ဖတ်စာကို တွက်ချက်ပေးပါမည်။" : "အပတ်စဉ်နှင့် လစဉ် ဖတ်စာများကို သင့်မွေးဇာတာနှင့် တိုက်ဆိုင်တွက်ချက်ပြီး အကောင့်ထဲတွင် သိမ်းထားပါမည်။"}</p>
          <a className="primary-button" href={daily.user ? "/onboarding" : chatGPTSignInPath(path)}>{daily.user ? "မွေးဇာတာ ထည့်သွင်းရန်" : "အကောင့်ဖွင့်/ဝင်ရောက်မည် (ChatGPT)"}</a>
          <a className="text-link" href="/daily">ယနေ့ဖတ်စာသို့ ပြန်သွားရန်</a>
        </section>
      </AppShell>
    );
  }
  const bundle = periodReadingFor(daily.chart.input, kind, new Date(), daily.chart);
  return (
    <AppShell rail={rail}>
      <header className="page-heading">
        <p className="eyebrow">{copy.eyebrow} · ကိုယ်ပိုင်တွက်ချက်မှု</p>
        <h1 className="page-title">{copy.title}</h1>
        <p className="page-lede">{bundle.period.label} · {copy.lede}</p>
      </header>
      <PeriodTabs active={kind} />
      <PeriodOverview evidence={bundle.evidence} />
      <StreamingReading id={kind} endpoint={`/api/period-readings/${kind}/stream`} initialStatus="generating" interpretationMode={getConfiguredInterpretationMode()} title={copy.readingTitle} headingId="period-reading" />
      <TarotUpsell variant="inline" />
      <MethodFootnote version={daily.chart.version} />
    </AppShell>
  );
}
