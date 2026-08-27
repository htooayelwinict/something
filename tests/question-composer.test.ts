import { describe, expect, it } from "vitest";
import { buildReadingPayload, defaultMuhurtaTargetDate, unauthenticatedAskTarget } from "@/components/suriya/question-composer";

describe("Ask authentication routing", () => {
  it("routes a known anonymous visitor to sign-in before starting a reading request", () => {
    expect(unauthenticatedAskTarget(false)).toBe("/login?return_to=/ask");
    expect(unauthenticatedAskTarget(true)).toBeNull();
  });

  it("builds Muhurta requests with the selected date and event type", () => {
    expect(defaultMuhurtaTargetDate(new Date("2026-08-28T00:00:00.000Z"))).toBe("2026-08-29");
    expect(buildReadingPayload("  အလုပ်စဖို့ ဘယ်အချိန်ကောင်းမလဲ  ", "muhurta", "2026-08-29", "work"))
      .toEqual({ kind: "muhurta", question: "အလုပ်စဖို့ ဘယ်အချိန်ကောင်းမလဲ", targetDate: "2026-08-29", eventType: "work" });
  });

  it("does not leak Muhurta fields into Janma or Prashna requests", () => {
    expect(buildReadingPayload("အလုပ်ကို ဘယ်လို ဆက်သွားရမလဲ", "janma", "2026-08-29", "travel"))
      .toEqual({ kind: "janma", question: "အလုပ်ကို ဘယ်လို ဆက်သွားရမလဲ" });
  });
});
