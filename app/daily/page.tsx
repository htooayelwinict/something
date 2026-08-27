import type { Metadata } from "next";
import { ArrowRight } from "lucide-react";
import { AppShell } from "@/components/suriya/app-shell";
import { CosmicMetric } from "@/components/suriya/cosmic-metric";
import { DailyInsight } from "@/components/suriya/daily-insight";
import { IdentityRail } from "@/components/suriya/identity-rail";
import { LuckyWindow } from "@/components/suriya/lucky-window";
import { MethodSummary } from "@/components/suriya/method-summary";
import { getDailyExperience } from "@/lib/services/daily";

export const metadata: Metadata = { title: "နေ့စဉ်လမ်းညွှန်" };

export default async function DailyPage() {
  const daily = await getDailyExperience();
  return (
    <AppShell rail={<IdentityRail {...daily.identity} personalized={daily.personalized} />}>
      <header className="page-heading">
        <p className="eyebrow">DAILY READING · {daily.personalized ? "ကိုယ်ပိုင်တွက်ချက်မှု" : "နမူနာတွက်ချက်မှု"}</p>
        <h1 className="page-title">ယနေ့အတွက် သင့်အမြင်</h1>
        <p className="page-lede">နေ့စဉ်ကောင်းကင်အနေအထားနှင့် သင့်မွေးဇာတာဆက်နွယ်မှုမှ တွက်ချက်ထားသော လက်တွေ့လမ်းညွှန်။</p>
      </header>
      <section><DailyInsight data={daily.presentation} /></section>
      <div className="daily-metric-grid">
        <CosmicMetric label="CAREER" value={`${daily.presentation.categories.career}/100`} description="အလုပ်နှင့် တည်ဆောက်မှု" tone="green" />
        <CosmicMetric label="RELATIONSHIPS" value={`${daily.presentation.categories.relationships}/100`} description="ဆက်ဆံရေးစီးဆင်းမှု" tone="lilac" />
        <CosmicMetric label="FOCUS" value={`${daily.presentation.categories.focus}/100`} description="အာရုံနှင့် ဆုံးဖြတ်မှု" />
        <CosmicMetric label="ENERGY" value={`${daily.presentation.categories.energy}/100`} description="ကိုယ်စိတ်အရှိန်" tone="green" />
        <CosmicMetric label="CAUTION" value={`${daily.presentation.categories.caution}/100`} description="ပိုမြင့်လေ ပိုသတိထားရန်" />
      </div>
      <LuckyWindow
        favorableWindow={daily.presentation.favorableWindow}
        available={daily.presentation.windowAvailable}
        horaLord={daily.presentation.horaLord}
        confidence={daily.presentation.confidence}
      />
      <MethodSummary sources={daily.presentation.sources} />
      <div className="daily-actions">
        <a className="primary-button" href="/daily/details">ဇာတာအပြည့်အစုံ ကြည့်ရန် <ArrowRight size={15} aria-hidden="true" /></a>
        <a className="secondary-button" href="/ask">ကိုယ်ပိုင်မေးခွန်း မေးရန်</a>
      </div>
    </AppShell>
  );
}
