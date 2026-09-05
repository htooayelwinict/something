import { describe, expect, it } from "vitest";
import { bookingStaffPatchSchema } from "@/lib/schemas/staff-booking";

describe("bookingStaffPatchSchema", () => {
  it("accepts a status, a note, or both, and normalises an empty note to null", () => {
    expect(bookingStaffPatchSchema.parse({ status: "confirmed" })).toEqual({ status: "confirmed" });
    expect(bookingStaffPatchSchema.parse({ staffNote: "  ဖုန်းဆက်ပြီး  " })).toEqual({ staffNote: "ဖုန်းဆက်ပြီး" });
    expect(bookingStaffPatchSchema.parse({ staffNote: "" })).toEqual({ staffNote: null });
  });

  it("rejects empty patches, unknown statuses, long notes, and extra keys", () => {
    expect(bookingStaffPatchSchema.safeParse({}).success).toBe(false);
    expect(bookingStaffPatchSchema.safeParse({ status: "done" }).success).toBe(false);
    expect(bookingStaffPatchSchema.safeParse({ staffNote: "x".repeat(501) }).success).toBe(false);
    expect(bookingStaffPatchSchema.safeParse({ status: "confirmed", phone: "1" }).success).toBe(false);
  });
});
