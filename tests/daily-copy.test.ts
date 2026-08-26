import { describe, expect, it } from "vitest";
import { dailyCopy } from "@/lib/content/daily-copy";

describe("daily Burmese copy", () => {
  it("maps every bounded score band to distinct Burmese guidance", () => {
    const bands = ["quiet", "steady", "open", "bright"] as const;
    const titles = bands.map((band) => dailyCopy(band).title);
    expect(new Set(titles).size).toBe(4);
    expect(titles.every((title) => /[က-အ]/.test(title))).toBe(true);
  });
});
