import { describe, expect, it } from "vitest";
import { calculateChart } from "@/lib/astrology/calculate-chart";
import { buildDeterministicReading } from "@/lib/readings/deterministic";
import { calculateReadingSnapshot } from "@/lib/readings/calculate-reading";

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

  it("uses the question chart rather than natal numerology for Prashna", () => {
    const question = "မိသားစုနဲ့ ဘယ်လိုပြောသင့်လဲ?";
    const snapshot = calculateReadingSnapshot(chart.input, { kind: "prashna", question }, new Date("2026-08-28T03:15:00.000Z"));
    const result = buildDeterministicReading(snapshot, { kind: "prashna", question });

    expect(result.sources.map((source) => source.id)).toEqual(["question_time", "ascendant", "moon"]);
    expect(result.text).toContain("မေးသည့်အချိန်ဇာတာ");
    expect(result.text).not.toContain("ဘဝလမ်းကြောင်းဂဏန်း");
  });

  it("explains the calculated window and hora for Muhurta", () => {
    const input = {
      kind: "muhurta" as const,
      question: "လုပ်ငန်းစတင်ဖို့ ဘယ်အချိန်ကောင်းမလဲ?",
      targetDate: "2026-08-29",
      eventType: "work" as const,
    };
    const snapshot = calculateReadingSnapshot(chart.input, input, new Date("2026-08-28T00:00:00.000Z"));
    const result = buildDeterministicReading(snapshot, input);

    expect(result.sources.map((source) => source.id)).toEqual(["window", "hora", "panchanga"]);
    expect(result.text).toContain(snapshot.context.window!.label);
    expect(result.text).toContain(`${snapshot.context.window!.horaLord} Hora`);
    expect(result.text).toContain("အာမခံချက်မဟုတ်");
  });
});
