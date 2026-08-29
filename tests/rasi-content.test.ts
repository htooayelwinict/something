import { describe, expect, it } from "vitest";
import { zodiacSigns } from "@/lib/astrology/types";
import { findRasi, rasiContent } from "@/lib/content/rasi";

describe("rasi content", () => {
  it("covers all twelve signs completely", () => {
    expect(rasiContent).toHaveLength(12);
    expect(new Set(rasiContent.map((item) => item.slug)).size).toBe(12);
    for (const [index, item] of rasiContent.entries()) {
      expect(item.index).toBe(index);
      expect(item.nameEn).toBe(zodiacSigns[index]);
      expect(item.nameMy.length).toBeGreaterThan(0);
      expect(item.temperament.length).toBeGreaterThan(40);
      expect(item.strengths).toHaveLength(3);
      expect(item.cautions).toHaveLength(2);
      expect(item.luckyDay).toMatch(/နေ့$/);
      expect(item.rulingPlanetMy.length).toBeGreaterThan(0);
    }
  });
  it("finds by slug", () => {
    expect(findRasi("mesha")?.glyph).toBe("♈");
    expect(findRasi("nope")).toBeNull();
  });
});
