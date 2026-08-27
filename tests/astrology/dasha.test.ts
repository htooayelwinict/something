import { describe, expect, it } from "vitest";
import { vimshottariAt } from "@/lib/astrology/dasha";

describe("Vimshottari periods", () => {
  it("returns contiguous periods that contain the requested instant", () => {
    const birth = new Date("2000-01-01T00:00:00.000Z");
    const at = new Date("2026-08-28T00:00:00.000Z");
    const result = vimshottariAt(42, birth, at);

    expect(Date.parse(result.mahadasha.start)).toBeLessThanOrEqual(at.valueOf());
    expect(Date.parse(result.mahadasha.end)).toBeGreaterThan(at.valueOf());
    expect(Date.parse(result.antardasha.start)).toBeLessThanOrEqual(at.valueOf());
    expect(Date.parse(result.antardasha.end)).toBeGreaterThan(at.valueOf());
  });

  it("rejects instants outside the generated range instead of selecting an unrelated period", () => {
    const birth = new Date("2000-01-01T00:00:00.000Z");

    expect(() => vimshottariAt(0, birth, new Date("1999-01-01T00:00:00.000Z")))
      .toThrow("outside generated Vimshottari range");
    expect(() => vimshottariAt(0, birth, new Date("2400-01-01T00:00:00.000Z")))
      .toThrow("outside generated Vimshottari range");
  });
});
