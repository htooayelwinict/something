import type { Metadata } from "next";
import { ArrowDown, CalendarCheck, HandCoins, PhoneCall, ShieldCheck, UserRoundSearch } from "lucide-react";
import { AppShell } from "@/components/suriya/app-shell";
import { ConsultantDirectory } from "@/components/suriya/consultant-directory";
import { listSpecialists } from "@/db/repositories/specialists";
import { JsonLd } from "@/components/suriya/json-ld";
import { tarotFaq } from "@/lib/content/business";
import { demoSpecialists, specialistFromRow } from "@/lib/content/demo";
import { breadcrumbJsonLd, faqJsonLd, localBusinessJsonLd } from "@/lib/content/seo";

export const metadata: Metadata = { title: "Tarot လူချင်းတွေ့ ဆွေးနွေးမှု", alternates: { canonical: "/tarot" } };

const steps = [
  { icon: UserRoundSearch, title: "ပညာရှင် ရွေးပါ", text: "အထူးပြုနှင့် ရနိုင်သောရက်ကို ကြည့်၍ သင့်နှင့် ကိုက်ညီသူကို ရွေးပါ။" },
  { icon: CalendarCheck, title: "ရက်ချိန်း တောင်းဆိုပါ", text: "အမည်၊ ဖုန်းနံပါတ်နှင့် လိုချင်သည့်ရက်ကို ဖြည့်ပါ။ တစ်မိနစ်သာ ကြာပါသည်။" },
  { icon: PhoneCall, title: "ဖုန်းဖြင့် အတည်ပြုမည်", text: "၂၄ နာရီအတွင်း ပြန်လည်ဆက်သွယ်၍ နေရာနှင့် အချိန်ကို အတည်ပြုပေးပါမည်။" },
];

const trust = [
  { icon: HandCoins, text: "ငွေကို ဆွေးနွေးချိန်တွင်သာ ပေးချေပါ။ ကြိုတင်ငွေ မလိုပါ။" },
  { icon: ShieldCheck, text: "သင့်အချက်အလက်နှင့် ဆွေးနွေးမှုကို လျှို့ဝှက်ထားပါသည်။" },
  { icon: CalendarCheck, text: "၂၄ နာရီ ကြိုတင်၍ အခမဲ့ ပြောင်းလဲ သို့မဟုတ် ပယ်ဖျက်နိုင်ပါသည်။" },
];

export default async function TarotPage() {
  const rows = await listSpecialists().catch(() => []);
  const specialists = rows.length > 0 ? rows.map(specialistFromRow) : demoSpecialists;
  return (
    <AppShell>
      <JsonLd data={[localBusinessJsonLd(specialists), faqJsonLd(tarotFaq), breadcrumbJsonLd([{ name: "ပင်မ", path: "/" }, { name: "Tarot ဆွေးနွေးမှု", path: "/tarot" }])]} />
      <header className="tarot-hero">
        <p className="eyebrow">Tarot · လူချင်းတွေ့ ဆွေးနွေးမှု</p>
        <h1 className="page-title">Tarot ပညာရှင်နှင့် လူချင်းတွေ့ ဆွေးနွေးပါ</h1>
        <p className="page-lede">ဇာတာက ပြသနေသည့် အခြေအနေကို လူသားအမြင်ဖြင့် နက်နက်နဲနဲ ဆွေးနွေးလိုပါက ရန်ကုန်ရှိ Tarot ပညာရှင်များနှင့် ၃၀ မိနစ် လူချင်းတွေ့ ဆွေးနွေးမှုကို ရက်ချိန်းယူနိုင်ပါသည်။ မြန်မာဘာသာဖြင့် ပြောဆိုပြီး ဆွေးနွေးချိန်တွင်သာ ငွေပေးချေပါ။</p>
        <a className="primary-button tarot-hero-cta" href="#consultants">ပညာရှင် ရွေးရန် <ArrowDown size={15} aria-hidden="true" /></a>
      </header>
      <section aria-labelledby="how-title">
        <div className="section-title"><h2 id="how-title">ဘယ်လို အလုပ်လုပ်သလဲ</h2></div>
        <ol className="tarot-steps">
          {steps.map((step, index) => (
            <li key={step.title}>
              <span className="tarot-step-index" aria-hidden="true"><step.icon size={18} /></span>
              <strong>{index + 1}. {step.title}</strong>
              <p>{step.text}</p>
            </li>
          ))}
        </ol>
      </section>
      <section aria-labelledby="consultants-title">
        <div className="section-title"><h2 id="consultants-title">ပညာရှင်များ</h2><span className="section-note">ရန်ကုန် · မြန်မာဘာသာ</span></div>
        <ConsultantDirectory specialists={specialists} />
      </section>
      <ul className="tarot-trust" aria-label="ယုံကြည်စိတ်ချရမှု">
        {trust.map((item) => <li key={item.text}><item.icon size={16} aria-hidden="true" /><span>{item.text}</span></li>)}
      </ul>
      <section className="surface prose-card" aria-labelledby="tarot-faq-title">
        <div className="section-title"><h2 id="tarot-faq-title">မေးလေ့ရှိသော မေးခွန်းများ</h2></div>
        <dl className="faq-list">{tarotFaq.map((item) => <div key={item.question}><dt>{item.question}</dt><dd>{item.answer}</dd></div>)}</dl>
      </section>
    </AppShell>
  );
}
