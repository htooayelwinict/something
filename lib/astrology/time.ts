import type { BirthProfileInput } from "@/lib/schemas/profile";

type DateParts = { year: number; month: number; day: number; hour: number; minute: number };

function localParts(date: Date, timezone: string): DateParts {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: timezone,
    year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);
  const get = (type: Intl.DateTimeFormatPartTypes) => Number(parts.find((part) => part.type === type)?.value);
  return { year: get("year"), month: get("month"), day: get("day"), hour: get("hour"), minute: get("minute") };
}

function sameParts(a: DateParts, b: DateParts) {
  return a.year === b.year && a.month === b.month && a.day === b.day && a.hour === b.hour && a.minute === b.minute;
}

function offsetAt(date: Date, timezone: string): number {
  const parts = localParts(date, timezone);
  return Date.UTC(parts.year, parts.month - 1, parts.day, parts.hour, parts.minute) - Math.floor(date.valueOf() / 60_000) * 60_000;
}

export function localDateTimeToUtc(localDate: string, localTime: string, timezone: string): Date {
  const [year, month, day] = localDate.split("-").map(Number);
  const [hour, minute] = localTime.split(":").map(Number);
  const desired = { year, month, day, hour, minute };
  const naive = Date.UTC(year, month - 1, day, hour, minute);
  const offsets = new Set<number>();
  for (const delta of [-86_400_000, 0, 86_400_000]) offsets.add(offsetAt(new Date(naive + delta), timezone));
  const candidates = [...offsets]
    .map((offset) => new Date(naive - offset))
    .filter((candidate) => sameParts(localParts(candidate, timezone), desired));
  if (candidates.length === 0) throw new Error("The local time does not exist in the selected timezone");
  if (candidates.length > 1) throw new Error("The local time is repeated in the selected timezone");
  return candidates[0];
}

export function localBirthToUtc(input: Pick<BirthProfileInput, "birthDate" | "birthTime" | "timezone">): Date {
  return localDateTimeToUtc(input.birthDate, input.birthTime, input.timezone);
}

export function localDateInTimezone(instant: Date, timezone: string): string {
  const parts = localParts(instant, timezone);
  return `${String(parts.year).padStart(4, "0")}-${String(parts.month).padStart(2, "0")}-${String(parts.day).padStart(2, "0")}`;
}
