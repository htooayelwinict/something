import type { ChartSnapshot, DailyInsightData } from "@/lib/astrology/types";
import { zodiacSignsMyanmar } from "@/lib/astrology/types";

const copyByBand = {
  quiet: {
    title: "အရှိန်လျှော့ပြီး ကိုယ့်အတွင်းအသံကို နားထောင်ရမည့်နေ့",
    summary: "စွမ်းအင်ကို မဖြန့်ဘဲ မပြီးသေးသောအလုပ်တစ်ခုကို သေချာစွာ ပိတ်သိမ်းပါ။ အရေးကြီးဆုံးဆုံးဖြတ်ချက်ကို ခဏစောင့်နိုင်ပါတယ်။",
    energy: "ငြိမ်သက်",
  },
  steady: {
    title: "ဖြည်းဖြည်းမှန်မှန် ရှေ့ဆက်နိုင်မည့်နေ့",
    summary: "ပုံမှန်လုပ်ငန်းများကို စနစ်တကျ ဆက်လုပ်ပါ။ သေးငယ်သော်လည်း ပြီးမြောက်နိုင်သော ရည်မှန်းချက်တစ်ခုက ယနေ့အတွက် အကောင်းဆုံးပါ။",
    energy: "တည်ငြိမ်",
  },
  open: {
    title: "စိတ်ရှင်းလင်းပြီး ဆုံးဖြတ်ချက်ကောင်းများ ချနိုင်မည့်နေ့",
    summary: "အမြင်သစ်များကို လက်ခံနိုင်သောအချိန်ပါ။ အလျင်စလို မဆုံးဖြတ်ဘဲ အရေးကြီးဆုံးအလုပ်တစ်ခုကို ဦးစားပေးပါ။",
    energy: "ပွင့်လင်း",
  },
  bright: {
    title: "တက်ကြွသောအခွင့်အလမ်းကို လက်တွေ့လုပ်ဆောင်ရမည့်နေ့",
    summary: "အကြံအစည်ကို လက်တွေ့စတင်ရန် ကောင်းသောစီးဆင်းမှုရှိပါတယ်။ ကိုယ့်တန်ဖိုးနှင့် ကိုက်ညီသော အခွင့်အရေးတစ်ခုကို ရွေးချယ်ပါ။",
    energy: "တက်ကြွ",
  },
} as const;

export function dailyCopy(band: DailyInsightData["band"]) {
  return copyByBand[band];
}

export function buildDailyPresentation(snapshot: ChartSnapshot, insight: DailyInsightData) {
  const copy = dailyCopy(insight.band);
  const moon = snapshot.planets.find((planet) => planet.name === "Moon")!;
  return {
    score: insight.score,
    title: copy.title,
    summary: copy.summary,
    favorableWindow: insight.favorableWindow,
    windowAvailable: Boolean(insight.window),
    horaLord: insight.window?.horaLord,
    timingStatus: insight.timingStatus === "calculated" ? "တွက်ချက်ပြီး" : "အချိန်မကျန်",
    categories: insight.categories,
    rulesetVersion: insight.rulesetVersion,
    moonSign: `${moon.sign} · ${zodiacSignsMyanmar[moon.signIndex]}ရာသီ`,
    energy: copy.energy,
    focus: insight.factors[0]?.description ?? "တွက်ချက်ထားသော အချက်များကို မျှတစွာ သုံးသပ်ပါ။",
    factors: insight.factors.map(({ id, source, label, description }) => ({ id, source, label, description })),
    powerNumber: snapshot.numerology.lifePath,
    calculationMethodCount: 1,
    sources: [
      {
        id: "jyotish" as const,
        label: "Jyotish · Lahiri",
        value: `${snapshot.ascendant.sign} ASC · ${moon.sign} MOON`,
        status: "calculated" as const,
      },
    ],
  };
}
