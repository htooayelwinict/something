import type { Metadata } from "next";
import { ArrowLeft } from "lucide-react";
import { AppShell } from "@/components/suriya/app-shell";
import { ChartGrid } from "@/components/suriya/chart-grid";
import { DailyInsight } from "@/components/suriya/daily-insight";
import { IdentityRail } from "@/components/suriya/identity-rail";
import { MethodSummary } from "@/components/suriya/method-summary";
import { getDailyExperience } from "@/lib/services/daily";

export const metadata: Metadata = { title: "နေ့စဉ်ဇာတာ အသေးစိတ်" };

export default async function DailyDetailsPage() {
  const daily = await getDailyExperience();
  return (
    <AppShell rail={<IdentityRail {...daily.identity} personalized={daily.personalized} />}>
      <a className="back-link" href="/daily"><ArrowLeft size={15} aria-hidden="true" /> နေ့စဉ်ဖတ်စာသို့</a>
      <header className="page-heading reading-heading">
        <p className="eyebrow">HOROSCOPE DETAIL · CALCULATED CHARTS</p>
        <h1 className="page-title">ယနေ့ဖတ်စာ၏ အကြောင်းရင်းများ</h1>
        <p className="page-lede">D1၊ D9 နှင့် D10 ဇာတာများအပါအဝင် သင့်မွေးဖွားမှုအချက်အလက်မှ တွက်ချက်ထားသော အမြင်။</p>
      </header>
      <DailyInsight expanded data={daily.presentation} />
      <MethodSummary sources={daily.presentation.sources} />
      <ChartGrid chart={daily.chart} />
      <aside className="safety-note">
        <strong>လမ်းညွှန်အဖြစ်သာ အသုံးပြုပါ</strong>
        <p>ဤဖတ်စာသည် ဆေးဘက်၊ ဥပဒေ သို့မဟုတ် ငွေကြေးပညာရှင်၏ အကြံဉာဏ်ကို အစားမထိုးပါ။</p>
      </aside>
    </AppShell>
  );
}
