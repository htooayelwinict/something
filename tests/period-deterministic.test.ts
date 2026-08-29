import { describe, expect, it } from "vitest";
import { calculateChart } from "@/lib/astrology/calculate-chart";
import { toBurmeseDigits } from "@/lib/content/burmese-digits";
import { demoProfile } from "@/lib/content/demo-profile";
import { buildDeterministicPeriodReading } from "@/lib/readings/period-deterministic";
import { buildPeriodEvidence } from "@/lib/readings/period-evidence";
import { periodFor } from "@/lib/readings/period";

const asOf = new Date("2026-08-30T10:00:00Z");
const chart = calculateChart(demoProfile, asOf);

describe("buildDeterministicPeriodReading", () => {
  it("writes Burmese weekly text naming the best days", () => {
    const evidence = buildPeriodEvidence(chart, periodFor("weekly", asOf));
    const text = buildDeterministicPeriodReading(evidence);
    expect(text).toMatch(/[က-႟]/);
    for (const day of evidence.summary.bestDays) expect(text).toContain(toBurmeseDigits(Number(day.slice(-2))));
    expect(text).toMatch(/လက်တွေ့လုပ်ဆောင်ရန်/);
    expect(text).not.toMatch(/\d/);
  });
  it("uses the daily factors for daily", () => {
    const evidence = buildPeriodEvidence(chart, periodFor("daily", asOf));
    const text = buildDeterministicPeriodReading(evidence);
    expect(text).toContain(evidence.factors![0].label);
  });
  it("splits the month into weeks", () => {
    const text = buildDeterministicPeriodReading(buildPeriodEvidence(chart, periodFor("monthly", asOf)));
    expect(text.match(/ရက်သတ္တပတ်/g)?.length).toBeGreaterThanOrEqual(4);
  });
});
