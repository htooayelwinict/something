import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

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
];

describe("navigation compatibility", () => {
  it.each(navigationFiles)("uses native navigation in %s", (file) => {
    const source = readFileSync(new URL(`../${file}`, import.meta.url), "utf8");

    expect(source).not.toContain('from "next/link"');
  });
});
