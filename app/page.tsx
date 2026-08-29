import type { Metadata } from "next";
import { AppShell } from "@/components/suriya/app-shell";
import { DailyBrief } from "@/components/suriya/daily-brief";
import { IdentityRail } from "@/components/suriya/identity-rail";
import { RecentReadingsRail } from "@/components/suriya/recent-readings-rail";
import { RouteCards } from "@/components/suriya/route-cards";
import { listReadings } from "@/db/repositories/readings";
import { getDailyExperience } from "@/lib/services/daily";

export const metadata: Metadata = { title: "ပင်မ" };
export const dynamic = "force-dynamic";

export default async function HomePage() {
  const daily = await getDailyExperience();
  const readings = daily.user ? await listReadings(daily.user.userId).catch(() => []) : [];
  return (
    <AppShell rail={<IdentityRail {...daily.identity} personalized={daily.personalized} />}>
      <header className="home-heading">
        <p className="eyebrow">ယနေ့ အကျဉ်းချုပ် · {daily.personalized ? "ကိုယ်ပိုင်ဖတ်စာ" : "နမူနာဖတ်စာ"}</p>
        <h1 className="page-title">မင်္ဂလာပါ{daily.user?.fullName ? `၊ ${daily.user.fullName}` : ""}</h1>
        <p className="page-lede">ယနေ့ အကျဉ်းကို ကြည့်ပြီး လိုအပ်သည့်နေရာသို့ တစ်ချက်နှိပ်၍ သွားပါ။</p>
        {!daily.personalized && (
          <a className="identity-chip" href="/profile">
            <strong>{daily.identity.name}</strong>
            <span>နမူနာအချက်အလက် · ကိုယ်ပိုင်ဇာတာ စတင်ရန် နှိပ်ပါ</span>
          </a>
        )}
      </header>
      <DailyBrief data={daily.presentation} personalized={daily.personalized} />
      <RouteCards />
      {daily.user && <RecentReadingsRail readings={readings} />}
    </AppShell>
  );
}
