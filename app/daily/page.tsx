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
        <CosmicMetric label="DAILY ENERGY" value={`${daily.presentation.score}/100`} description={daily.presentation.energy} tone="green" />
        <CosmicMetric label="MOON POSITION" value={daily.presentation.moonSign} description="Vedic · တွက်ချက်ပြီး" tone="lilac" />
        <CosmicMetric label="MYANMAR ASTROLOGY" value="မချိတ်ဆက်ရသေး" description="မကြာမီ ရရှိမည်" />
      </div>
      <LuckyWindow favorableWindow={daily.presentation.favorableWindow} />
      <MethodSummary sources={daily.presentation.sources} />
      <div className="daily-actions">
        <a className="primary-button" href="/daily/details">ဇာတာအပြည့်အစုံ ကြည့်ရန် <ArrowRight size={15} aria-hidden="true" /></a>
        <a className="secondary-button" href="/ask">ကိုယ်ပိုင်မေးခွန်း မေးရန်</a>
      </div>
    </AppShell>
  );
}
