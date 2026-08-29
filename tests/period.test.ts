import { describe, expect, it } from "vitest";
import { isPeriodKind, localNoonUtc, periodFor } from "@/lib/readings/period";

const now = new Date("2026-08-30T10:00:00Z"); // Sunday 16:30 Yangon

describe("periodFor", () => {
  it("daily is the local date", () => {
    const p = periodFor("daily", now);
    expect(p.key).toBe("2026-08-30");
    expect(p.days).toEqual(["2026-08-30"]);
    expect(p.start).toBe("2026-08-29T17:30:00.000Z");
    expect(p.end).toBe("2026-08-30T17:30:00.000Z");
    expect(p.label).toBe("ဩဂုတ် ၃၀ · ၂၀၂၆");
  });
  it("weekly is ISO Monday–Sunday", () => {
    const p = periodFor("weekly", now);
    expect(p.key).toBe("2026-W35");
    expect(p.days[0]).toBe("2026-08-24");
    expect(p.days[6]).toBe("2026-08-30");
    expect(p.label).toBe("ဩဂုတ် ၂၄ – ၃၀ · ၂၀၂၆");
  });
  it("weekly crosses months and years", () => {
    const p = periodFor("weekly", new Date("2026-01-01T00:00:00Z"));
    expect(p.key).toBe("2026-W01");
    expect(p.days[0]).toBe("2025-12-29");
    expect(p.label).toBe("ဒီဇင်ဘာ ၂၉ – ဇန်နဝါရီ ၄ · ၂၀၂၆");
  });
  it("monthly covers the calendar month", () => {
    const p = periodFor("monthly", new Date("2026-02-10T00:00:00Z"));
    expect(p.key).toBe("2026-02");
    expect(p.days).toHaveLength(28);
    expect(p.days[0]).toBe("2026-02-01");
    expect(p.label).toBe("ဖေဖော်ဝါရီ ၂၀၂၆");
  });
  it("localNoonUtc converts", () => {
    expect(localNoonUtc("2026-08-30", "Asia/Yangon").toISOString()).toBe("2026-08-30T05:30:00.000Z");
  });
  it("guards kinds", () => {
    expect(isPeriodKind("weekly")).toBe(true);
    expect(isPeriodKind("yearly")).toBe(false);
  });
});
