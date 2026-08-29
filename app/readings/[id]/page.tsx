import type { Metadata } from "next";
import { ArrowLeft } from "lucide-react";
import { notFound } from "next/navigation";
import { requireChatGPTUser } from "@/app/chatgpt-auth";
import { AppShell } from "@/components/suriya/app-shell";
import { DivisionalCharts } from "@/components/suriya/divisional-charts";
import { PlacementList } from "@/components/suriya/placement-list";
import { SouthIndianChart } from "@/components/suriya/south-indian-chart";
import { ReadingFeedback } from "@/components/suriya/reading-feedback";
import { ReadingSources } from "@/components/suriya/reading-sources";
import { StreamingReading } from "@/components/suriya/streaming-reading";
import { TarotUpsell } from "@/components/suriya/tarot-upsell";
import { getReading } from "@/db/repositories/readings";
import { readingBasisLede, readingChart, type ReadingSnapshotLike } from "@/lib/readings/snapshot";

export const metadata: Metadata = { title: "ကိုယ်ပိုင် ဖတ်ကြားမှု" };
export const dynamic = "force-dynamic";

export default async function ReadingPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireChatGPTUser("/readings");
  const { id } = await params;
  const reading = await getReading(user.userId, id).catch(() => null);
  if (!reading) notFound();
  const snapshot = reading.chartSnapshot as unknown as ReadingSnapshotLike;
  const fallbackTechnique = reading.kind === "prashna" || reading.kind === "muhurta" ? reading.kind : "janma";
  const chart = readingChart(snapshot);
  const lede = readingBasisLede(snapshot, fallbackTechnique);
  return (
    <AppShell>
      <a className="text-link" href="/readings"><ArrowLeft size={15} aria-hidden="true" /> မှတ်တမ်းသို့</a>
      <header className="page-heading">
        <p className="eyebrow">{reading.kind} · {reading.calculationVersion}</p>
        <h1 className="page-title">{reading.question}</h1>
        <p className="page-lede">{lede}</p>
      </header>
      <StreamingReading
        id={reading.id}
        initialText={reading.responseText}
        initialStatus={reading.status}
        interpretationMode={reading.interpretationMode}
      />
      <ReadingSources chart={snapshot} />
      <section className="follow-up-panel" aria-labelledby="follow-up-title">
        <p className="eyebrow">CONTINUE THE THREAD</p>
        <h2 id="follow-up-title">ဆက်မေးနိုင်သည့် မေးခွန်းများ</h2>
        <div>
          <a href="/ask?q=ဒီအဖြေထဲက ဘယ်အရာကို ပထမဆုံး လုပ်ဆောင်သင့်ပါသလဲ။">ဘယ်အရာကို ပထမဆုံး လုပ်ဆောင်ရမလဲ။</a>
          <a href="/ask?q=ဒီအခြေအနေမှာ သတိထားရမည့် အချက်က ဘာလဲ။">ဘာကို သတိထားသင့်သလဲ။</a>
          <a href="/ask?q=လာမည့်အပတ်အတွက် လက်တွေ့လုပ်ဆောင်ချက်တစ်ခု ပေးပါ။">လာမည့်အပတ်အတွက် လုပ်ဆောင်ချက်</a>
        </div>
      </section>
      <ReadingFeedback id={reading.id} initialValue={reading.feedback} />
      <TarotUpsell variant="inline" />
      <section className="surface prose-card reading-chart" aria-labelledby="chart-title">
        <div className="section-title"><h2 id="chart-title">ဤအဖြေအတွက် တွက်ချက်ထားသောဇာတာ</h2></div>
        <SouthIndianChart chart={chart} division="d1" size="compact" describedBy="placement-list" />
      </section>
      <PlacementList chart={chart} />
      <DivisionalCharts chart={chart} />
    </AppShell>
  );
}
