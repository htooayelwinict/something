import { describe, expect, it } from "vitest";
import { localDateTimeToUtc } from "@/lib/astrology/time";
import { calculateSolarDay, findMuhurtaWindow } from "@/lib/astrology/muhurta";

const yangon = {
  label: "Yangon",
  latitude: 16.7967,
  longitude: 96.161,
  timezone: "Asia/Yangon",
};

const santiago = {
  label: "Santiago",
  latitude: -33.4489,
  longitude: -70.6693,
  timezone: "America/Santiago",
};

function overlaps(aStart: string, aEnd: string, bStart: string, bEnd: string) {
  return Date.parse(aStart) < Date.parse(bEnd) && Date.parse(aEnd) > Date.parse(bStart);
}

describe("local Muhurta calculation", () => {
  it("converts an explicit local date and time without treating it as UTC", () => {
    expect(localDateTimeToUtc("2026-08-28", "12:00", "Asia/Yangon").toISOString())
      .toBe("2026-08-28T05:30:00.000Z");
  });

  it("calculates sunrise and sunset for the requested local day", () => {
    const solarDay = calculateSolarDay(yangon, "2026-08-28");

    expect(solarDay).not.toBeNull();
    expect(Date.parse(solarDay!.sunrise)).toBeLessThan(Date.parse(solarDay!.sunset));
    const sunriseHour = Number(new Intl.DateTimeFormat("en-GB", {
      timeZone: yangon.timezone,
      hour: "2-digit",
      hourCycle: "h23",
    }).format(new Date(solarDay!.sunrise)));
    const sunsetHour = Number(new Intl.DateTimeFormat("en-GB", {
      timeZone: yangon.timezone,
      hour: "2-digit",
      hourCycle: "h23",
    }).format(new Date(solarDay!.sunset)));
    expect(sunriseHour).toBeGreaterThanOrEqual(5);
    expect(sunriseHour).toBeLessThanOrEqual(7);
    expect(sunsetHour).toBeGreaterThanOrEqual(17);
    expect(sunsetHour).toBeLessThanOrEqual(19);
  });

  it.each(["2026-09-05", "2026-09-06"])(
    "calculates the solar day when the adjacent local midnight is skipped on %s",
    (targetDate) => {
      const solarDay = calculateSolarDay(santiago, targetDate);

      expect(solarDay).not.toBeNull();
      expect(new Intl.DateTimeFormat("en-CA", {
        timeZone: santiago.timezone,
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      }).format(new Date(solarDay!.sunrise))).toBe(targetDate);
    },
  );

  it("selects a deterministic daylight hora that does not overlap Rahu Kalam", () => {
    const result = findMuhurtaWindow(yangon, "2026-08-28", "work");
    const repeated = findMuhurtaWindow(yangon, "2026-08-28", "work");

    expect(result).toEqual(repeated);
    expect(result).not.toBeNull();
    expect(result).toMatchObject({
      timezone: "Asia/Yangon",
      rulesetVersion: "suriya-muhurta-2",
      eventType: "work",
    });
    expect(Date.parse(result!.start)).toBeLessThan(Date.parse(result!.end));
    expect(overlaps(result!.start, result!.end, result!.rahuKalam.start, result!.rahuKalam.end)).toBe(false);
    expect(result!.horaLord).toMatch(/^(Sun|Moon|Mars|Mercury|Jupiter|Venus|Saturn)$/);
    expect(result!.reasons.length).toBeGreaterThan(0);
    expect(result!.label).toMatch(/^\d{2}:\d{2}–\d{2}:\d{2}$/);
  });

  it("does not invent a remaining window after the local solar day has ended", () => {
    const afterSunset = new Date("2026-08-28T13:30:00.000Z");
    expect(findMuhurtaWindow(yangon, "2026-08-28", "general", afterSunset)).toBeNull();
  });
});
