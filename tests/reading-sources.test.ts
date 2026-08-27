import { describe, expect, it } from "vitest";
import { calculateChart } from "@/lib/astrology/calculate-chart";
import { extractReadingSources } from "@/components/suriya/reading-sources";
import { calculateReadingSnapshot } from "@/lib/readings/calculate-reading";

describe("reading source extraction", () => {
  it("exposes only values derived from the persisted chart snapshot", () => {
    const chart = calculateChart({
      name: "Source Test",
      birthDate: "1990-01-01",
      birthTime: "12:00",
      birthCity: "Yangon",
      latitude: 16.7967,
      longitude: 96.161,
      timezone: "Asia/Yangon",
    }, new Date("2026-08-26T06:00:00Z"));

    expect(extractReadingSources(chart)).toEqual([
      { id: "ascendant", label: "ASCENDANT", value: "Pisces" },
      { id: "moon", label: "MOON", value: "Aquarius · House 12" },
      { id: "numerology", label: "LIFE PATH", value: "3" },
    ]);
  });

  it("uses technique-specific sources for new snapshots", () => {
    const profile = {
      name: "Source Test",
      birthDate: "1990-01-01",
      birthTime: "12:00",
      birthCity: "Yangon",
      latitude: 16.7967,
      longitude: 96.161,
      timezone: "Asia/Yangon",
    };
    const now = new Date("2026-08-28T00:00:00.000Z");
    const question = "ဒီအစီအစဉ်ကို ဘယ်လို စတင်သင့်သလဲ";
    const prashna = calculateReadingSnapshot(profile, { kind: "prashna", question }, now);
    const muhurta = calculateReadingSnapshot(profile, {
      kind: "muhurta",
      question,
      targetDate: "2026-08-29",
      eventType: "work",
    }, now);

    expect(extractReadingSources(prashna).map((source) => source.id)).toEqual(["question_time", "ascendant", "moon"]);
    expect(extractReadingSources(muhurta).map((source) => source.id)).toEqual(["window", "hora", "panchanga"]);
  });
});
