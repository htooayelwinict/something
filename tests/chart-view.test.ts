import { describe, expect, it } from "vitest";
import { calculateChart } from "@/lib/astrology/calculate-chart";
import { calculateDailyInsight } from "@/lib/astrology/daily-score";
import {
  buildChartCells,
  chartBirthLabel,
  chartKeyFacts,
  dashaTimeline,
  formatDegree,
  groupDailyFactors,
  planetLabel,
  todayHighlights,
} from "@/lib/content/chart-view";

const profile = {
  name: "Chart View",
  birthDate: "1990-01-01",
  birthTime: "12:00",
  birthCity: "ရန်ကုန်",
  latitude: 16.7967,
  longitude: 96.161,
  timezone: "Asia/Yangon",
};
const now = new Date("2026-08-28T00:00:00.000Z");
const chart = calculateChart(profile, now);

describe("chart view model", () => {
  it("builds twelve Burmese-labelled cells with houses counted from the Lagna", () => {
    const cells = buildChartCells(chart, "d1");

    expect(cells).toHaveLength(12);
    expect(cells.every((cell) => /[က-႟]/.test(cell.signMy))).toBe(true);
    expect(cells.map((cell) => cell.house).sort((a, b) => a - b)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]);
    const lagna = cells.find((cell) => cell.isLagna)!;
    expect(lagna.house).toBe(1);
    expect(lagna.signIndex).toBe(chart.ascendant.signIndex);
    expect(cells.find((cell) => cell.signIndex === (chart.ascendant.signIndex + 1) % 12)?.house).toBe(2);
  });

  it("places the nine Jyotish grahas once while keeping display-only outer planets out of the chart", () => {
    const placements = buildChartCells(chart, "d1").flatMap((cell) => cell.placements);

    expect(placements.map((item) => item.name).sort()).toEqual([
      "Jupiter", "Ketu", "Mars", "Mercury", "Moon", "Rahu", "Saturn", "Sun", "Venus",
    ]);
    const moon = placements.find((item) => item.name === "Moon")!;
    expect(moon.abbreviation).toBe("Mo");
    expect(moon.degree).toMatch(/^\d{1,2}°$/);
    expect(typeof moon.retrograde).toBe("boolean");
    expect(placements.some((item) => item.category === "outer")).toBe(false);
  });

  it("uses the divisional ascendant for D9 house numbering", () => {
    const cells = buildChartCells(chart, "d9");
    const lagna = cells.find((cell) => cell.isLagna)!;

    expect(lagna.signIndex).toBe(chart.divisional.d9.Ascendant);
    expect(cells.find((cell) => cell.signIndex === chart.divisional.d9.Moon)?.placements.some((item) => item.name === "Moon")).toBe(true);
    expect(cells.flatMap((cell) => cell.placements).every((item) => item.degree === null)).toBe(true);
  });

  it("summarises key facts and the birth label from stored data only", () => {
    const facts = chartKeyFacts(chart);

    expect(facts.lagna.sign).toBe(chart.ascendant.sign);
    expect(facts.lagna.signMy).toMatch(/[က-႟]/);
    expect(facts.moon?.nakshatra).toBe(chart.panchanga.nakshatra.name);
    expect(facts.dasha?.mahadasha).toBe(planetLabel(chart.dasha.mahadasha.lord));
    expect(chartBirthLabel(chart)).toContain("1990-01-01");
    expect(chartBirthLabel(chart)).toContain("ရန်ကုန်");
  });

  it("derives a bounded dasha timeline from stored period dates", () => {
    const timeline = dashaTimeline(chart.dasha, now);

    expect(timeline.progress).toBeGreaterThanOrEqual(0);
    expect(timeline.progress).toBeLessThanOrEqual(1);
    expect(timeline.antarStart).toBeGreaterThanOrEqual(0);
    expect(timeline.antarEnd).toBeLessThanOrEqual(1);
    expect(timeline.antarStart).toBeLessThan(timeline.antarEnd);
    expect(timeline.mahadashaLabel).toContain(planetLabel(chart.dasha.mahadasha.lord));
  });

  it("groups daily factors by source and maps transit houses onto chart signs", () => {
    const insight = calculateDailyInsight(chart, now);
    const groups = groupDailyFactors(insight.factors);

    expect(groups.map((group) => group.source)).toEqual(["transit", "dasha", "panchanga", "muhurta"]);
    expect(groups.every((group) => /[က-႟]/.test(group.label) && group.factors.length > 0)).toBe(true);

    const highlights = todayHighlights(chart, insight.factors);
    const natalMoon = chart.planets.find((planet) => planet.name === "Moon")!;
    const moonFactor = insight.factors.find((factor) => factor.id.startsWith("transit.moon"))!;
    expect(highlights.find((item) => item.planet === "Moon")?.signIndex)
      .toBe((natalMoon.signIndex + moonFactor.house! - 1) % 12);
    expect(highlights).toHaveLength(3);
    expect(highlights.map((item) => item.label)).toEqual(["လ", "ဂုရု", "စနေ"]);
    expect(highlights.map((item) => item.ariaLabel)).toEqual([
      "ယနေ့ လ", "ယနေ့ ကြာသပတေး", "ယနေ့ စနေ",
    ]);
  });

  it("formats degrees and planet labels", () => {
    expect(formatDegree(12.5)).toBe("12°30′");
    expect(formatDegree(29.999)).toBe("29°59′");
    expect(planetLabel("Saturn")).toBe("စနေ");
    expect(planetLabel("Rahu")).toBe("ရာဟု");
  });
});

describe("legacy snapshot compatibility", () => {
  it("renders v1 charts that lack v2 metadata and planet categories", () => {
    const legacy = structuredClone(chart) as Record<string, unknown>;
    legacy.version = "suriya-vedic-1";
    delete legacy.role;
    delete legacy.metadata;
    delete legacy.location;
    (legacy.planets as Array<Record<string, unknown>>).forEach((planet) => { delete planet.category; });
    const legacyChart = legacy as unknown as typeof chart;

    expect(buildChartCells(legacyChart, "d1").flatMap((cell) => cell.placements)).toHaveLength(chart.planets.length);
    expect(chartKeyFacts(legacyChart).lagna.sign).toBe(chart.ascendant.sign);
    expect(chartBirthLabel(legacyChart)).toContain("1990-01-01");
  });
});
