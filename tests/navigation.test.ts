import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { navigationItems, topNavigationLinks } from "@/lib/content/navigation";

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
  it("names Home, Daily, and the birth chart consistently", () => {
    expect(navigationItems.find((item) => item.href === "/")?.label).toBe("ပင်မ");
    expect(topNavigationLinks.find((item) => item.href === "/")?.label).toBe("ပင်မ");
    expect(topNavigationLinks.find((item) => item.href === "/daily")?.label).toBe("နေ့စဉ်ဖတ်စာ");
    expect(navigationItems.some((item) => item.href === "/chart")).toBe(true);
    expect(topNavigationLinks.find((item) => item.href === "/chart")?.label).toBe("မွေးဇာတာ");
    expect(navigationItems).toHaveLength(5);
  });
});
