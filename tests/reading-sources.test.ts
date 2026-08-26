import { describe, expect, it } from "vitest";
import { calculateChart } from "@/lib/astrology/calculate-chart";
import { extractReadingSources } from "@/components/suriya/reading-sources";

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
});
