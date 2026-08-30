import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { isPrimaryDestinationCurrent, navigationItems, topNavigationLinks } from "@/lib/content/navigation";

const navigationFiles = [
  "app/page.tsx",
  "app/daily/page.tsx",
  "app/login/page.tsx",
  "app/profile/page.tsx",
  "app/readings/page.tsx",
  "app/readings/[id]/page.tsx",
  "components/suriya/app-shell.tsx",
  "components/suriya/bottom-nav.tsx",
  "components/suriya/brand.tsx",
  "components/suriya/daily-insight.tsx",
  "components/suriya/top-nav.tsx",
  "components/suriya/identity-rail.tsx",
  "components/suriya/source-chip.tsx",
  "components/suriya/cosmic-metric.tsx",
];

describe("navigation compatibility", () => {
  it.each(navigationFiles)("uses native navigation in %s", (file) => {
    const source = readFileSync(new URL(`../${file}`, import.meta.url), "utf8");

    expect(source).not.toContain('from "next/link"');
  });
});

describe("shared navigation destinations", () => {
  it("keeps the four mobile tasks in the intended story order", () => {
    expect(navigationItems.map((item) => item.href as string)).toEqual(["/", "/ask", "/tarot", "/profile"]);
    expect(navigationItems.map((item) => item.label)).toEqual(["ယနေ့", "မေးရန်", "Tarot", "ကိုယ်ရေး"]);
    expect(navigationItems.some((item) => "featured" in item)).toBe(false);
  });

  it("limits desktop navigation to the three primary tasks", () => {
    expect(topNavigationLinks.map((item) => item.href as string)).toEqual(["/", "/ask", "/tarot"]);
    expect(topNavigationLinks.map((item) => item.label)).toEqual(["ယနေ့", "မေးရန်", "Tarot"]);
  });

  it("keeps the Today destination selected throughout the Daily flow", () => {
    expect(isPrimaryDestinationCurrent("/", "/")).toBe(true);
    expect(isPrimaryDestinationCurrent("/", "/daily")).toBe(true);
    expect(isPrimaryDestinationCurrent("/", "/daily/week")).toBe(true);
    expect(isPrimaryDestinationCurrent("/", "/today")).toBe(false);
    expect(isPrimaryDestinationCurrent("/ask", "/ask")).toBe(true);
    expect(isPrimaryDestinationCurrent("/ask", "/ask/example")).toBe(true);
  });

  it("keeps saved-reading history off the primary Home task flow", () => {
    const source = readFileSync(new URL("../app/page.tsx", import.meta.url), "utf8");

    expect(source).not.toContain("RecentReadingsRail");
    expect(source).not.toContain("listReadings");
  });
});
