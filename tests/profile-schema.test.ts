import { afterEach, describe, expect, it, vi } from "vitest";
import { birthProfileSchema } from "@/lib/schemas/profile";

const yangon = {
  name: " မေသဇင် ", birthDate: "1990-01-01", birthTime: "12:00", birthCity: " ရန်ကုန် ",
  latitude: 16.7967, longitude: 96.161, timezone: "Asia/Yangon",
};

describe("birthProfileSchema", () => {
  afterEach(() => vi.useRealTimers());

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

  it("evaluates today's birth date in the selected timezone rather than UTC", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-08-28T20:00:00.000Z"));

    expect(birthProfileSchema.safeParse({ ...yangon, birthDate: "2026-08-29" }).success).toBe(true);
    expect(birthProfileSchema.safeParse({ ...yangon, birthDate: "2026-08-30" }).success).toBe(false);
  });

  it.each([
    { birthDate: "2024-03-10", birthTime: "02:30" },
    { birthDate: "2024-11-03", birthTime: "01:30" },
  ])("rejects nonexistent or repeated zoned birth time $birthDate $birthTime", ({ birthDate, birthTime }) => {
    const result = birthProfileSchema.safeParse({
      ...yangon,
      birthDate,
      birthTime,
      birthCity: "New York",
      latitude: 40.7128,
      longitude: -74.006,
      timezone: "America/New_York",
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.some((issue) => issue.path[0] === "birthTime")).toBe(true);
    }
  });
});
