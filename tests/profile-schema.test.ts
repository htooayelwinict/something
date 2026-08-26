import { describe, expect, it } from "vitest";
import { birthProfileSchema } from "@/lib/schemas/profile";

const yangon = {
  name: " မေသဇင် ", birthDate: "1990-01-01", birthTime: "12:00", birthCity: " ရန်ကုန် ",
  latitude: 16.7967, longitude: 96.161, timezone: "Asia/Yangon",
};

describe("birthProfileSchema", () => {
  it("normalizes a valid Yangon profile without altering Burmese letters", () => {
    const value = birthProfileSchema.parse(yangon);
    expect(value.name).toBe("မေသဇင်");
    expect(value.birthCity).toBe("ရန်ကုန်");
  });

  it.each([
    [{ ...yangon, latitude: 91 }, "latitude"],
    [{ ...yangon, longitude: -181 }, "longitude"],
    [{ ...yangon, timezone: "Yangon" }, "timezone"],
    [{ ...yangon, birthDate: "2999-01-01" }, "birthDate"],
    [{ ...yangon, birthTime: "" }, "birthTime"],
  ])("rejects invalid %s", (input, field) => {
    const result = birthProfileSchema.safeParse(input);
    expect(result.success).toBe(false);
    if (!result.success) expect(result.error.issues.some((issue) => issue.path[0] === field)).toBe(true);
  });
});
