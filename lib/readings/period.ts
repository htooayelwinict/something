import { localDateInTimezone, localDateTimeToUtc } from "@/lib/astrology/time";
import { toBurmeseDigits } from "@/lib/content/burmese-digits";

export type PeriodKind = "daily" | "weekly" | "monthly";
export const periodKinds: readonly PeriodKind[] = ["daily", "weekly", "monthly"];
export const PERIOD_TIMEZONE = "Asia/Yangon";

export type Period = {
  kind: PeriodKind;
  key: string;
  /** UTC instant of local midnight starting the first day. */
  start: string;
  /** UTC instant of local midnight after the last day (exclusive). */
  end: string;
  /** Local ISO dates covered by the period. */
  days: string[];
  label: string;
  timezone: string;
};

export const burmeseMonths = ["ဇန်နဝါရီ", "ဖေဖော်ဝါရီ", "မတ်", "ဧပြီ", "မေ", "ဇွန်", "ဇူလိုင်", "ဩဂုတ်", "စက်တင်ဘာ", "အောက်တိုဘာ", "နိုဝင်ဘာ", "ဒီဇင်ဘာ"];

export function isPeriodKind(value: string): value is PeriodKind {
  return (periodKinds as readonly string[]).includes(value);
}

function utcDate(localDate: string): Date {
  return new Date(`${localDate}T00:00:00.000Z`);
}

function isoDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function addDays(localDate: string, days: number): string {
  const date = utcDate(localDate);
  date.setUTCDate(date.getUTCDate() + days);
  return isoDate(date);
}

function isoWeek(localDate: string): { year: number; week: number; monday: string } {
  const date = utcDate(localDate);
  const monday = new Date(date);
  monday.setUTCDate(date.getUTCDate() - ((date.getUTCDay() + 6) % 7));
  const thursday = new Date(monday);
  thursday.setUTCDate(monday.getUTCDate() + 3);
  const year = thursday.getUTCFullYear();
  const firstThursday = new Date(Date.UTC(year, 0, 4));
  firstThursday.setUTCDate(firstThursday.getUTCDate() - ((firstThursday.getUTCDay() + 6) % 7) + 3);
  const week = 1 + Math.round((thursday.valueOf() - firstThursday.valueOf()) / (7 * 86_400_000));
  return { year, week, monday: isoDate(monday) };
}

function parts(localDate: string) {
  const [year, month, day] = localDate.split("-").map(Number);
  return { year, month, day };
}

function rangeLabel(first: string, last: string): string {
  const a = parts(first);
  const b = parts(last);
  const year = toBurmeseDigits(b.year);
  if (a.month === b.month) return `${burmeseMonths[a.month - 1]} ${toBurmeseDigits(a.day)} – ${toBurmeseDigits(b.day)} · ${year}`;
  return `${burmeseMonths[a.month - 1]} ${toBurmeseDigits(a.day)} – ${burmeseMonths[b.month - 1]} ${toBurmeseDigits(b.day)} · ${year}`;
}

export function localNoonUtc(localDate: string, timezone: string): Date {
  return localDateTimeToUtc(localDate, "12:00", timezone);
}

export function periodFor(kind: PeriodKind, now: Date, timezone = PERIOD_TIMEZONE): Period {
  const today = localDateInTimezone(now, timezone);
  let days: string[];
  let key: string;
  let label: string;
  if (kind === "daily") {
    days = [today];
    key = today;
    const { year, month, day } = parts(today);
    label = `${burmeseMonths[month - 1]} ${toBurmeseDigits(day)} · ${toBurmeseDigits(year)}`;
  } else if (kind === "weekly") {
    const week = isoWeek(today);
    days = Array.from({ length: 7 }, (_, index) => addDays(week.monday, index));
    key = `${week.year}-W${String(week.week).padStart(2, "0")}`;
    label = rangeLabel(days[0], days[6]);
  } else {
    const { year, month } = parts(today);
    const length = new Date(Date.UTC(year, month, 0)).getUTCDate();
    const first = `${year}-${String(month).padStart(2, "0")}-01`;
    days = Array.from({ length }, (_, index) => addDays(first, index));
    key = `${year}-${String(month).padStart(2, "0")}`;
    label = `${burmeseMonths[month - 1]} ${toBurmeseDigits(year)}`;
  }
  return {
    kind,
    key,
    days,
    label,
    timezone,
    start: localDateTimeToUtc(days[0], "00:00", timezone).toISOString(),
    end: localDateTimeToUtc(addDays(days[days.length - 1], 1), "00:00", timezone).toISOString(),
  };
}
