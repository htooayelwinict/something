import { describe, expect, it } from "vitest";
import { calculateChart } from "@/lib/astrology/calculate-chart";
import { buildPeriodEvidence } from "@/lib/readings/period-evidence";
import { periodFor } from "@/lib/readings/period";
import { demoProfile } from "@/lib/content/demo-profile";

const asOf = new Date("2026-08-30T10:00:00Z");
const chart = calculateChart(demoProfile, asOf);

describe("buildPeriodEvidence", () => {
  it("evaluates every day of the week and ranks them", () => {
    const e = buildPeriodEvidence(chart, periodFor("weekly", asOf));
    expect(e.days).toHaveLength(7);
    expect(e.summary.bestDays).toHaveLength(3);
    expect(e.summary.cautionDays).toHaveLength(2);
    const scores = new Map(e.days.map((d) => [d.date, d.score]));
    expect(scores.get(e.summary.bestDays[0])).toBe(Math.max(...scores.values()));
    expect(e.transits.moonPath).toHaveLength(7);
    expect(e.natal.moonSignMy.length).toBeGreaterThan(0);
    expect(e.transits.jupiterSign.length).toBeGreaterThan(0);
    expect(e.days[0].weekday).toBe("တနင်္လာ");
    expect(e.dasha.mahadasha.lord.length).toBeGreaterThan(0);
  });
  it("includes daily factors verbatim for daily", () => {
    const e = buildPeriodEvidence(chart, periodFor("daily", asOf));
    expect(e.days).toHaveLength(1);
    expect(e.factors?.length).toBeGreaterThan(3);
    expect(e.summary.bestDays).toEqual(["2026-08-30"]);
  });
  it("builds a month in under 3 seconds", () => {
    const started = performance.now();
    const e = buildPeriodEvidence(chart, periodFor("monthly", asOf));
    expect(e.days).toHaveLength(31);
    expect(performance.now() - started).toBeLessThan(3000);
  });
});
