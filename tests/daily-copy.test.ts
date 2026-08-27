import { describe, expect, it } from "vitest";
import { calculateChart } from "@/lib/astrology/calculate-chart";
import { calculateDailyInsight } from "@/lib/astrology/daily-score";
import { buildDailyPresentation, dailyCopy } from "@/lib/content/daily-copy";

const profile = {
  name: "Source Test",
  birthDate: "1990-01-01",
  birthTime: "12:00",
  birthCity: "Yangon",
  latitude: 16.7967,
  longitude: 96.161,
  timezone: "Asia/Yangon",
};

describe("daily Burmese copy", () => {
  it("maps every bounded score band to distinct Burmese guidance", () => {
    const bands = ["quiet", "steady", "open", "bright"] as const;
    const titles = bands.map((band) => dailyCopy(band).title);
    expect(new Set(titles).size).toBe(4);
    expect(titles.every((title) => /[က-အ]/.test(title))).toBe(true);
  });

  it("describes only calculated sources", () => {
    const now = new Date("2026-08-26T06:00:00Z");
    const chart = calculateChart(profile, now);
    const presentation = buildDailyPresentation(chart, calculateDailyInsight(chart, now));

    expect(presentation.sources.map((source) => source.id)).toEqual(["jyotish"]);
    expect(presentation.sources.map((source) => source.label)).toEqual(["Jyotish · Lahiri"]);
    expect(presentation.calculationMethodCount).toBe(1);
    expect(presentation.sources.every((source) => source.status === "calculated")).toBe(true);
  });

  it("presents the structured factors, categories, and timing metadata", () => {
    const now = new Date("2026-08-28T00:00:00Z");
    const chart = calculateChart(profile, now);
    const insight = calculateDailyInsight(chart, now);
    const presentation = buildDailyPresentation(chart, insight);

    expect(presentation.categories).toEqual(insight.categories);
    expect(presentation.factors).toEqual(insight.factors.map(({ id, source, label, description, house }) => ({ id, source, label, description, house })));
    expect(presentation.panchanga.tithi).toContain(insight.panchanga.tithi.name);
    expect(presentation.timing?.sunrise).toMatch(/^\d{2}:\d{2}$/);
    expect(presentation.timing?.rahuKalam).toMatch(/^\d{2}:\d{2}–\d{2}:\d{2}$/);
    expect(presentation.focus).toBe(insight.factors[0].description);
    expect(presentation.timingStatus).toBe("တွက်ချက်ပြီး");
    expect(presentation.horaLord).toBe(insight.window?.horaLord);
  });
});
