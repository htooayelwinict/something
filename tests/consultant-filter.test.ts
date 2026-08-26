import { describe, expect, it } from "vitest";
import { matchesConsultantCategory } from "@/components/suriya/consultant-directory";

const thiri = ["ချစ်ရေး", "အလုပ်အကိုင်", "စိတ်ခံစားမှု"];
const minThu = ["ဘဝလမ်းကြောင်း", "စီးပွားရေး", "ဆုံးဖြတ်ချက်"];

describe("consultant category filtering", () => {
  it("maps each category to the consultant's actual tags", () => {
    expect(matchesConsultantCategory(thiri, "love")).toBe(true);
    expect(matchesConsultantCategory(thiri, "direction")).toBe(false);
    expect(matchesConsultantCategory(minThu, "career")).toBe(true);
    expect(matchesConsultantCategory(minThu, "all")).toBe(true);
  });
});
