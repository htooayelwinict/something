import type { ChartSnapshot } from "@/lib/astrology/types";
import type { ReadingRequestInput } from "@/lib/schemas/reading";

export type ReadingSource = {
  id: "ascendant" | "moon" | "life_path";
  label: string;
  value: string;
};

export type DeterministicReading = {
  text: string;
  sources: ReadingSource[];
  mode: "deterministic";
};

export function buildDeterministicReading(
  snapshot: ChartSnapshot,
  input: ReadingRequestInput,
): DeterministicReading {
  const moon = snapshot.planets.find((planet) => planet.name === "Moon")!;
  const sources: ReadingSource[] = [
    { id: "ascendant", label: "လဂ်", value: `${snapshot.ascendant.sign} · အိမ် ၁` },
    { id: "moon", label: "လ၏အနေအထား", value: `${moon.sign} · အိမ် ${moon.house}` },
    { id: "life_path", label: "ဘဝလမ်းကြောင်း", value: String(snapshot.numerology.lifePath) },
  ];
  const text = [
    `အကျဉ်းချုပ် — “${input.question}” ဆိုတဲ့မေးခွန်းကို ချက်ချင်းအတည်ပြုဆုံးဖြတ်ခြင်းထက် ရရှိထားတဲ့အချက်အလက်နဲ့ ပြန်လည်ချိန်ဆဖို့ သင့်တော်ပါတယ်။ ဒီအဖြေဟာ တွက်ချက်ထားတဲ့ ဇာတာအချက်များကို ရှင်းပြထားတဲ့ လမ်းညွှန်သာဖြစ်ပါတယ်။`,
    `သင့်လဂ်က ${snapshot.ascendant.sign} ဖြစ်ပြီး လက ${moon.sign} ရာသီ အိမ် ${moon.house} မှာ ရှိပါတယ်။ ဘဝလမ်းကြောင်းဂဏန်း ${snapshot.numerology.lifePath} နဲ့အတူ ကြည့်တဲ့အခါ ကိုယ့်ဦးစားပေးမှုကို တိတိကျကျ စာရင်းပြုစုခြင်းက အထောက်အကူဖြစ်နိုင်ပါတယ်။`,
    "လက်တွေ့လုပ်ဆောင်ရန် — ဆုံးဖြတ်ချက်မချမီ အရေးကြီးဆုံးအချက်သုံးခုကို ရေးပြီး ယုံကြည်ရသူတစ်ဦးနှင့် ပြန်လည်စစ်ဆေးပါ။",
  ].join("\n\n");

  return { text, sources, mode: "deterministic" };
}
