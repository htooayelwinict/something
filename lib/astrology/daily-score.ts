import { Body } from "astronomy-engine";
import { signIndex } from "./angles";
import { toSidereal } from "./ayanamsa";
import { tropicalGeocentricLongitude } from "./ephemeris";
import { findMuhurtaWindow } from "./muhurta";
import { calculatePanchangaAt } from "./panchanga";
import { localDateInTimezone } from "./time";
import { vimshottariAt } from "./dasha";
import type {
  ChartSnapshot,
  DailyCategoryScores,
  DailyFactor,
  DailyInsightData,
  Panchanga,
  PlanetName,
} from "./types";

export const DAILY_RULESET_VERSION = "suriya-daily-2" as const;

const supportCategories = ["career", "relationships", "focus", "energy"] as const;

function clampScore(value: number) {
  return Math.max(20, Math.min(95, Math.round(value)));
}

export function calculateOverallScore(categories: DailyCategoryScores): number {
  const support = supportCategories.reduce((sum, category) => sum + categories[category], 0) / supportCategories.length;
  const cautionPenalty = Math.max(0, categories.caution - 50) * 0.3;
  return clampScore(support - cautionPenalty);
}

function houseFrom(referenceSign: number, movingSign: number): number {
  return ((movingSign - referenceSign + 12) % 12) + 1;
}

function transitSign(body: Body, instant: Date): number {
  return signIndex(toSidereal(tropicalGeocentricLongitude(body, instant), instant));
}

function factor(
  id: string,
  source: DailyFactor["source"],
  label: string,
  description: string,
  impacts: DailyFactor["impacts"],
  house?: number,
): DailyFactor {
  return house === undefined ? { id, source, label, description, impacts } : { id, source, label, description, impacts, house };
}

function moonTransitFactor(house: number): DailyFactor {
  if ([1, 3, 6, 7, 10, 11].includes(house)) {
    return factor(
      "transit.moon.supportive-house",
      "transit",
      "လ၏နေ့စဉ်ရွေ့လျားမှု",
      `လက မွေးလမှ ${house} အိမ်မြောက်တွင် ရှိပြီး အာရုံနှင့် တုံ့ပြန်မှုကို အားပေးနေသည်။`,
      { focus: 8, energy: 6, relationships: 4, caution: -3 },
      house,
    );
  }
  return factor(
    "transit.moon.reflective-house",
    "transit",
    "လ၏နေ့စဉ်ရွေ့လျားမှု",
    `လက မွေးလမှ ${house} အိမ်မြောက်တွင် ရှိသောကြောင့် တုံ့ပြန်မီ ခဏရပ်၍ စစ်ဆေးရန်ကောင်းသည်။`,
    { focus: -4, energy: -5, caution: 8 },
    house,
  );
}

function jupiterTransitFactor(house: number): DailyFactor {
  if ([2, 5, 7, 9, 11].includes(house)) {
    return factor(
      "transit.jupiter.supportive-house",
      "transit",
      "ဂုရုဂြိုဟ် ဂေါစရ",
      `ဂုရုဂြိုဟ်က မွေးလမှ ${house} အိမ်မြောက်ကို ဖြတ်သန်း၍ သင်ယူမှုနှင့် အခွင့်အရေးအမြင်ကို အားပေးနေသည်။`,
      { career: 8, relationships: 5, focus: 4, caution: -2 },
      house,
    );
  }
  return factor(
    "transit.jupiter.integration-house",
    "transit",
    "ဂုရုဂြိုဟ် ဂေါစရ",
    `ဂုရုဂြိုဟ်က မွေးလမှ ${house} အိမ်မြောက်တွင် ရှိပြီး ချဲ့ထွင်မီ ရှိပြီးသားအရာကို သေချာစေရန် ဦးစားပေးသည်။`,
    { career: 2, focus: 3, caution: 2 },
    house,
  );
}

