import { Body } from "astronomy-engine";
import { transitSign } from "@/lib/astrology/daily-score";
import { dayHoraTable } from "@/lib/astrology/muhurta";
import { calculatePanchangaAt } from "@/lib/astrology/panchanga";
import { localDateInTimezone, localDateTimeToUtc } from "@/lib/astrology/time";
import type { ChartLocation, Panchanga } from "@/lib/astrology/types";
import { toBurmeseDigits } from "@/lib/content/burmese-digits";
import { demoProfile } from "@/lib/content/demo-profile";
import { burmeseMonths } from "@/lib/readings/period";
import { burmeseWeekdays } from "@/lib/content/booking-copy";

export const yangon: ChartLocation = { label: "ရန်ကုန်", latitude: demoProfile.latitude, longitude: demoProfile.longitude, timezone: demoProfile.timezone };

export type PublicToday = {
  date: string;
  label: string;
  weekday: string;
  panchanga: Panchanga;
  sunrise: string | null;
  sunset: string | null;
  rahuKalam: { start: string; end: string } | null;
  horas: Array<{ start: string; end: string; lord: string }>;
  moonSignIndex: number;
  jupiterSignIndex: number;
  saturnSignIndex: number;
  modified: string;
};

export function localTime(iso: string, timezone = yangon.timezone) {
  return new Intl.DateTimeFormat("en-GB", { hour: "2-digit", minute: "2-digit", hourCycle: "h23", timeZone: timezone }).format(new Date(iso));
}

/** Everything the public /today and /rasi pages need, computed for Yangon at local noon. */
export function publicToday(now = new Date()): PublicToday {
  const date = localDateInTimezone(now, yangon.timezone);
  const noon = localDateTimeToUtc(date, "12:00", yangon.timezone);
  const table = dayHoraTable(yangon, date);
  const [year, month, day] = date.split("-").map(Number);
  return {
    date,
    label: `${toBurmeseDigits(year)} ${burmeseMonths[month - 1]} ${toBurmeseDigits(day)}`,
    weekday: burmeseWeekdays[new Date(`${date}T12:00:00.000Z`).getUTCDay()],
    panchanga: calculatePanchangaAt(noon, yangon, table?.solarDay ?? null),
    sunrise: table?.solarDay.sunrise ?? null,
    sunset: table?.solarDay.sunset ?? null,
    rahuKalam: table ? { start: table.rahuKalam.start, end: table.rahuKalam.end } : null,
    horas: table?.horas.map((hora) => ({ start: hora.start, end: hora.end, lord: hora.lord })) ?? [],
    moonSignIndex: transitSign(Body.Moon, noon),
    jupiterSignIndex: transitSign(Body.Jupiter, noon),
    saturnSignIndex: transitSign(Body.Saturn, noon),
    modified: noon.toISOString(),
  };
}

export function todayFaq(today: PublicToday) {
  const rahu = today.rahuKalam ? `${localTime(today.rahuKalam.start)}–${localTime(today.rahuKalam.end)}` : "တွက်ချက်၍ မရပါ";
  return [
    { question: `ယနေ့ (${today.label}) ရန်ကုန်တွင် ရာဟုကာလ ဘယ်အချိန်လဲ။`, answer: `ယနေ့ ရာဟုကာလမှာ ${toBurmeseDigits(rahu)} ဖြစ်သည်။ အရေးကြီးသော စတင်မှုများကို ဤအချိန်အတွင်း ရှောင်ရန် အကြံပြုပါသည်။` },
    { question: "ယနေ့ တိထိ (Tithi) ဘာလဲ။", answer: `ယနေ့ တိထိမှာ ${today.panchanga.tithi.name} (${today.panchanga.tithi.paksha === "Shukla" ? "လဆန်း" : "လဆုတ်"} ${toBurmeseDigits(today.panchanga.tithi.number)} ရက်) ဖြစ်သည်။` },
    { question: "ယနေ့ နက္ခတ် (Nakshatra) ဘာလဲ။", answer: `ယနေ့ လသည် ${today.panchanga.nakshatra.name} နက္ခတ် ပါဒ ${toBurmeseDigits(today.panchanga.nakshatra.pada)} တွင် ရှိနေသည်။` },
  ];
}
