import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { AppShell } from "@/components/suriya/app-shell";
import { DailyInsight } from "@/components/suriya/daily-insight";
import { demoDailyInsight } from "@/lib/content/demo";
import { ChartGrid } from "@/components/suriya/chart-grid";
import { getDailyExperience } from "@/lib/services/daily";

export const metadata: Metadata = { title: "နေ့စဉ်လမ်းညွှန်" };

export default async function DailyPage() {
  const daily = await getDailyExperience();
  return (
    <AppShell>
      <header className="page-heading">
        <p className="eyebrow">{demoDailyInsight.dateLabel}</p>
        <h1 className="page-title">ယနေ့အတွက် သင့်အမြင်</h1>
        <p className="page-lede">နေ့စဉ်ကောင်းကင်အနေအထားနှင့် သင့်မွေးဇာတာဆက်နွယ်မှုမှ တွက်ချက်ထားသော လက်တွေ့လမ်းညွှန်။</p>
      </header>
      <div className="daily-layout">
        <section><DailyInsight expanded data={daily.presentation} /></section>
        <aside className="surface prose-card">
          <p className="eyebrow">သတိပြုရန်</p>
          <h2>လမ်းညွှန်၊ အမိန့်မဟုတ်ပါ</h2>
          <p className="page-lede">ကြယ်တာရာအမြင်ကို ကိုယ့်ဆုံးဖြတ်ချက်ကို ပြန်လည်စဉ်းစားရန် အသုံးချပါ။ ကျန်းမာရေး၊ ဥပဒေ သို့မဟုတ် ငွေကြေးကိစ္စများအတွက် ပညာရှင်နှင့် တိုင်ပင်ပါ။</p>
          <Link className="text-link" href="/ask">ကိုယ်ပိုင်မေးခွန်း မေးရန် <ArrowRight size={15} aria-hidden="true" /></Link>
        </aside>
      </div>
      <ChartGrid chart={daily.chart} />
    </AppShell>
  );
}
