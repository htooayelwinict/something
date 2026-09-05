import { describe, expect, it } from "vitest";
import { bookingStatusLabels, bookingStatusOrder, studioErrorMessage, studioMessages } from "@/lib/content/studio-copy";

describe("studio copy", () => {
  it("labels every booking status in Burmese", () => {
    for (const status of bookingStatusOrder) expect(bookingStatusLabels[status]).toMatch(/[က-႟]/);
  });

  it("maps api error codes to Burmese and passes Burmese messages through", () => {
    expect(studioErrorMessage("forbidden")).toBe(studioMessages.forbidden);
    expect(studioErrorMessage("အမည်ကို ရေးပါ")).toBe("အမည်ကို ရေးပါ");
    expect(studioErrorMessage("whatever")).toBe(studioMessages.invalid_input);
    expect(studioErrorMessage(undefined)).toBe(studioMessages.invalid_input);
  });
});
