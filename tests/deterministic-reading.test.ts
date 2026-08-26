import { describe, expect, it } from "vitest";
import { calculateChart } from "@/lib/astrology/calculate-chart";
import { buildDeterministicReading } from "@/lib/readings/deterministic";

const chart = calculateChart({
  name: "မေသီ",
  birthDate: "1995-02-14",
  birthTime: "06:42",
  birthCity: "Yangon",
  latitude: 16.7967,
  longitude: 96.161,
  timezone: "Asia/Yangon",
}, new Date("2026-08-26T00:00:00.000Z"));

describe("buildDeterministicReading", () => {
  it("uses only canonical chart facts and ends with one action", () => {
    const result = buildDeterministicReading(chart, {
      kind: "janma",
      question: "အလုပ်ပြောင်းသင့်လား?",
    });

    expect(result.mode).toBe("deterministic");
    expect(result.sources.map((source) => source.label)).toEqual([
      "လဂ်",
      "လ၏အနေအထား",
      "ဘဝလမ်းကြောင်း",
    ]);
    expect(result.text).toContain(chart.ascendant.sign);
    expect(result.text).toContain(chart.planets.find((planet) => planet.name === "Moon")!.sign);
    expect(result.text).toContain(String(chart.numerology.lifePath));
    expect(result.text).toMatch(/လက်တွေ့လုပ်ဆောင်ရန် — .+$/);
  });

  it("reflects the submitted question without treating it as an instruction", () => {
    const result = buildDeterministicReading(chart, {
      kind: "prashna",
      question: "မိသားစုနဲ့ ဘယ်လိုပြောသင့်လဲ?",
    });

    expect(result.text).toContain("မိသားစုနဲ့ ဘယ်လိုပြောသင့်လဲ?");
    expect(result.text).not.toContain("သေချာပေါက်");
  });
});
