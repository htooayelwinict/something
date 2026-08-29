import { calculatePanchangaAt } from "./panchanga";
import { calculateSolarDay, type SolarDay } from "./solar-day";
import type {
  ChartLocation,
  MuhurtaEventType,
  MuhurtaReason,
  MuhurtaWindow,
  Panchanga,
  TimeInterval,
} from "./types";

export { calculateSolarDay } from "./solar-day";

export const MUHURTA_RULESET_VERSION = "suriya-muhurta-2" as const;

const horaSequence = ["Saturn", "Jupiter", "Mars", "Sun", "Venus", "Mercury", "Moon"] as const;
type HoraLord = (typeof horaSequence)[number];

const dayLordByWeekday: Record<string, HoraLord> = {
  Sun: "Sun",
  Mon: "Moon",
  Tue: "Mars",
  Wed: "Mercury",
  Thu: "Jupiter",
  Fri: "Venus",
  Sat: "Saturn",
};

// One-based daylight segment used by the traditional Rahu Kalam table.
const rahuSegmentByWeekday: Record<string, number> = {
  Sun: 8,
  Mon: 2,
  Tue: 7,
  Wed: 5,
  Thu: 6,
  Fri: 4,
  Sat: 3,
};

const preferredHora: Record<MuhurtaEventType, readonly HoraLord[]> = {
  general: ["Jupiter", "Venus", "Mercury", "Moon"],
  work: ["Mercury", "Jupiter", "Sun"],
  relationship: ["Venus", "Moon", "Jupiter"],
  travel: ["Mercury", "Moon", "Jupiter"],
};

const supportiveYogas = new Set(["Ayushman", "Saubhagya", "Shobhana", "Sukarma", "Dhriti", "Harshana", "Siddhi", "Shiva", "Siddha", "Sadhya", "Shubha", "Brahma", "Indra"]);
const pressurizedYogas = new Set(["Atiganda", "Shula", "Ganda", "Vyaghata", "Vajra", "Vyatipata", "Parigha", "Vaidhriti"]);
const supportiveTithis = new Set(["Dwitiya", "Tritiya", "Panchami", "Saptami", "Dashami", "Ekadashi", "Trayodashi"]);
const pressurizedTithis = new Set(["Chaturthi", "Navami", "Chaturdashi", "Amavasya"]);

function weekdayAt(instant: Date, timezone: string): string {
  return new Intl.DateTimeFormat("en-US", { timeZone: timezone, weekday: "short" }).format(instant);
}

function interval(start: number, end: number): TimeInterval {
  return { start: new Date(start).toISOString(), end: new Date(end).toISOString() };
}

function overlaps(a: TimeInterval, b: TimeInterval): boolean {
  return Date.parse(a.start) < Date.parse(b.end) && Date.parse(a.end) > Date.parse(b.start);
}

function localTimeLabel(start: Date, end: Date, timezone: string): string {
  const formatter = new Intl.DateTimeFormat("en-GB", {
    timeZone: timezone,
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  });
  return `${formatter.format(start)}–${formatter.format(end)}`;
}

function panchangaReasons(panchanga: Panchanga): MuhurtaReason[] {
  const reasons: MuhurtaReason[] = [];
  if (supportiveTithis.has(panchanga.tithi.name)) reasons.push({ id: "panchanga.tithi.supportive", label: `${panchanga.tithi.name} တိထိက စတင်မှုကို အားပေးသည်`, delta: 5 });
  if (pressurizedTithis.has(panchanga.tithi.name)) reasons.push({ id: "panchanga.tithi.pressure", label: `${panchanga.tithi.name} တိထိကြောင့် အပိုသတိထားရန်လိုသည်`, delta: -6 });
  if (supportiveYogas.has(panchanga.yoga.name)) reasons.push({ id: "panchanga.yoga.supportive", label: `${panchanga.yoga.name} ယောဂက စီးဆင်းမှုကို အားပေးသည်`, delta: 5 });
  if (pressurizedYogas.has(panchanga.yoga.name)) reasons.push({ id: "panchanga.yoga.pressure", label: `${panchanga.yoga.name} ယောဂကြောင့် အလျင်စလို မလုပ်သင့်ပါ`, delta: -5 });
  if (panchanga.karana.name === "Vishti") reasons.push({ id: "panchanga.karana.vishti", label: "Vishti Karana ဖြစ်သောကြောင့် အရေးကြီးစတင်မှုကို ရှောင်ရန်", delta: -10 });
  else reasons.push({ id: "panchanga.karana.clear", label: `${panchanga.karana.name} Karana တွင် Vishti ကန့်သတ်ချက်မရှိပါ`, delta: 2 });
  return reasons;
}

