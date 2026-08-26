import type { DashaPeriod } from "./types";

export const vimshottariLords = ["Ketu", "Venus", "Sun", "Moon", "Mars", "Rahu", "Jupiter", "Saturn", "Mercury"] as const;
export const vimshottariYears = [7, 20, 6, 10, 7, 18, 16, 19, 17] as const;
const YEAR_MS = 365.2425 * 86_400_000;

function period(lord: string, start: number, years: number): DashaPeriod {
  return { lord, start: new Date(start).toISOString(), end: new Date(start + years * YEAR_MS).toISOString() };
}

export function vimshottariAt(moonLongitude: number, birth: Date, at: Date) {
  const nakshatraSpan = 360 / 27;
  const normalized = ((moonLongitude % 360) + 360) % 360;
  const nakshatraIndex = Math.floor(normalized / nakshatraSpan);
  const fractionElapsed = (normalized % nakshatraSpan) / nakshatraSpan;
  const startingLordIndex = nakshatraIndex % 9;
  const startingYears = vimshottariYears[startingLordIndex];
  let cursor = birth.valueOf() - startingYears * fractionElapsed * YEAR_MS;
  const majorPeriods: DashaPeriod[] = [];
  for (let cycle = 0; cycle < 3; cycle += 1) {
    for (let offset = 0; offset < 9; offset += 1) {
      const index = (startingLordIndex + offset) % 9;
      const item = period(vimshottariLords[index], cursor, vimshottariYears[index]);
      majorPeriods.push(item);
      cursor = Date.parse(item.end);
    }
  }
  const atTime = at.valueOf();
  const mahadasha = majorPeriods.find((item) => Date.parse(item.start) <= atTime && atTime < Date.parse(item.end)) ?? majorPeriods[0];
  const mahaIndex = vimshottariLords.indexOf(mahadasha.lord as (typeof vimshottariLords)[number]);
  const mahaYears = vimshottariYears[mahaIndex];
  let antarCursor = Date.parse(mahadasha.start);
  const antarPeriods: DashaPeriod[] = [];
  for (let offset = 0; offset < 9; offset += 1) {
    const index = (mahaIndex + offset) % 9;
    const item = period(vimshottariLords[index], antarCursor, (mahaYears * vimshottariYears[index]) / 120);
    antarPeriods.push(item);
    antarCursor = Date.parse(item.end);
  }
  const antardasha = antarPeriods.find((item) => Date.parse(item.start) <= atTime && atTime < Date.parse(item.end)) ?? antarPeriods.at(-1)!;
  return { mahadasha, antardasha };
}
