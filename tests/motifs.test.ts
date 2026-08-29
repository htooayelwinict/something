import { describe, expect, it } from "vitest";
import { moonPhaseFraction, starFieldPoints, zodiacGlyph } from "@/lib/content/motifs";

describe("motifs", () => {
  it("maps tithi to a lit fraction", () => {
    expect(moonPhaseFraction({ number: 15, paksha: "Shukla" })).toBe(1);
    expect(moonPhaseFraction({ number: 15, paksha: "Krishna" })).toBe(0);
    expect(moonPhaseFraction({ number: 7, paksha: "Shukla" })).toBeCloseTo(7 / 15, 5);
    expect(moonPhaseFraction({ number: 7, paksha: "Krishna" })).toBeCloseTo(8 / 15, 5);
  });
  it("maps sign index to a glyph", () => {
    expect(zodiacGlyph(0)).toBe("♈");
    expect(zodiacGlyph(11)).toBe("♓");
    expect(zodiacGlyph(12)).toBe("♈");
  });
  it("generates a deterministic star field", () => {
    const a = starFieldPoints(7, 20);
    const b = starFieldPoints(7, 20);
    expect(a).toEqual(b);
    expect(a).toHaveLength(20);
    expect(a.every((star) => star.x >= 0 && star.x <= 100 && star.y >= 0 && star.y <= 100)).toBe(true);
    expect(starFieldPoints(8, 20)).not.toEqual(a);
  });
});