function rahuKalam(solarDay: SolarDay): TimeInterval {
  const rise = Date.parse(solarDay.sunrise);
  const set = Date.parse(solarDay.sunset);
  const segmentLength = (set - rise) / 8;
  const weekday = weekdayAt(new Date(rise), solarDay.timezone);
  const segment = rahuSegmentByWeekday[weekday] ?? 1;
  const start = rise + (segment - 1) * segmentLength;
  return interval(start, start + segmentLength);
}

function horaLordFor(dayLord: HoraLord, daylightHour: number): HoraLord {
  const start = horaSequence.indexOf(dayLord);
  return horaSequence[(start + daylightHour) % horaSequence.length];
}

function scoreHora(lord: HoraLord, eventType: MuhurtaEventType): MuhurtaReason {
  if (preferredHora[eventType].includes(lord)) {
    return { id: `hora.${eventType}.${lord.toLowerCase()}`, label: `${lord} Hora က ရွေးထားသည့်လုပ်ငန်းအမျိုးအစားနှင့် ကိုက်ညီသည်`, delta: 12 };
  }
  if (lord === "Mars" || lord === "Saturn") {
    return { id: `hora.${eventType}.caution.${lord.toLowerCase()}`, label: `${lord} Hora တွင် အရှိန်နှင့် ဖိအားကို ထိန်းရန်လိုသည်`, delta: -7 };
  }
  return { id: `hora.${eventType}.neutral.${lord.toLowerCase()}`, label: `${lord} Hora ကို မျှတသောရွေးချယ်မှုအဖြစ် သတ်မှတ်သည်`, delta: 2 };
}

export function findMuhurtaWindow(
  location: ChartLocation,
  targetDate: string,
  eventType: MuhurtaEventType,
  notBefore?: Date,
): MuhurtaWindow | null {
  const solarDay = calculateSolarDay(location, targetDate);
  if (!solarDay) return null;

  const rise = Date.parse(solarDay.sunrise);
  const set = Date.parse(solarDay.sunset);
  const horaLength = (set - rise) / 12;
  const rahu = rahuKalam(solarDay);
  const weekday = weekdayAt(new Date(rise), location.timezone);
  const dayLord = dayLordByWeekday[weekday];
  if (!dayLord) return null;

  const candidates: MuhurtaWindow[] = [];
  for (let index = 0; index < 12; index += 1) {
    const startMs = rise + index * horaLength;
    const endMs = rise + (index + 1) * horaLength;
    const candidateInterval = interval(startMs, endMs);
    if (overlaps(candidateInterval, rahu)) continue;
    if (notBefore && startMs < notBefore.valueOf()) continue;

    const lord = horaLordFor(dayLord, index);
    const midpoint = new Date((startMs + endMs) / 2);
    const panchanga = calculatePanchangaAt(midpoint, location, solarDay);
    const reasons = [scoreHora(lord, eventType), ...panchangaReasons(panchanga)];
    const score = Math.max(20, Math.min(95, 50 + reasons.reduce((sum, reason) => sum + reason.delta, 0)));
    candidates.push({
      ...candidateInterval,
      label: localTimeLabel(new Date(startMs), new Date(endMs), location.timezone),
      timezone: location.timezone,
      eventType,
      horaLord: lord,
      score,
      reasons,
      sunrise: solarDay.sunrise,
      sunset: solarDay.sunset,
      rahuKalam: rahu,
      panchanga,
      rulesetVersion: MUHURTA_RULESET_VERSION,
    });
  }

  return candidates.sort((a, b) => b.score - a.score || Date.parse(a.start) - Date.parse(b.start))[0] ?? null;
}

export type DayHora = TimeInterval & { lord: HoraLord; index: number };

/** Daytime Hora table (12 equal divisions of sunrise→sunset) plus Rahu Kalam for a local date. */
export function dayHoraTable(location: ChartLocation, targetDate: string): { solarDay: SolarDay; rahuKalam: TimeInterval; horas: DayHora[] } | null {
  const solarDay = calculateSolarDay(location, targetDate);
  if (!solarDay) return null;
  const rise = Date.parse(solarDay.sunrise);
  const set = Date.parse(solarDay.sunset);
  const horaLength = (set - rise) / 12;
  const weekday = weekdayAt(new Date(rise), location.timezone);
  const dayLord = dayLordByWeekday[weekday];
  if (!dayLord) return null;
  const horas = Array.from({ length: 12 }, (_, index) => ({
    ...interval(rise + index * horaLength, rise + (index + 1) * horaLength),
    lord: horaLordFor(dayLord, index),
    index,
  }));
  return { solarDay, rahuKalam: rahuKalam(solarDay), horas };
}
