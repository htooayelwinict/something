import { Body } from "astronomy-engine";
import { angularSeparation } from "./angles";
import { lahiriAyanamsa } from "./ayanamsa";
import { tropicalGeocentricLongitude } from "./calculate-chart";
import type { ChartSnapshot, DailyInsightData, PlanetName } from "./types";

function near(angle: number, target: number, orb: number) {
  return Math.abs(angle - target) <= orb;
}

function position(snapshot: ChartSnapshot, name: PlanetName) {
  return snapshot.planets.find((planet) => planet.name === name)!.longitude;
}

export function calculateDailyInsight(snapshot: ChartSnapshot, date: Date): DailyInsightData {
  const ayanamsa = lahiriAyanamsa(date);
  const transit = (body: Body) => ((tropicalGeocentricLongitude(body, date) - ayanamsa) % 360 + 360) % 360;
  const moon = transit(Body.Moon);
  const jupiter = transit(Body.Jupiter);
  const saturn = transit(Body.Saturn);
  let score = 58;
  const factors: string[] = [];

  const moonAngle = angularSeparation(moon, position(snapshot, "Moon"));
  if ([0, 60, 120].some((target) => near(moonAngle, target, 8))) { score += 12; factors.push("လ၏စီးဆင်းမှုက စိတ်ပိုင်းရှင်းလင်းမှုကို အားပေးနေပါတယ်။"); }
  if ([90, 180].some((target) => near(moonAngle, target, 7))) { score -= 9; factors.push("လ၏ဖိအားကြောင့် တုံ့ပြန်မှုမပြုမီ ခဏရပ်ရန် ကောင်းပါတယ်။"); }

  const jupiterAngle = angularSeparation(jupiter, position(snapshot, "Sun"));
  if ([0, 60, 120].some((target) => near(jupiterAngle, target, 7))) { score += 9; factors.push("ဂုရုဂြိုဟ်က သင်ယူမှုနှင့် အခွင့်အလမ်းအမြင်ကို ချဲ့ပေးနေပါတယ်။"); }

  const saturnAngle = angularSeparation(saturn, position(snapshot, "Moon"));
  if ([90, 180].some((target) => near(saturnAngle, target, 6))) { score -= 10; factors.push("စနေဂြိုဟ်အနေအထားက နှေးကွေးပြီး စနစ်တကျ လုပ်ဆောင်ရန် တိုက်တွန်းပါတယ်။"); }
  else if ([60, 120].some((target) => near(saturnAngle, target, 6))) { score += 5; factors.push("စနေဂြိုဟ်က အာရုံစိုက်မှုနှင့် တည်တံ့မှုကို ကူညီနေပါတယ်။"); }

  score = Math.max(20, Math.min(95, Math.round(score)));
  if (factors.length === 0) factors.push("နေ့၏စွမ်းအင်က မျှတနေပြီး ပုံမှန်အရှိန်ဖြင့် ဆက်သွားရန် ကောင်းပါတယ်။");
  const band = score < 45 ? "quiet" : score < 65 ? "steady" : score < 82 ? "open" : "bright";
  const startHour = 8 + ((Math.floor(moon / 30) + date.getUTCDay()) % 5);
  const endHour = startHour + 1;
  return { score, band, favorableWindow: `${String(startHour).padStart(2, "0")}:20–${String(endHour).padStart(2, "0")}:50`, factors };
}
