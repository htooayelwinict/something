import { describe, expect, it } from "vitest";
import { calculateChart } from "@/lib/astrology/calculate-chart";
import * as periodPrompt from "@/lib/ai/period-prompt";
import { demoProfile } from "@/lib/content/demo-profile";
import { buildPeriodEvidence } from "@/lib/readings/period-evidence";
import { periodFor } from "@/lib/readings/period";

const asOf = new Date("2026-08-30T10:00:00Z");
const chart = calculateChart(demoProfile, asOf);

describe("buildPeriodPrompt", () => {
  it("embeds policy, version and evidence", () => {
    const evidence = buildPeriodEvidence(chart, periodFor("weekly", asOf));
    const prompt = periodPrompt.buildPeriodPrompt(evidence);
    expect(periodPrompt.PERIOD_PROMPT_VERSION).toBe("suriya-period-2");
    expect(prompt).toContain(`PROMPT_VERSION: ${periodPrompt.PERIOD_PROMPT_VERSION}`);
    expect(prompt).toContain("Write only in clear, natural Burmese");
    expect(prompt).toContain("Never provide a medical diagnosis");
    expect(prompt).toContain("EVIDENCE_JSON_BEGIN");
    expect(prompt).toContain(evidence.key);
    expect(prompt).toContain("ရက်အလိုက်");
  });
  it("asks for weekly paragraphs in the monthly structure", () => {
    const prompt = periodPrompt.buildPeriodPrompt(buildPeriodEvidence(chart, periodFor("monthly", asOf)));
    expect(prompt).toContain("ရက်သတ္တပတ်");
    expect(prompt).toContain("PERIOD_KIND: monthly");
  });

  it("allocates enough model output for each period structure", () => {
    const tokenBudget = (periodPrompt as typeof periodPrompt & {
      periodMaxTokens?: (kind: "daily" | "weekly" | "monthly") => number;
    }).periodMaxTokens;

    expect(tokenBudget?.("daily")).toBeGreaterThanOrEqual(2_500);
    expect(tokenBudget?.("weekly")).toBeGreaterThanOrEqual(4_000);
    expect(tokenBudget?.("monthly")).toBeGreaterThanOrEqual(5_000);
  });

  it("accepts only period interpretations with the required completed action", () => {
    const isComplete = (periodPrompt as typeof periodPrompt & {
      isCompletePeriodInterpretation?: (text: string) => boolean;
    }).isCompletePeriodInterpretation;

    expect(isComplete?.("အနှစ်ချုပ်။\n\nလက်တွေ့လုပ်ဆောင်ရန် — ဖြည်းဖြည်းလုပ်ပါ။")).toBe(true);
    expect(isComplete?.("အနှစ်ချုပ်ပြီး မပြီးသေး")).toBe(false);
    expect(isComplete?.("လက်တွေ့လုပ်ဆောင်ရန် — စာကြောင်းမပြီးသေး")).toBe(false);
  });
});
