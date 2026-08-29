import { localDateInTimezone, localDateTimeToUtc } from "@/lib/astrology/time";

export const QUOTA_LIMIT = 3;
export const QUOTA_TIMEZONE = "Asia/Yangon";

export type QuotaReading = { createdAt: string; status: string };
export type DailyQuota = { used: number; remaining: number; limit: number; resetsAt: string };

/** SQLite's CURRENT_TIMESTAMP is UTC without a zone marker; treat it as such. */
export function parseStoredTimestamp(value: string): Date {
  const sqlite = /^(\d{4}-\d{2}-\d{2}) (\d{2}:\d{2}:\d{2})$/.exec(value);
  return new Date(sqlite ? `${sqlite[1]}T${sqlite[2]}.000Z` : value);
}

function nextLocalMidnight(now: Date, timezone: string): Date {
  const tomorrow = new Date(`${localDateInTimezone(now, timezone)}T12:00:00.000Z`);
  tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);
  return localDateTimeToUtc(tomorrow.toISOString().slice(0, 10), "00:00", timezone);
}

export function dailyQuota(readings: QuotaReading[], now: Date, timezone = QUOTA_TIMEZONE, limit = QUOTA_LIMIT): DailyQuota {
  const today = localDateInTimezone(now, timezone);
  const used = readings.filter((reading) => {
    if (reading.status === "failed") return false;
    const created = parseStoredTimestamp(reading.createdAt);
    return !Number.isNaN(created.valueOf()) && localDateInTimezone(created, timezone) === today;
  }).length;
  return { used, remaining: Math.max(0, limit - used), limit, resetsAt: nextLocalMidnight(now, timezone).toISOString() };
}
