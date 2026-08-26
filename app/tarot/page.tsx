import type { Metadata } from "next";
import { AppShell } from "@/components/suriya/app-shell";
import { TarotSpecialistCard } from "@/components/suriya/tarot-specialist-card";
import { demoSpecialists } from "@/lib/content/demo";

export const metadata: Metadata = { title: "Tarot ဆွေးနွေးမှု" };

export default function TarotPage() {
  return (
    <AppShell>
      <header className="page-heading">
        <p className="eyebrow">Human guidance · Preview</p>
        <h1 className="page-title">Tarot တိုက်ရိုက်ဆွေးနွေး</h1>
        <p className="page-lede">လူသားအမြင်တစ်ခု လိုအပ်သည့်အခါ ဆွေးနွေးနိုင်မည့် Tarot ပညာရှင်များကို မိတ်ဆက်ထားပါတယ်။ တိုက်ရိုက် booking ကို မကြာမီ ဖွင့်ပါမယ်။</p>
      </header>
      <section className="tarot-grid" aria-label="Tarot ပညာရှင်များ">
        {demoSpecialists.map((specialist) => <TarotSpecialistCard key={specialist.id} specialist={specialist} />)}
      </section>
    </AppShell>
  );
}
