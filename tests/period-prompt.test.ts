import { describe, expect, it } from "vitest";
import { calculateChart } from "@/lib/astrology/calculate-chart";
import { buildPeriodPrompt, PERIOD_PROMPT_VERSION } from "@/lib/ai/period-prompt";
import { demoProfile } from "@/lib/content/demo-profile";
import { buildPeriodEvidence } from "@/lib/readings/period-evidence";
import { periodFor } from "@/lib/readings/period";

const asOf = new Date("2026-08-30T10:00:00Z");
const chart = calculateChart(demoProfile, asOf);

describe("buildPeriodPrompt", () => {
  it("embeds policy, version and evidence", () => {
    const evidence = buildPeriodEvidence(chart, periodFor("weekly", asOf));
    const prompt = buildPeriodPrompt(evidence);
    expect(PERIOD_PROMPT_VERSION).toBe("suriya-period-1");
    expect(prompt).toContain(`PROMPT_VERSION: ${PERIOD_PROMPT_VERSION}`);
    expect(prompt).toContain("Write only in clear, natural Burmese");
    expect(prompt).toContain("Never provide a medical diagnosis");
    expect(prompt).toContain("EVIDENCE_JSON_BEGIN");
    expect(prompt).toContain(evidence.key);
    expect(prompt).toContain("ရက်အလိုက်");
  });
  it("asks for weekly paragraphs in the monthly structure", () => {
    const prompt = buildPeriodPrompt(buildPeriodEvidence(chart, periodFor("monthly", asOf)));
    expect(prompt).toContain("ရက်သတ္တပတ်");
    expect(prompt).toContain("PERIOD_KIND: monthly");
  });
});
