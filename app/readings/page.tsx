import type { Metadata } from "next";
import { ArrowRight, BookOpen, LogIn } from "lucide-react";
import { chatGPTSignInPath, getChatGPTUser } from "@/app/chatgpt-auth";
import { AppShell } from "@/components/suriya/app-shell";
import { listReadings } from "@/db/repositories/readings";

export const metadata: Metadata = { title: "ဖတ်ကြားမှုမှတ်တမ်း" };
export const dynamic = "force-dynamic";

export default async function ReadingsPage() {
  const user = await getChatGPTUser();
  const readings = user ? await listReadings(user.userId).catch(() => []) : [];
  return (
    <AppShell>
      <header className="page-heading">
        <p className="eyebrow">PRIVATE COSMIC LIBRARY</p>
        <h1 className="page-title">ဖတ်ကြားမှုမှတ်တမ်း</h1>
        <p className="page-lede">ပြီးခဲ့သောမေးခွန်းများ၊ အသုံးပြုခဲ့သည့်နည်းလမ်းနှင့် သုရိယ၏ အမြင်များကို ပြန်လည်ဖတ်ရှုပါ။</p>
      </header>
      {!user ? (
        <section className="surface empty-state"><LogIn size={34} aria-hidden="true" /><h2>သင့်ကိုယ်ပိုင်မှတ်တမ်းကို ဝင်ကြည့်ပါ</h2><p>ဖတ်ကြားမှုများသည် အကောင့်ပိုင်ရှင်တစ်ဦးတည်းသာ မြင်နိုင်ပါတယ်။</p><a className="primary-button" href={chatGPTSignInPath("/readings")}>ChatGPT ဖြင့် ဝင်ရောက်မည်</a></section>
      ) : readings.length === 0 ? (
        <section className="surface empty-state"><BookOpen size={34} aria-hidden="true" /><h2>ဖတ်ကြားမှု မရှိသေးပါ</h2><p>စိတ်ထဲမှာ အရေးကြီးဆုံးမေးခွန်းတစ်ခုနှင့် စတင်နိုင်ပါတယ်။</p><a className="primary-button" href="/ask">ပထမမေးခွန်း မေးမည်</a></section>
      ) : (
        <section className="history-grid" aria-label="သိမ်းထားသော ဖတ်ကြားမှုများ">
          {readings.map((reading) => (
            <article className="surface prose-card reading-history-card" data-status={reading.status} key={reading.id}>
              <p className="eyebrow">{reading.kind} · {new Intl.DateTimeFormat("my-MM", { dateStyle: "medium" }).format(new Date(reading.createdAt))}</p>
              <h2>{reading.question}</h2>
              <p className="page-lede">{reading.status === "complete" ? "ဖတ်ကြားပြီး" : reading.status === "failed" ? "ပြန်စမ်းရန်လို" : "ရေးသားနေဆဲ"}</p>
              <a className="text-link" href={`/readings/${reading.id}`}>ပြန်ဖတ်ရန် <ArrowRight size={15} aria-hidden="true" /></a>
            </article>
          ))}
        </section>
      )}
    </AppShell>
  );
}
