import type { Metadata } from "next";
import { ArrowRight } from "lucide-react";
import { notFound } from "next/navigation";
import { AppShell } from "@/components/suriya/app-shell";
import { JsonLd } from "@/components/suriya/json-ld";
import { TarotUpsell } from "@/components/suriya/tarot-upsell";
import { ZodiacGlyph } from "@/components/suriya/zodiac-glyph";
import { zodiacSignsMyanmar } from "@/lib/astrology/types";
import { toBurmeseDigits } from "@/lib/content/burmese-digits";
import { findRasi, rasiContent } from "@/lib/content/rasi";
import { articleJsonLd, breadcrumbJsonLd } from "@/lib/content/seo";
import { publicToday } from "@/lib/services/public-today";

export const dynamic = "force-dynamic";

function describe(slug: string) {
  const rasi = findRasi(slug);
  return rasi ? `${rasi.nameMy}ရာသီ (${rasi.nameSa}) ၏ သဘောသဘာဝ၊ အုပ်စိုးဂြိုဟ် ${rasi.rulingPlanetMy}၊ ${rasi.element}ဓာတ်၊ ကံကောင်းသောနေ့နှင့် ယနေ့ လ၊ ကြာသပတေး၊ စနေ ဂြိုဟ်အနေအထားကို မြန်မာဘာသာဖြင့် ဖတ်ရှုပါ။` : "";
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const rasi = findRasi(slug);
  if (!rasi) return { title: "ရာသီ မတွေ့ပါ" };
  return {
    title: `${rasi.nameMy}ရာသီ — သဘောသဘာဝနှင့် ယနေ့ ဂြိုဟ်အနေအထား`,
    description: describe(slug),
    keywords: rasi.keywords,
    alternates: { canonical: `/rasi/${rasi.slug}` },
    openGraph: { title: `${rasi.nameMy}ရာသီ | သုရိယ`, description: describe(slug), url: `/rasi/${rasi.slug}` },
  };
}

export default async function RasiPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const rasi = findRasi(slug);
  if (!rasi) notFound();
  const today = publicToday();
  const houseFrom = (signIndex: number) => ((signIndex - rasi.index + 12) % 12) + 1;
  const others = rasiContent.filter((item) => item.slug !== rasi.slug);
  return (
    <AppShell>
      <JsonLd data={[
        articleJsonLd({ headline: `${rasi.nameMy}ရာသီ — သဘောသဘာဝနှင့် ယနေ့ ဂြိုဟ်အနေအထား`, description: describe(slug), path: `/rasi/${rasi.slug}`, keywords: rasi.keywords, modified: today.modified }),
        breadcrumbJsonLd([{ name: "ပင်မ", path: "/" }, { name: "ရာသီများ", path: "/rasi" }, { name: `${rasi.nameMy}ရာသီ`, path: `/rasi/${rasi.slug}` }]),
      ]} />
      <nav className="breadcrumbs" aria-label="လမ်းကြောင်း"><a href="/">ပင်မ</a><span aria-hidden="true">›</span><a href="/rasi">ရာသီများ</a><span aria-hidden="true">›</span><span aria-current="page">{rasi.nameMy}ရာသီ</span></nav>
      <header className="rasi-hero dark-card">
        <div className="hero-sky" aria-hidden="true" />
        <ZodiacGlyph signIndex={rasi.index} size="lg" />
        <div>
          <p className="eyebrow">ရာသီ {toBurmeseDigits(rasi.index + 1)} · {rasi.nameSa} · {rasi.nameEn}</p>
          <h1 className="page-title">{rasi.nameMy}ရာသီ</h1>
          <p className="page-lede">{rasi.temperament}</p>
        </div>
        <dl className="rasi-facts">
          <div><dt>အုပ်စိုးဂြိုဟ်</dt><dd>{rasi.rulingPlanetMy} ({rasi.rulingPlanet})</dd></div>
          <div><dt>ဓာတ်</dt><dd>{rasi.element}</dd></div>
          <div><dt>သဘော</dt><dd>{rasi.quality}</dd></div>
          <div><dt>ကံကောင်းသောနေ့</dt><dd>{rasi.luckyDay}</dd></div>
          <div><dt>အရောင်</dt><dd>{rasi.luckyColour}</dd></div>
        </dl>
      </header>
      <div className="rasi-columns">
        <section className="surface prose-card" aria-labelledby="strengths-title">
          <div className="section-title"><h2 id="strengths-title">အားသာချက်များ</h2></div>
          <ul className="rasi-list" data-tone="good">{rasi.strengths.map((item) => <li key={item}>{item}</li>)}</ul>
        </section>
        <section className="surface prose-card" aria-labelledby="cautions-title">
          <div className="section-title"><h2 id="cautions-title">သတိထားရန်</h2></div>
          <ul className="rasi-list" data-tone="caution">{rasi.cautions.map((item) => <li key={item}>{item}</li>)}</ul>
        </section>
      </div>
      <section className="surface prose-card" aria-labelledby="today-title">
        <div className="section-title"><h2 id="today-title">ယနေ့ {rasi.nameMy}ရာသီအတွက်</h2><span className="section-note">{today.label} · ရန်ကုန်</span></div>
        <dl className="rasi-today">
          <div><dt>ယနေ့ လ</dt><dd><ZodiacGlyph signIndex={today.moonSignIndex} size="sm" /> {zodiacSignsMyanmar[today.moonSignIndex]}ရာသီ · {rasi.nameMy}မှ အိမ် {toBurmeseDigits(houseFrom(today.moonSignIndex))}</dd></div>
          <div><dt>ကြာသပတေး</dt><dd><ZodiacGlyph signIndex={today.jupiterSignIndex} size="sm" /> {zodiacSignsMyanmar[today.jupiterSignIndex]}ရာသီ · အိမ် {toBurmeseDigits(houseFrom(today.jupiterSignIndex))}</dd></div>
          <div><dt>စနေ</dt><dd><ZodiacGlyph signIndex={today.saturnSignIndex} size="sm" /> {zodiacSignsMyanmar[today.saturnSignIndex]}ရာသီ · အိမ် {toBurmeseDigits(houseFrom(today.saturnSignIndex))}</dd></div>
          <div><dt>တိထိ · နက္ခတ်</dt><dd>{today.panchanga.tithi.name} ({today.panchanga.tithi.paksha === "Shukla" ? "လဆန်း" : "လဆုတ်"}) · {today.panchanga.nakshatra.name}</dd></div>
        </dl>
        <p className="panchanga-note">အိမ်နံပါတ်ကို {rasi.nameMy}ရာသီမှ ရေတွက်ထားပါသည်။ သင့်ကိုယ်ပိုင် မွေးဇာတာနှင့် တိုက်ဆိုင်တွက်ချက်ထားသော ယနေ့ဖတ်စာကို <a className="text-link" href="/daily">နေ့စဉ်ဖတ်စာ <ArrowRight size={14} aria-hidden="true" /></a> တွင် ဖတ်ပါ။ ယနေ့ Panchanga အပြည့်အစုံကို <a className="text-link" href="/today">ယနေ့ Panchanga</a> တွင် ကြည့်နိုင်ပါသည်။</p>
      </section>
      <TarotUpsell variant="inline" />
      <nav className="rasi-others" aria-label="အခြားရာသီများ">
        {others.map((item) => <a key={item.slug} href={`/rasi/${item.slug}`}><span aria-hidden="true">{item.glyph}</span>{item.nameMy}</a>)}
      </nav>
    </AppShell>
  );
}
