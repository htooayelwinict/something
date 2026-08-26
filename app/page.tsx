import type { Metadata } from "next";
import { ArrowRight, MessageCircleMore } from "lucide-react";
import { AppShell } from "@/components/suriya/app-shell";
import { DailyInsight } from "@/components/suriya/daily-insight";
import { demoDailyInsight } from "@/lib/content/demo";
import { getDailyExperience } from "@/lib/services/daily";

export const metadata: Metadata = { title: "ပင်မ" };

export default async function HomePage() {
  const daily = await getDailyExperience();
  return (
    <AppShell>
      <header className="page-heading">
        <p className="eyebrow">{demoDailyInsight.dateLabel}</p>
        <h1 className="page-title">မင်္ဂလာပါ{daily.user?.fullName ? `၊ ${daily.user.fullName}` : ""}</h1>
        <p className="page-lede">ကိုယ့်နေ့ရက်ကို နားလည်ပြီး သတိရှိရှိ ရှေ့ဆက်နိုင်ဖို့ ကြယ်တာရာအမြင်တိုတစ်ခု။</p>
      </header>
      <div className="home-grid">
        <section aria-label="ယနေ့၏ ကြယ်တာရာလမ်းညွှန်"><DailyInsight data={daily.presentation} /></section>
        <aside className="soft-card oracle-card">
          <span className="metric-icon"><MessageCircleMore size={19} aria-hidden="true" /></span>
          <div><h3>မေးချင်တာရှိပါသလား။</h3><p>မွေးဇာတာ၊ မေးခွန်းအချိန်နှင့် မင်္ဂလာအချိန်ရွေးချယ်မှုတို့မှ တစ်ခုရွေးပြီး မေးနိုင်ပါတယ်။</p></div>
          <a className="secondary-button" href="/ask">မေးမြန်းရန် <ArrowRight size={16} aria-hidden="true" /></a>
        </aside>
      </div>
    </AppShell>
  );
}