function saturnTransitFactor(house: number): DailyFactor {
  if ([12, 1, 2].includes(house)) {
    return factor(
      "transit.saturn.sade-sati-zone",
      "transit",
      "စနေဂြိုဟ် ဖိအားဇုန်",
      `စနေဂြိုဟ်က မွေးလမှ ${house} အိမ်မြောက်တွင် ရှိသောကြောင့် အရှိန်ထက် စည်းကမ်းနှင့် အနားယူမှုကို ဦးစားပေးရန်လိုသည်။`,
      { career: -3, focus: -4, energy: -8, caution: 12 },
      house,
    );
  }
  if ([3, 6, 11].includes(house)) {
    return factor(
      "transit.saturn.constructive-house",
      "transit",
      "စနေဂြိုဟ် တည်ဆောက်မှု",
      `စနေဂြိုဟ်က မွေးလမှ ${house} အိမ်မြောက်တွင် ရှိပြီး စနစ်တကျ ကြိုးစားမှုကို အားပေးနေသည်။`,
      { career: 6, focus: 6, energy: 2, caution: -2 },
      house,
    );
  }
  return factor(
    "transit.saturn.discipline-house",
    "transit",
    "စနေဂြိုဟ် စည်းကမ်း",
    `စနေဂြိုဟ်က မွေးလမှ ${house} အိမ်မြောက်တွင် ရှိသဖြင့် အချိန်နှင့် တာဝန်ကို သေချာစီမံရန်လိုသည်။`,
    { career: 2, focus: 3, energy: -3, caution: 4 },
    house,
  );
}

function dashaFactor(snapshot: ChartSnapshot, lord: string, level: "mahadasha" | "antardasha"): DailyFactor {
  const placement = snapshot.planets.find((planet) => planet.name === lord as PlanetName);
  const prefix = level === "mahadasha" ? "မဟာဒဿာ" : "အန္တရဒဿာ";
  if (!placement) {
    return factor(
      `dasha.${level}.unresolved`,
      "dasha",
      `${prefix} ${lord}`,
      `${lord} ၏ မွေးဇာတာအိမ်ကို မချိတ်ဆက်နိုင်သဖြင့် ဒဿာအကျိုးကို မျှတစွာထားသည်။`,
      { caution: 1 },
    );
  }
  if ([1, 4, 5, 7, 9, 10, 11].includes(placement.house)) {
    return factor(
      `dasha.${level}.supportive-house`,
      "dasha",
      `${prefix} ${lord}`,
      `${lord} က မွေးဇာတာ အိမ် ${placement.house} တွင် ရှိပြီး လက်ရှိကာလ၏ တည်ဆောက်နိုင်စွမ်းကို အားပေးသည်။`,
      { career: level === "mahadasha" ? 6 : 4, relationships: 3, focus: 3, caution: -1 },
      placement.house,
    );
  }
  if ([6, 8, 12].includes(placement.house)) {
    return factor(
      `dasha.${level}.pressure-house`,
      "dasha",
      `${prefix} ${lord}`,
      `${lord} က မွေးဇာတာ အိမ် ${placement.house} တွင် ရှိသဖြင့် ပြုပြင်ခြင်းနှင့် အပိုသတိထားခြင်းကို ဦးစားပေးသည်။`,
      { focus: -2, energy: -2, caution: level === "mahadasha" ? 6 : 4 },
      placement.house,
    );
  }
  return factor(
    `dasha.${level}.neutral-house`,
    "dasha",
    `${prefix} ${lord}`,
    `${lord} က မွေးဇာတာ အိမ် ${placement.house} ကို လှုပ်ရှားစေပြီး ပုံမှန်အရှိန်ဖြင့် ဆက်လုပ်ရန် သင့်တော်သည်။`,
    { focus: 2, energy: 1 },
    placement.house,
  );
}

