import { describe, expect, it } from "vitest";
import { calculateChart } from "@/lib/astrology/calculate-chart";
import { calculateDailyInsight } from "@/lib/astrology/daily-score";
import { localBirthToUtc } from "@/lib/astrology/time";

const yangon = {
  name: "Playwright Test", birthDate: "1990-01-01", birthTime: "12:00", birthCity: "Yangon",
  latitude: 16.7967, longitude: 96.161, timezone: "Asia/Yangon",
};

describe("canonical chart", () => {
  it("normalizes Yangon local time and matches the independent ascendant fixture", () => {
    expect(localBirthToUtc(yangon).toISOString()).toBe("1990-01-01T05:30:00.000Z");
    const chart = calculateChart(yangon, new Date("2026-08-26T00:00:00Z"));
    expect(chart.ascendant.sign).toBe("Pisces");
    expect(chart.ascendant.longitude).toBeCloseTo(347.878, 1);
    expect(chart.planets).toHaveLength(10);
    expect(chart.houses).toHaveLength(12);
    expect(Date.parse(chart.dasha.mahadasha.start)).toBeLessThanOrEqual(Date.parse(chart.asOf));
    expect(Date.parse(chart.dasha.mahadasha.end)).toBeGreaterThan(Date.parse(chart.asOf));
  });

  it("rejects nonexistent and repeated local times", () => {
    expect(() => localBirthToUtc({ birthDate: "2024-03-10", birthTime: "02:30", timezone: "America/New_York" })).toThrow("does not exist");
    expect(() => localBirthToUtc({ birthDate: "2024-11-03", birthTime: "01:30", timezone: "America/New_York" })).toThrow("repeated");
  });

  it("produces deterministic bounded daily guidance", () => {
    const chart = calculateChart(yangon, new Date("2026-08-26T00:00:00Z"));
    const date = new Date("2026-08-26T06:00:00Z");
    expect(calculateDailyInsight(chart, date)).toEqual(calculateDailyInsight(chart, date));
    expect(calculateDailyInsight(chart, date).score).toBeGreaterThanOrEqual(20);
    expect(calculateDailyInsight(chart, date).score).toBeLessThanOrEqual(95);
  });
});
