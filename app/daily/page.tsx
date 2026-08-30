import type { Metadata } from "next";
import { ArrowRight } from "lucide-react";
import { AppShell } from "@/components/suriya/app-shell";
import { CosmicMetric } from "@/components/suriya/cosmic-metric";
import { DailyEvidence, DailyInsight } from "@/components/suriya/daily-insight";
import { IdentityRail } from "@/components/suriya/identity-rail";
import { LuckyWindow } from "@/components/suriya/lucky-window";
import { MethodFootnote } from "@/components/suriya/method-footnote";
import { PanchangaStrip } from "@/components/suriya/panchanga-strip";
import { PeriodTabs } from "@/components/suriya/period-tabs";
import { StreamingReading } from "@/components/suriya/streaming-reading";
import { TarotUpsell } from "@/components/suriya/tarot-upsell";
import { getConfiguredInterpretationMode } from "@/lib/ai";
import { toBurmeseDigits } from "@/lib/content/burmese-digits";
import { getDailyExperience } from "@/lib/services/daily";

export const metadata: Metadata = { title: "နေ့စဉ်ဖတ်စာ", alternates: { canonical: "/daily" } };

const categoryCopy = [
  ["career", "အလုပ်အကိုင်", "အလုပ်နှင့် တည်ဆောက်မှု", "green"],
  ["relationships", "ဆက်ဆံရေး", "ဆက်ဆံရေးစီးဆင်းမှု", "lilac"],
  ["focus", "အာရုံစူးစိုက်မှု", "အာရုံနှင့် ဆုံးဖြတ်မှု", "paper"],
  ["energy", "စွမ်းအင်", "ကိုယ်စိတ်အရှိန်", "green"],
  ["caution", "သတိ", "ပိုမြင့်လေ ပိုသတိထားရန်", "paper"],
] as const;

export default async function DailyPage() {
  const daily = await getDailyExperience();
  const { presentation } = daily;
  return (
    <AppShell rail={daily.personalized ? <IdentityRail {...daily.identity} personalized /> : undefined}>
      <header className="page-heading">
        <p className="eyebrow">နေ့စဉ်ဖတ်စာ · {daily.personalized ? "ကိုယ်ပိုင်တွက်ချက်မှု" : "နမူနာတွက်ချက်မှု"}</p>
        <h1 className="page-title">ယနေ့အတွက် သင့်အမြင်</h1>
        <p className="page-lede">ယနေ့ ဂြိုဟ်ရွေ့လျားမှု၊ လက်ရှိဒဿာနှင့် Panchanga ကို သင့်မွေးဇာတာနှင့် တိုက်ဆိုင်၍ တွက်ချက်ထားသော လက်တွေ့လမ်းညွှန်။</p>
      </header>
      <PeriodTabs active="daily" />
      <section aria-label="ယနေ့ အမှတ်နှင့် အကြောင်းရင်း"><DailyInsight data={presentation} /></section>
      <StreamingReading id="daily" endpoint="/api/period-readings/daily/stream" initialStatus="generating" interpretationMode={getConfiguredInterpretationMode()} title="သုရိယ၏ ယနေ့အမြင်" headingId="daily-reading" />
      <DailyEvidence data={presentation} />
      <LuckyWindow
        favorableWindow={presentation.favorableWindow}
        available={presentation.windowAvailable}
        horaLord={presentation.horaLord}
        timingStatus={presentation.timingStatus}
        timing={presentation.timing}
      />
      <details className="daily-data-disclosure disclosure-card surface">
        <summary><span>ကဏ္ဍအမှတ်နှင့် နေ့စွဲအသေးစိတ်</span><small>လိုအပ်သည့်အခါ ဖွင့်ကြည့်ရန်</small></summary>
        <div className="disclosure-content daily-data-content">
          <section aria-labelledby="category-title">
            <div className="section-title"><h2 id="category-title">ကဏ္ဍအလိုက် အမှတ်</h2><span className="section-note">၂၀–၉၅ အတွင်း</span></div>
            <div className="daily-metric-grid">
              {categoryCopy.map(([key, label, description, tone]) => (
                <CosmicMetric key={key} label={label} value={toBurmeseDigits(presentation.categories[key])} description={description} tone={tone} />
              ))}
            </div>
          </section>
          <PanchangaStrip title="ယနေ့ Panchanga" data={presentation.panchanga} note="အချိန်ရွေးချယ်မှုနှင့် ယနေ့အမှတ်တွင် ထည့်တွက်ထားသော နေ့စွဲအချက်များ။" />
        </div>
      </details>
      <div className="daily-actions">
        <a className="primary-button" href="/ask">ဤအကြောင်း မေးရန် <ArrowRight size={15} aria-hidden="true" /></a>
        <a className="secondary-button" href="/chart">မွေးဇာတာ ကြည့်ရန်</a>
      </div>
      <TarotUpsell variant="inline" />
      <MethodFootnote version={presentation.rulesetVersion} />
    </AppShell>
  );
}
