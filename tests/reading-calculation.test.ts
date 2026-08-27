import { describe, expect, it } from "vitest";
import { calculateChart } from "@/lib/astrology/calculate-chart";
import { calculateReadingSnapshot, readingPeriod } from "@/lib/readings/calculate-reading";
import { readingBasisLede, readingChart, readingTechnique } from "@/lib/readings/snapshot";

const profile = {
  name: "Technique Test",
  birthDate: "1990-01-01",
  birthTime: "12:00",
  birthCity: "Yangon",
  latitude: 16.7967,
  longitude: 96.161,
  timezone: "Asia/Yangon",
};
const now = new Date("2026-08-28T00:00:00.000Z");
const question = "ဒီအစီအစဉ်ကို ဘယ်လို စတင်သင့်သလဲ";

describe("technique-aware reading calculation", () => {
  it("uses the birth instant only for Janma", () => {
    const snapshot = calculateReadingSnapshot(profile, { kind: "janma", question }, now);

    expect(snapshot.technique).toBe("janma");
    expect(snapshot.chart.role).toBe("natal");
    expect(snapshot.chart.instant).toBe("1990-01-01T05:30:00.000Z");
    expect(snapshot.calculatedAt).toBe(now.toISOString());
    expect(readingPeriod(snapshot)).toEqual({ start: "2026-08-28", end: "2026-08-28" });
  });

  it("casts Prashna for the exact submission instant and saved location", () => {
    const snapshot = calculateReadingSnapshot(profile, { kind: "prashna", question }, now);

    expect(snapshot.technique).toBe("prashna");
    expect(snapshot.chart.role).toBe("question");
    expect(snapshot.chart.instant).toBe(now.toISOString());
    expect(snapshot.context).toMatchObject({ askedAt: now.toISOString(), locationSource: "saved-profile" });
  });

  it("casts Muhurta for the selected candidate window", () => {
    const snapshot = calculateReadingSnapshot(profile, {
      kind: "muhurta",
      question,
      targetDate: "2026-08-29",
      eventType: "work",
    }, now);

    expect(snapshot.technique).toBe("muhurta");
    expect(snapshot.chart.role).toBe("election");
    expect(snapshot.context.window).not.toBeNull();
    expect(snapshot.chart.instant).toBe(snapshot.context.window?.start);
    expect(snapshot.context).toMatchObject({ targetDate: "2026-08-29", eventType: "work", locationSource: "saved-profile" });
    expect(readingPeriod(snapshot)).toEqual({ start: "2026-08-29", end: "2026-08-29" });
  });

  it("rejects past and distant Muhurta targets", () => {
    expect(() => calculateReadingSnapshot(profile, {
      kind: "muhurta",
      question,
      targetDate: "2026-08-27",
      eventType: "general",
    }, now)).toThrow("must not be in the past");
    expect(() => calculateReadingSnapshot(profile, {
      kind: "muhurta",
      question,
      targetDate: "2026-12-01",
      eventType: "travel",
    }, now)).toThrow("within 90 days");
  });

  it("reads legacy chart snapshots without changing their stored calculation", () => {
    const legacy = calculateChart(profile, now);

    expect(readingChart(legacy)).toBe(legacy);
    expect(readingTechnique(legacy, "janma")).toBe("janma");
    expect(readingBasisLede(legacy, "prashna")).toContain("v1 မှတ်တမ်းဟောင်း");
    expect(readingBasisLede(legacy, "prashna")).toContain("မေးချိန်ဇာတာ မဟုတ်ပါ");
  });

  it("stores Janma and Prashna periods using the calculation location's local date", () => {
    const lateUtc = new Date("2026-08-28T20:00:00.000Z");
    const snapshot = calculateReadingSnapshot(profile, { kind: "prashna", question }, lateUtc);

    expect(readingPeriod(snapshot)).toEqual({ start: "2026-08-29", end: "2026-08-29" });
  });
});
