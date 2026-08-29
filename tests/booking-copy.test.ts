import { expect, it } from "vitest";
import { bookingLabels, formatBookingDate, maskPhone } from "@/lib/content/booking-copy";

it("labels booking enums in Burmese", () => {
  expect(bookingLabels.preferredTime.morning).toMatch(/နံနက်/);
  expect(bookingLabels.topic.love).toBe("ချစ်ရေး");
  expect(bookingLabels.contactChannel.phone).toMatch(/ဖုန်း/);
});

it("masks all but the last three digits", () => {
  expect(maskPhone("+95 9 123 456 789")).toBe("•••• 789");
});

it("formats the preferred date with Burmese digits and weekday", () => {
  expect(formatBookingDate("2026-09-05")).toBe("စနေ · ၂၀၂၆-၀၉-၀၅");
});
