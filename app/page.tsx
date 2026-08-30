import type { Metadata } from "next";
import { AppShell } from "@/components/suriya/app-shell";
import { DailyBrief } from "@/components/suriya/daily-brief";
import { IdentityRail } from "@/components/suriya/identity-rail";
import { RouteCards } from "@/components/suriya/route-cards";
import { getDailyExperience } from "@/lib/services/daily";

export const metadata: Metadata = { title: "ယနေ့", alternates: { canonical: "/" } };
export const dynamic = "force-dynamic";

export default async function HomePage() {
  const daily = await getDailyExperience();
  return (
    <AppShell rail={daily.personalized ? <IdentityRail {...daily.identity} personalized /> : undefined}>
      <header className="home-heading">
        <p className="eyebrow">သုရိယ · ယနေ့</p>
        <h1 className="page-title">ယနေ့အတွက် လမ်းညွှန်{daily.user?.fullName ? `၊ ${daily.user.fullName}` : ""}</h1>
        <p className="page-lede">ယနေ့ဖတ်စာကို ကြည့်၊ ကိုယ်ပိုင်မေးခွန်းမေး၊ သို့မဟုတ် Tarot ပညာရှင်နှင့် လူချင်းတွေ့ ဆွေးနွေးပါ။</p>
        {!daily.personalized && (
          <p className="home-demo-note">ယခု နမူနာဖတ်စာကို ပြထားသည်။ <a href="/profile">သင့်ကိုယ်ပိုင်ဖတ်စာအတွက် မွေးချိန်ထည့်ရန်</a></p>
        )}
      </header>
      <DailyBrief data={daily.presentation} personalized={daily.personalized} />
      <RouteCards />
      <a className="home-chart-link text-link" href="/chart">ဤဖတ်စာနောက်က မွေးဇာတာကို ကြည့်ရန်</a>
    </AppShell>
  );
}
