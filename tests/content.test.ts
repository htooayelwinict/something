import { describe, expect, it } from "vitest";
import { demoDailyInsight, demoSpecialists, readingTechniques } from "@/lib/content/demo";

describe("Suriya launch content", () => {
  it("offers the staged set of reading techniques", () => {
    expect(readingTechniques.map((item) => item.id)).toEqual(["janma", "prashna", "muhurta"]);
    expect(readingTechniques.every((item) => /[က-အ]/.test(item.title))).toBe(true);
  });

  it("keeps the daily score bounded and the booking directory populated", () => {
    expect(demoDailyInsight.score).toBeGreaterThanOrEqual(0);
    expect(demoDailyInsight.score).toBeLessThanOrEqual(100);
    expect(demoSpecialists).toHaveLength(2);
    expect(demoSpecialists.every((item) => !item.availability.includes("မကြာမီ"))).toBe(true);
    expect(demoSpecialists.every((item) => item.location.length > 0 && item.sessionMinutes === 30)).toBe(true);
  });
});