function panchangaFactor(panchanga: Panchanga): DailyFactor {
  if (panchanga.karana.name === "Vishti") {
    return factor(
      "panchanga.karana.vishti",
      "panchanga",
      "ယနေ့ Panchanga",
      `${panchanga.tithi.name} တိထိနှင့် Vishti Karana ကြောင့် အရေးကြီးစတင်မှုတွင် အပိုစစ်ဆေးရန်လိုသည်။`,
      { focus: -3, energy: -2, caution: 8 },
    );
  }
  return factor(
    "panchanga.current.non-vishti",
    "panchanga",
    "ယနေ့ Panchanga",
    `${panchanga.tithi.name} တိထိ၊ ${panchanga.nakshatra.name} နက္ခတ်နှင့် ${panchanga.karana.name} Karana ကို အချိန်ရွေးချယ်မှုတွင် ထည့်တွက်ထားသည်။`,
    { focus: 3, caution: -1 },
  );
}

function applyFactors(factors: DailyFactor[]): DailyCategoryScores {
  const scores: DailyCategoryScores = { career: 50, relationships: 50, focus: 50, energy: 50, caution: 35 };
  for (const item of factors) {
    for (const [category, impact] of Object.entries(item.impacts) as Array<[keyof DailyCategoryScores, number]>) {
      scores[category] += impact;
    }
  }
  return Object.fromEntries(Object.entries(scores).map(([key, value]) => [key, clampScore(value)])) as DailyCategoryScores;
}

/** Score bands match the reachable v2 factor range rather than the wider category clamps. */
export function bandFor(score: number): DailyInsightData["band"] {
  return score < 48 ? "quiet" : score < 55 ? "steady" : score < 62 ? "open" : "bright";
}

export function calculateDailyInsight(snapshot: ChartSnapshot, date: Date): DailyInsightData {
  const natalMoon = snapshot.planets.find((planet) => planet.name === "Moon");
  if (!natalMoon) throw new Error("Natal Moon is required for daily guidance");

  const moonHouse = houseFrom(natalMoon.signIndex, transitSign(Body.Moon, date));
  const jupiterHouse = houseFrom(natalMoon.signIndex, transitSign(Body.Jupiter, date));
  const saturnHouse = houseFrom(natalMoon.signIndex, transitSign(Body.Saturn, date));
  const dasha = vimshottariAt(natalMoon.longitude, new Date(snapshot.instant), date);
  const targetDate = localDateInTimezone(date, snapshot.location.timezone);
  const window = findMuhurtaWindow(snapshot.location, targetDate, "general", date);
  const panchanga = calculatePanchangaAt(date, snapshot.location);

  const factors: DailyFactor[] = [
    moonTransitFactor(moonHouse),
    jupiterTransitFactor(jupiterHouse),
    saturnTransitFactor(saturnHouse),
    dashaFactor(snapshot, dasha.mahadasha.lord, "mahadasha"),
    dashaFactor(snapshot, dasha.antardasha.lord, "antardasha"),
    panchangaFactor(panchanga),
    // Remaining-window status is advisory and must not make the headline drift intra-day.
    window
      ? factor("muhurta.window.available", "muhurta", "တွက်ချက်ထားသောအချိန်", `${window.horaLord} Hora အတွင်း Rahu Kalam မထိသော အချိန်ကို တွေ့ရှိထားသည်။`, {})
      : factor("muhurta.window.unavailable", "muhurta", "ယနေ့ကျန်ရှိချိန်", "ယနေ့အတွက် အနာဂတ်နေ့ခင်း Hora မကျန်တော့သဖြင့် အချိန်ကောင်းကို မခန့်မှန်းထားပါ။", {}),
  ];

  const categories = applyFactors(factors);
  const score = calculateOverallScore(categories);
  // These boundaries match the reachable v2 factor range rather than the wider category clamps.
  const band = bandFor(score);
  return {
    rulesetVersion: DAILY_RULESET_VERSION,
    score,
    band,
    favorableWindow: window?.label ?? "ယနေ့အတွက် ကျန်ရှိချိန် မတွေ့ပါ",
    window,
    categories,
    timingStatus: window ? "calculated" : "unavailable",
    panchanga,
    factors,
  };
}
