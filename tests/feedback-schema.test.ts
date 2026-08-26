import { describe, expect, it } from "vitest";
import { readingFeedbackSchema } from "@/lib/schemas/feedback";

describe("readingFeedbackSchema", () => {
  it.each(["useful", "not_useful"])("accepts %s", (value) => {
    expect(readingFeedbackSchema.parse({ value })).toEqual({ value });
  });

  it("rejects unknown values", () => {
    expect(readingFeedbackSchema.safeParse({ value: "maybe" }).success).toBe(false);
  });
});
