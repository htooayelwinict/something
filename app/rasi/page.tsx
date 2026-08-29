import type { Metadata } from "next";
import { AppShell } from "@/components/suriya/app-shell";
import { JsonLd } from "@/components/suriya/json-ld";
import { ZodiacGlyph } from "@/components/suriya/zodiac-glyph";
import { rasiContent } from "@/lib/content/rasi";
import { breadcrumbJsonLd, collectionJsonLd } from "@/lib/content/seo";

const description = "ဝေဒဗေဒင် (Jyotish) ရာသီ ၁၂ ခု၏ သဘောသဘာဝ၊ အုပ်စိုးဂြိုဟ်၊ ဓာတ်၊ ကံကောင်းသောနေ့နှင့် ယနေ့ ဂြိုဟ်အနေအထားကို မြန်မာဘာသာဖြင့် လေ့လာပါ။";

export const metadata: Metadata = {
  title: "ရာသီ ၁၂ ခု — ဝေဒဗေဒင် ရာသီခွင် လမ်းညွှန်",
  description,
  alternates: { canonical: "/rasi" },
  openGraph: { title: "ရာသီ ၁၂ ခု | သုရိယ", description, url: "/rasi" },
};

export default function RasiIndexPage() {
  return (
    <AppShell>
      <JsonLd data={[
        collectionJsonLd({ name: "ရာသီ ၁၂ ခု", description, path: "/rasi", items: rasiContent.map((item) => ({ name: `${item.nameMy}ရာသီ`, path: `/rasi/${item.slug}` })) }),
        breadcrumbJsonLd([{ name: "ပင်မ", path: "/" }, { name: "ရာသီများ", path: "/rasi" }]),
      ]} />
      <header className="page-heading">
        <p className="eyebrow">ရာသီခွင် · Jyotish</p>
        <h1 className="page-title">ရာသီ ၁၂ ခု</h1>
        <p className="page-lede">{description} သုရိယသည် Lahiri ayanamsa ဖြင့် သိဒ္ဓါန္တ (sidereal) ရာသီခွင်ကို အသုံးပြုသောကြောင့် အနောက်တိုင်း ဗေဒင်ရာသီနှင့် ကွာခြားနိုင်ပါသည်။</p>
      </header>
      <nav className="rasi-grid" aria-label="ရာသီများ">
        {rasiContent.map((item) => (
          <a className="surface rasi-card" href={`/rasi/${item.slug}`} key={item.slug}>
            <ZodiacGlyph signIndex={item.index} size="lg" />
            <span className="rasi-card-name">{item.nameMy}ရာသီ</span>
            <span className="rasi-card-meta">{item.nameSa} · {item.rulingPlanetMy}ဂြိုဟ် · {item.element}ဓာတ်</span>
          </a>
        ))}
      </nav>
      <section className="surface prose-card" aria-labelledby="rasi-method">
        <div className="section-title"><h2 id="rasi-method">ရာသီကို ဘယ်လို သတ်မှတ်သလဲ</h2></div>
        <p>ဝေဒဗေဒင်တွင် မွေးချိန်၌ လ ရှိနေသော ရာသီ (ဇန္မရာသီ) နှင့် အရှေ့မိုးကုပ်စက်ဝိုင်းတွင် ထွက်နေသော ရာသီ (လဂ်) နှစ်ခုစလုံးကို အဓိကထားပါသည်။ သင့်တိကျသော မွေးဇာတာကို ကြည့်ရန် <a className="text-link" href="/chart">မွေးဇာတာ</a> စာမျက်နှာသို့ သွားပါ။</p>
      </section>
    </AppShell>
  );
}
