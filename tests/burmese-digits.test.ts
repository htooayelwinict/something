import { expect, it } from "vitest";
import { toBurmeseDigits } from "@/lib/content/burmese-digits";

it("converts ASCII digits to Burmese digits", () => {
  expect(toBurmeseDigits(2)).toBe("၂");
  expect(toBurmeseDigits("2 / 3")).toBe("၂ / ၃");
  expect(toBurmeseDigits("2026-08-30")).toBe("၂၀၂၆-၀၈-၃၀");
});
