import { describe, expect, it } from "vitest";
import { calculateChart } from "@/lib/astrology/calculate-chart";
import { calculateDailyInsight, calculateOverallScore } from "@/lib/astrology/daily-score";
import { vimshottariAt } from "@/lib/astrology/dasha";

const profile = {
  name: "Daily Evidence",
  birthDate: "1990-01-01",
  birthTime: "12:00",
  birthCity: "Yangon",
  latitude: 16.7967,
  longitude: 96.161,
  timezone: "Asia/Yangon",
};

const instant = new Date("2026-08-28T00:00:00.000Z");

describe("daily evidence ruleset", () => {
  it("returns bounded topic scores that reconstruct the headline score", () => {
    const result = calculateDailyInsight(calculateChart(profile, instant), instant);

    expect(result.rulesetVersion).toBe("suriya-daily-2");
    expect(Object.values(result.categories).every((score) => score >= 20 && score <= 95)).toBe(true);
    expect(result.score).toBe(calculateOverallScore(result.categories));
    expect(result.timingStatus).toBe(result.window ? "calculated" : "unavailable");
  });

  it("reaches every guidance band across representative charts and dates", () => {
    const profiles = [
      profile,
      { ...profile, birthDate: "1984-04-15", birthTime: "06:30" },
      { ...profile, birthDate: "2001-11-23", birthTime: "21:15" },
    ];
    const start = Date.parse("2026-01-01T06:00:00.000Z");
    const charts = profiles.map((item) => calculateChart(item, new Date(start)));
    const bands = new Set<string>();

    for (let day = 0; day < 365; day += 3) {
      const date = new Date(start + day * 86_400_000);
      for (const chart of charts) {
        const insight = calculateDailyInsight(chart, date);
        bands.add(insight.band);
      }
    }

    expect([...bands].sort()).toEqual(["bright", "open", "quiet", "steady"]);
  });

  it("makes every scoring influence traceable to a stable rule and category impact", () => {
    const result = calculateDailyInsight(calculateChart(profile, instant), instant);

    expect(result.factors.length).toBeGreaterThanOrEqual(4);
    expect(new Set(result.factors.map((factor) => factor.id)).size).toBe(result.factors.length);
    expect(result.factors.every((factor) => factor.id.includes(".") && factor.description.length > 0)).toBe(true);
    expect(result.factors
      .filter((factor) => factor.source !== "muhurta")
      .every((factor) => Object.keys(factor.impacts).length > 0)).toBe(true);
    expect(result.factors.find((factor) => factor.source === "muhurta")?.impacts).toEqual({});
  });

  it("keeps numerology separate from the Vedic daily score", () => {
    const chart = calculateChart(profile, instant);
    const changedNumerology = {
      ...chart,
      numerology: { ...chart.numerology, lifePath: chart.numerology.lifePath === 9 ? 1 : 9 },
    };

    expect(calculateDailyInsight(changedNumerology, instant))
      .toEqual(calculateDailyInsight(chart, instant));
  });

  it("returns only a future candidate window in the saved profile timezone", () => {
    const result = calculateDailyInsight(calculateChart(profile, instant), instant);

    expect(result.window?.timezone).toBe("Asia/Yangon");
    expect(Date.parse(result.window!.start)).toBeGreaterThanOrEqual(instant.valueOf());
    expect(result.favorableWindow).toBe(result.window?.label);
  });

  it("keeps the headline stable when only the remaining-window status changes", () => {
    const chart = calculateChart(profile, instant);
    const beforeLastHora = calculateDailyInsight(chart, new Date("2026-08-28T10:30:00.000Z"));
    const afterLastHora = calculateDailyInsight(chart, new Date("2026-08-28T11:30:00.000Z"));
    const scoringEvidence = (result: ReturnType<typeof calculateDailyInsight>) => result.factors
      .filter((factor) => factor.source !== "muhurta")
      .map((factor) => ({ id: factor.id, impacts: factor.impacts }));

    expect(beforeLastHora.timingStatus).toBe("calculated");
    expect(afterLastHora.timingStatus).toBe("unavailable");
    expect(scoringEvidence(beforeLastHora)).toEqual(scoringEvidence(afterLastHora));
    expect(afterLastHora.score).toBe(beforeLastHora.score);
  });

  it("evaluates Dasha at the requested daily instant rather than a stale chart as-of date", () => {
    const chart = calculateChart(profile, instant);
    const future = new Date("2100-01-01T00:00:00.000Z");
    const moon = chart.planets.find((planet) => planet.name === "Moon")!;
    const expected = vimshottariAt(moon.longitude, new Date(chart.instant), future);
    const result = calculateDailyInsight(chart, future);

    expect(result.factors.find((factor) => factor.id.startsWith("dasha.mahadasha"))?.label)
      .toBe(`မဟာဒဿာ ${expected.mahadasha.lord}`);
    expect(result.factors.find((factor) => factor.id.startsWith("dasha.antardasha"))?.label)
      .toBe(`အန္တရဒဿာ ${expected.antardasha.lord}`);
  });
});
