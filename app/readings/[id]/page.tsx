import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { notFound } from "next/navigation";
import { requireChatGPTUser } from "@/app/chatgpt-auth";
import { AppShell } from "@/components/suriya/app-shell";
import { ChartGrid } from "@/components/suriya/chart-grid";
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
      <Link className="text-link" href="/readings"><ArrowLeft size={15} aria-hidden="true" /> မှတ်တမ်းသို့</Link>
      <header className="page-heading">
        <p className="eyebrow">{reading.kind} · {reading.calculationVersion}</p>
        <h1 className="page-title">{reading.question}</h1>
        <p className="page-lede">ဒီအမြင်ကို သင့်မွေးဇာတာတွက်ချက်မှုမှ ဖန်တီးထားပြီး လက်တွေ့ဆုံးဖြတ်ချက်ကို ပြန်လည်စဉ်းစားရန် ရည်ရွယ်ပါတယ်။</p>
      </header>
      <StreamingReading id={reading.id} initialText={reading.responseText} initialStatus={reading.status} />
      <ChartGrid chart={chart} />
    </AppShell>
  );
}
