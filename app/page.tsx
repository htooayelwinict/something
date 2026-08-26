import type { Metadata } from "next";
import { ArrowRight } from "lucide-react";
import { AppShell } from "@/components/suriya/app-shell";
import { DailyInsight } from "@/components/suriya/daily-insight";
import { IdentityRail } from "@/components/suriya/identity-rail";
import { MethodSummary } from "@/components/suriya/method-summary";
import { RitualCard } from "@/components/suriya/ritual-card";
import { getDailyExperience } from "@/lib/services/daily";

export const metadata: Metadata = { title: "ပင်မ" };

export default async function HomePage() {
  const daily = await getDailyExperience();
  return (
    <AppShell rail={<IdentityRail {...daily.identity} personalized={daily.personalized} />}>
      <header className="home-heading">
        <div>
          <p className="eyebrow">YOUR COSMIC BRIEF · {daily.personalized ? "ကိုယ်ပိုင်ဖတ်စာ" : "နမူနာဖတ်စာ"}</p>
        <h1 className="page-title">မင်္ဂလာပါ{daily.user?.fullName ? `၊ ${daily.user.fullName}` : ""}</h1>
          <p className="page-lede">ကိုယ့်နေ့ရက်ကို နားလည်ပြီး သတိရှိရှိ ရှေ့ဆက်နိုင်ဖို့ တွက်ချက်ထားသော အမြင်တို။</p>
        </div>
        <section className="power-number" aria-label={`ယနေ့၏ အားကောင်းဂဏန်း ${daily.presentation.powerNumber}`}>
          <span>TODAY’S POWER NUMBER</span>
          <strong>{daily.presentation.powerNumber}</strong>
          <small>LIFE PATH RHYTHM</small>
        </section>
      </header>
      <section aria-label="ယနေ့၏ ကြယ်တာရာလမ်းညွှန်"><DailyInsight data={daily.presentation} /></section>
      <MethodSummary sources={daily.presentation.sources} />
      <RitualCard lifePath={daily.presentation.powerNumber} />
      <a className="primary-button home-ask-button" href="/ask">သုရိယကို မေးရန် <ArrowRight size={16} aria-hidden="true" /></a>
    </AppShell>
  );
}
