import { describe, expect, it } from "vitest";
import { readingRequestSchema } from "@/lib/schemas/reading";

describe("reading request", () => {
  it("accepts bounded Janma and Prashna questions", () => {
    expect(readingRequestSchema.parse({ kind: "janma", question: "  အလုပ်ကို ဘယ်လို ဆက်သွားရမလဲ  " }).question).toBe("အလုပ်ကို ဘယ်လို ဆက်သွားရမလဲ");
    expect(readingRequestSchema.safeParse({ kind: "prashna", question: "ဒီအစီအစဉ်ကို စသင့်သလား" }).success).toBe(true);
  });

  it("requires a date and event type for Muhurta", () => {
    const result = readingRequestSchema.parse({
      kind: "muhurta",
      question: "  ဘယ်အချိန် စသင့်ပါသလဲ  ",
      targetDate: "2026-09-01",
      eventType: "work",
    });

    expect(result.question).toBe("ဘယ်အချိန် စသင့်ပါသလဲ");
    expect(result).toMatchObject({ targetDate: "2026-09-01", eventType: "work" });
    expect(readingRequestSchema.safeParse({ kind: "muhurta", question: "ဘယ်အချိန် စသင့်ပါသလဲ" }).success).toBe(false);
  });

  it("rejects unsupported technique and excessive content", () => {
    expect(readingRequestSchema.safeParse({ kind: "tarot", question: "မေးခွန်းတစ်ခု" }).success).toBe(false);
    expect(readingRequestSchema.safeParse({ kind: "janma", question: "က".repeat(501) }).success).toBe(false);
    expect(readingRequestSchema.safeParse({
      kind: "muhurta",
      question: "ဘယ်အချိန် စသင့်ပါသလဲ",
      targetDate: "not-a-date",
      eventType: "work",
    }).success).toBe(false);
  });
});
