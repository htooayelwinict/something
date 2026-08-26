import type { Metadata } from "next";
import { ArrowLeft } from "lucide-react";
import { notFound } from "next/navigation";
import { requireChatGPTUser } from "@/app/chatgpt-auth";
import { AppShell } from "@/components/suriya/app-shell";
import { ChartGrid } from "@/components/suriya/chart-grid";
import { ReadingFeedback } from "@/components/suriya/reading-feedback";
import { ReadingSources } from "@/components/suriya/reading-sources";
import { StreamingReading } from "@/components/suriya/streaming-reading";
import { getReading } from "@/db/repositories/readings";
import type { ChartSnapshot } from "@/lib/astrology/types";

export const metadata: Metadata = { title: "ကိုယ်ပိုင် ဖတ်ကြားမှု" };
export const dynamic = "force-dynamic";

export default async function ReadingPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireChatGPTUser("/readings");
  const { id } = await params;
  const reading = await getReading(user.userId, id).catch(() => null);
  if (!reading) notFound();
  const chart = reading.chartSnapshot as unknown as ChartSnapshot;
  return (
    <AppShell>
      <a className="text-link" href="/readings"><ArrowLeft size={15} aria-hidden="true" /> မှတ်တမ်းသို့</a>
      <header className="page-heading">
        <p className="eyebrow">{reading.kind} · {reading.calculationVersion}</p>
        <h1 className="page-title">{reading.question}</h1>
        <p className="page-lede">ဒီအမြင်ကို သင့်မွေးဇာတာတွက်ချက်မှုမှ ဖန်တီးထားပြီး လက်တွေ့ဆုံးဖြတ်ချက်ကို ပြန်လည်စဉ်းစားရန် ရည်ရွယ်ပါတယ်။</p>
      </header>
      <StreamingReading
        id={reading.id}
        initialText={reading.responseText}
        initialStatus={reading.status}
        interpretationMode={reading.interpretationMode}
      />
      <ReadingSources chart={chart} />
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
      <ChartGrid chart={chart} />
    </AppShell>
  );
}
