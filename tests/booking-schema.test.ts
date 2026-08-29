import { describe, expect, it } from "vitest";
import { bookingDateBounds, bookingRequestSchema, isBookingDateInRange } from "@/lib/schemas/booking";

const valid = {
  specialistId: "thiri", name: "မမ", phone: "+95 9 123 456 789", contactChannel: "viber",
  preferredDate: "2026-09-05", preferredTime: "evening", topic: "love", note: "",
};

describe("bookingRequestSchema", () => {
  it("accepts a valid request and trims", () => {
    const parsed = bookingRequestSchema.parse({ ...valid, name: "  မမ  " });
    expect(parsed.name).toBe("မမ");
    expect(parsed.note).toBeUndefined();
  });
  it("rejects a bad phone with a Burmese message", () => {
    const result = bookingRequestSchema.safeParse({ ...valid, phone: "abc" });
    expect(result.success).toBe(false);
    expect(result.error?.issues[0]?.message).toMatch(/ဖုန်း/);
  });
  it("rejects unknown enums", () => {
    expect(bookingRequestSchema.safeParse({ ...valid, topic: "money" }).success).toBe(false);
  });
});

describe("booking date window", () => {
  it("spans today to +60 days in Yangon", () => {
    const bounds = bookingDateBounds(new Date("2026-08-30T18:00:00Z"));
    expect(bounds.min).toBe("2026-08-31");
    expect(bounds.max).toBe("2026-10-30");
    expect(isBookingDateInRange("2026-08-30", new Date("2026-08-30T18:00:00Z"))).toBe(false);
    expect(isBookingDateInRange("2026-10-30", new Date("2026-08-30T18:00:00Z"))).toBe(true);
  });
});
