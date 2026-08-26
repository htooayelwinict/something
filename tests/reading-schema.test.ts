import { describe, expect, it } from "vitest";
import { readingRequestSchema } from "@/lib/schemas/reading";

describe("reading request", () => {
  it("accepts a bounded supported question", () => {
    expect(readingRequestSchema.parse({ kind: "muhurta", question: "  ဘယ်အချိန် စသင့်ပါသလဲ  " }).question).toBe("ဘယ်အချိန် စသင့်ပါသလဲ");
  });

  it("rejects unsupported technique and excessive content", () => {
    expect(readingRequestSchema.safeParse({ kind: "tarot", question: "မေးခွန်းတစ်ခု" }).success).toBe(false);
    expect(readingRequestSchema.safeParse({ kind: "janma", question: "က".repeat(501) }).success).toBe(false);
  });
});
