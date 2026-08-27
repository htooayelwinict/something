import type { ChartSnapshot } from "@/lib/astrology/types";
import type { ReadingInterpretationInput } from "@/lib/schemas/reading";
import { isReadingSnapshot, readingChart, readingTechnique, type ReadingSnapshotLike } from "./snapshot";

export type ReadingSource = {
  id: "ascendant" | "moon" | "life_path" | "question_time" | "window" | "hora" | "panchanga";
  label: string;
  value: string;
};

export type DeterministicReading = {
  text: string;
  sources: ReadingSource[];
  mode: "deterministic";
};

function isNatalChart(chart: ReturnType<typeof readingChart>): chart is ChartSnapshot {
  return chart.role === "natal" && "numerology" in chart && "dasha" in chart;
}

function localInstant(instant: string, timezone: string): string {
  return new Intl.DateTimeFormat("my-MM", {
    timeZone: timezone,
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(instant));
}

export function buildDeterministicReading(
  snapshot: ReadingSnapshotLike,
  input: ReadingInterpretationInput,
): DeterministicReading {
  const chart = readingChart(snapshot);
  const technique = readingTechnique(snapshot, input.kind);
  const moon = chart.planets.find((planet) => planet.name === "Moon");
  if (!moon) throw new Error("Moon is required for a deterministic reading");

  if (technique === "prashna") {
    const questionTime = isReadingSnapshot(snapshot) && snapshot.technique === "prashna"
      ? snapshot.context.askedAt
      : chart.instant;
    const sources: ReadingSource[] = [
      { id: "question_time", label: "မေးသည့်အချိန်", value: localInstant(questionTime, chart.location.timezone) },
      { id: "ascendant", label: "မေးချိန်လဂ်", value: chart.ascendant.sign },
      { id: "moon", label: "မေးချိန်လ", value: `${moon.sign} · အိမ် ${moon.house}` },
    ];
    const text = [
      `အကျဉ်းချုပ် — “${input.question}” ကို မေးသည့်အချိန်ဇာတာအရ ချက်ချင်းအတည်ပြုခြင်းထက် အခြေအနေကို တစ်ဆင့်ချင်း စစ်ဆေးရန် သင့်တော်ပါတယ်။ ဤအဖြေသည် အာမခံချက်မဟုတ်ဘဲ ဆုံးဖြတ်ချက်ပြန်လည်စဉ်းစားရန် လမ်းညွှန်ဖြစ်ပါတယ်။`,
      `မေးချိန်လဂ်က ${chart.ascendant.sign} ဖြစ်ပြီး လက ${moon.sign} ရာသီ အိမ် ${moon.house} မှာ ရှိပါတယ်။ ${chart.panchanga.nakshatra.name} နက္ခတ်၏ အခြေအနေကိုပါ ထည့်ကြည့်သောအခါ မေးခွန်း၏ အဓိကအချက်ကို တိတိကျကျ သတ်မှတ်ခြင်းက အထောက်အကူဖြစ်နိုင်ပါတယ်။`,
      "လက်တွေ့လုပ်ဆောင်ရန် — ယနေ့ရရှိနိုင်သော အချက်အလက်တစ်ခုကို ထပ်မံအတည်ပြုပြီးမှ နောက်တစ်ဆင့်ကို ရွေးပါ။",
    ].join("\n\n");
    return { text, sources, mode: "deterministic" };
  }

  if (technique === "muhurta") {
    const context = isReadingSnapshot(snapshot) && snapshot.technique === "muhurta" ? snapshot.context : null;
    const window = context?.window ?? null;
    const sources: ReadingSource[] = [
      { id: "window", label: "ရွေးချယ်ထားသောအချိန်", value: window?.label ?? "မတွေ့ပါ" },
      { id: "hora", label: "Hora", value: window ? `${window.horaLord} Hora` : "—" },
      { id: "panchanga", label: "Panchanga", value: `${chart.panchanga.tithi.name} · ${chart.panchanga.nakshatra.name}` },
    ];
    const timing = window
      ? `${context!.targetDate} ရက်အတွက် ${window.label} (${window.horaLord} Hora) ကို Rahu Kalam မထိသော ကိုယ်စားလှယ်အချိန်အဖြစ် တွက်ချက်ထားပါတယ်။`
      : `${context?.targetDate ?? "ရွေးထားသည့်ရက်"} အတွက် ကျန်ရှိသော နေ့ခင်းအချိန်ထဲမှာ သင့်လျော်သောကိုယ်စားလှယ်အချိန် မတွေ့ပါ။`;
    const text = [
      `အကျဉ်းချုပ် — “${input.question}” အတွက် ${timing} ဤအချိန်သည် အာမခံချက်မဟုတ်ဘဲ စတင်ချိန်ရွေးရာတွင် ထည့်သွင်းစဉ်းစားနိုင်သော လမ်းညွှန်သာဖြစ်ပါတယ်။`,
      `${chart.panchanga.tithi.name} တိထိ၊ ${chart.panchanga.nakshatra.name} နက္ခတ်နှင့် ${chart.panchanga.karana.name} Karana ကို အချိန်ရွေးချယ်မှုတွင် အသုံးပြုထားပါတယ်။`,
      window
        ? `လက်တွေ့လုပ်ဆောင်ရန် — ${window.label} မတိုင်မီ လိုအပ်သောပစ္စည်းနှင့် အတည်ပြုချက်များကို အသင့်ပြင်ထားပါ။`
        : "လက်တွေ့လုပ်ဆောင်ရန် — နောက်ရက်တစ်ရက်ကို ရွေးပြီး ထပ်မံတွက်ချက်ပါ။",
    ].join("\n\n");
    return { text, sources, mode: "deterministic" };
  }

  if (!isNatalChart(chart)) throw new Error("Natal chart is required for a Janma reading");
  const sources: ReadingSource[] = [
    { id: "ascendant", label: "လဂ်", value: `${chart.ascendant.sign} · အိမ် ၁` },
    { id: "moon", label: "လ၏အနေအထား", value: `${moon.sign} · အိမ် ${moon.house}` },
    { id: "life_path", label: "ဘဝလမ်းကြောင်း", value: String(chart.numerology.lifePath) },
  ];
  const text = [
    `အကျဉ်းချုပ် — “${input.question}” ဆိုတဲ့မေးခွန်းကို ချက်ချင်းအတည်ပြုဆုံးဖြတ်ခြင်းထက် ရရှိထားတဲ့အချက်အလက်နဲ့ ပြန်လည်ချိန်ဆဖို့ သင့်တော်ပါတယ်။ ဒီအဖြေဟာ တွက်ချက်ထားတဲ့ ဇာတာအချက်များကို ရှင်းပြထားတဲ့ လမ်းညွှန်သာဖြစ်ပါတယ်။`,
    `သင့်လဂ်က ${chart.ascendant.sign} ဖြစ်ပြီး လက ${moon.sign} ရာသီ အိမ် ${moon.house} မှာ ရှိပါတယ်။ ဘဝလမ်းကြောင်းဂဏန်း ${chart.numerology.lifePath} နဲ့အတူ ကြည့်တဲ့အခါ ကိုယ့်ဦးစားပေးမှုကို တိတိကျကျ စာရင်းပြုစုခြင်းက အထောက်အကူဖြစ်နိုင်ပါတယ်။`,
    "လက်တွေ့လုပ်ဆောင်ရန် — ဆုံးဖြတ်ချက်မချမီ အရေးကြီးဆုံးအချက်သုံးခုကို ရေးပြီး ယုံကြည်ရသူတစ်ဦးနှင့် ပြန်လည်စစ်ဆေးပါ။",
  ].join("\n\n");

  return { text, sources, mode: "deterministic" };
}
