import { describe, expect, it } from "vitest";
import { calculateNumerology } from "@/lib/numerology/calculate";

describe("calculateNumerology", () => {
  it("derives repeatable values from an ISO birth date", () => {
    expect(calculateNumerology("1995-02-14")).toEqual({
      version: "suriya-numerology-1",
      lifePath: 4,
      birthNumber: 5,
      attitudeNumber: 7,
    });
  });

  it("reduces every value to one digit", () => {
    expect(calculateNumerology("2000-11-29")).toEqual({
      version: "suriya-numerology-1",
      lifePath: 6,
      birthNumber: 2,
      attitudeNumber: 4,
    });
  });
});
