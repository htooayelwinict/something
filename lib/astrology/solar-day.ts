import { Body, Observer, SearchRiseSet } from "astronomy-engine";
import { localDateInTimezone, localDateTimeToUtc } from "./time";
import type { ChartLocation } from "./types";

export type SolarDay = {
  targetDate: string;
  timezone: string;
  sunrise: string;
  sunset: string;
};

export function calculateSolarDay(location: ChartLocation, targetDate: string): SolarDay | null {
  let localNoon: Date;
  try {
    localNoon = localDateTimeToUtc(targetDate, "12:00", location.timezone);
  } catch {
    return null;
  }

  const searchStart = new Date(localNoon.valueOf() - 18 * 60 * 60 * 1000);
  const observer = new Observer(location.latitude, location.longitude, 0);
  const sunrise = SearchRiseSet(Body.Sun, observer, 1, searchStart, 2);
  if (!sunrise || localDateInTimezone(sunrise.date, location.timezone) !== targetDate) return null;

  const sunset = SearchRiseSet(Body.Sun, observer, -1, sunrise.date, 1.1);
  if (!sunset
    || localDateInTimezone(sunset.date, location.timezone) !== targetDate
    || sunset.date <= sunrise.date) return null;

  return {
    targetDate,
    timezone: location.timezone,
    sunrise: sunrise.date.toISOString(),
    sunset: sunset.date.toISOString(),
  };
}
