import type { Metadata } from "next";
import { AppShell } from "@/components/suriya/app-shell";
import { JsonLd } from "@/components/suriya/json-ld";
import { MoonPhase } from "@/components/suriya/moon-phase";
import { ZodiacGlyph } from "@/components/suriya/zodiac-glyph";
import { zodiacSignsMyanmar } from "@/lib/astrology/types";
import { toBurmeseDigits } from "@/lib/content/burmese-digits";
import { planetLabel } from "@/lib/content/chart-view";
import { breadcrumbJsonLd, faqJsonLd, webPageJsonLd } from "@/lib/content/seo";
import { localTime, publicToday, todayFaq } from "@/lib/services/public-today";

export const dynamic = "force-dynamic";

const description = "ယနေ့ ရန်ကုန်အတွက် Panchanga — ဝါရ၊ တိထိ၊ နက္ခတ်၊ ယောဂ၊ ကရဏ၊ နေထွက်နေဝင်ချိန်၊ ရာဟုကာလနှင့် Hora ဇယားကို မြန်မာဘာသာဖြင့် နေ့စဉ် တွက်ချက်ပေးသည်။";

export const metadata: Metadata = {
  title: "ယနေ့ Panchanga — ရန်ကုန် ရာဟုကာလ၊ တိထိ၊ နက္ခတ်",
  description,
  alternates: { canonical: "/today" },
  openGraph: { title: "ယနေ့ Panchanga | သုရိယ", description, url: "/today" },
};

export default function TodayPage() {
  const today = publicToday();
  const faq = todayFaq(today);
  const time = (iso: string | null) => (iso ? toBurmeseDigits(localTime(iso)) : "—");
  return (
    <AppShell>
      <JsonLd data={[
        webPageJsonLd({ name: `ယနေ့ Panchanga · ${today.label}`, description, path: "/today", modified: today.modified }),
        faqJsonLd(faq),
        breadcrumbJsonLd([{ name: "ပင်မ", path: "/" }, { name: "ယနေ့ Panchanga", path: "/today" }]),
      ]} />
      <header className="page-heading">
        <p className="eyebrow">ယနေ့ · ရန်ကုန် · Panchanga</p>
        <h1 className="page-title">ယနေ့ Panchanga · {today.weekday}၊ {today.label}</h1>
        <p className="page-lede">{description}</p>
      </header>
      <section className="surface prose-card today-sky" aria-labelledby="sky-title">
        <div className="section-title"><h2 id="sky-title">ယနေ့ ကောင်းကင်</h2></div>
        <div className="today-sky-row">
          <div className="today-sky-item"><MoonPhase tithi={today.panchanga.tithi} size={56} /><span>{today.panchanga.tithi.name}<br /><small>{today.panchanga.tithi.paksha === "Shukla" ? "လဆန်း" : "လဆုတ်"} {toBurmeseDigits(today.panchanga.tithi.number)} ရက်</small></span></div>
          <div className="today-sky-item"><ZodiacGlyph signIndex={today.moonSignIndex} size="md" /><span>လ · {zodiacSignsMyanmar[today.moonSignIndex]}ရာသီ<br /><small>{today.panchanga.nakshatra.name} · ပါဒ {toBurmeseDigits(today.panchanga.nakshatra.pada)}</small></span></div>
          <div className="today-sky-item"><ZodiacGlyph signIndex={today.jupiterSignIndex} size="md" /><span>ကြာသပတေး · {zodiacSignsMyanmar[today.jupiterSignIndex]}ရာသီ</span></div>
          <div className="today-sky-item"><ZodiacGlyph signIndex={today.saturnSignIndex} size="md" /><span>စနေ · {zodiacSignsMyanmar[today.saturnSignIndex]}ရာသီ</span></div>
        </div>
      </section>
      <section className="panchanga-strip" aria-labelledby="panchanga-title">
        <div className="section-title"><h2 id="panchanga-title">Panchanga အင်္ဂါငါးပါး</h2></div>
        <dl>
          <div><dt>ဝါရ (နေ့)</dt><dd>{today.panchanga.vara}</dd></div>
          <div><dt>တိထိ</dt><dd>{today.panchanga.tithi.name} ({today.panchanga.tithi.paksha})</dd></div>
          <div><dt>နက္ခတ်</dt><dd>{today.panchanga.nakshatra.name} · ပါဒ {toBurmeseDigits(today.panchanga.nakshatra.pada)}</dd></div>
          <div><dt>ယောဂ</dt><dd>{today.panchanga.yoga.name}</dd></div>
          <div><dt>ကရဏ</dt><dd>{today.panchanga.karana.name}</dd></div>
        </dl>
      </section>
      <section className="surface prose-card" aria-labelledby="times-title">
        <div className="section-title"><h2 id="times-title">နေထွက်၊ နေဝင်နှင့် ရာဟုကာလ</h2></div>
        <dl className="lucky-window-facts">
          <div><dt>နေထွက်</dt><dd>{time(today.sunrise)}</dd></div>
          <div><dt>နေဝင်</dt><dd>{time(today.sunset)}</dd></div>
          <div><dt>ရာဟုကာလ</dt><dd data-tone="caution">{today.rahuKalam ? `${time(today.rahuKalam.start)}–${time(today.rahuKalam.end)}` : "—"}</dd></div>
        </dl>
        <table className="hora-table">
          <caption>နေ့ခင်း Hora ဇယား (နေထွက်မှ နေဝင်အထိ ၁၂ ပိုင်း)</caption>
          <thead><tr><th scope="col">Hora</th><th scope="col">အချိန်</th><th scope="col">အုပ်စိုးဂြိုဟ်</th></tr></thead>
          <tbody>
            {today.horas.map((hora) => {
              const inRahu = today.rahuKalam && hora.start < today.rahuKalam.end && hora.end > today.rahuKalam.start;
              return <tr key={hora.start} data-rahu={inRahu ? "true" : undefined}><th scope="row">{toBurmeseDigits(today.horas.indexOf(hora) + 1)}</th><td className="numeric">{time(hora.start)}–{time(hora.end)}</td><td>{planetLabel(hora.lord)} ({hora.lord}){inRahu ? " · ရာဟုကာလ" : ""}</td></tr>;
            })}
          </tbody>
        </table>
      </section>
      <section className="surface prose-card" aria-labelledby="faq-title">
        <div className="section-title"><h2 id="faq-title">မေးလေ့ရှိသော မေးခွန်းများ</h2></div>
        <dl className="faq-list">{faq.map((item) => <div key={item.question}><dt>{item.question}</dt><dd>{item.answer}</dd></div>)}</dl>
      </section>
      <div className="daily-actions">
        <a className="primary-button" href="/daily">သင့်ကိုယ်ပိုင် ယနေ့ဖတ်စာ</a>
        <a className="secondary-button" href="/rasi">ရာသီ ၁၂ ခု</a>
      </div>
    </AppShell>
  );
}
