import { bandFor } from "@/lib/astrology/daily-score";
import { toBurmeseDigits } from "@/lib/content/burmese-digits";
import { dailyCopy } from "@/lib/content/daily-copy";
import { planetLabel } from "@/lib/content/chart-view";
import type { PeriodDay, PeriodEvidence } from "./period-evidence";

function dayLabel(day: PeriodDay) {
  return `${day.weekday} (${toBurmeseDigits(Number(day.date.slice(-2)))} ရက်)`;
}

function findDay(evidence: PeriodEvidence, date: string) {
  return evidence.days.find((day) => day.date === date)!;
}

function dashaLine(evidence: PeriodEvidence) {
  const { mahadasha, antardasha, changeInside } = evidence.dasha;
  const base = `ဒဿာအရ ${planetLabel(mahadasha.lord)} မဟာဒဿာအတွင်း ${planetLabel(antardasha.lord)} အန္တရဒဿာ ဖြစ်နေသဖြင့် ထိုဂြိုဟ်နှစ်လုံး၏ သဘောကို ဤကာလ၏ နောက်ခံအဖြစ် ထည့်သွင်းစဉ်းစားပါ။`;
  if (!changeInside) return base;
  const day = findDay(evidence, changeInside.on);
  return `${base} ${dayLabel(day)} တွင် အန္တရဒဿာသည် ${planetLabel(changeInside.from)} မှ ${planetLabel(changeInside.to)} သို့ ပြောင်းလဲမည်ဖြစ်၍ ထိုနေ့ဝန်းကျင်တွင် အရှိန်ပြောင်းလဲမှုကို သတိပြုပါ။`;
}

function transitLine(evidence: PeriodEvidence) {
  const path = evidence.transits.moonPath;
  const signs = [...new Set(path.map((step) => step.signMy))];
  return `ဤကာလအတွင်း လသည် ${signs.join("၊ ")} ရာသီများကို ဖြတ်သန်းမည်ဖြစ်ပြီး ကြာသပတေးသည် ${evidence.transits.jupiterSign}၊ စနေသည် ${evidence.transits.saturnSign} တွင် ရှိနေပါသည်။ ${evidence.summary.dominantFactor ? `အများဆုံး ထပ်ခါပေါ်လာသော အချက်မှာ "${evidence.summary.dominantFactor}" ဖြစ်သည်။` : ""}`.trim();
}

function overview(evidence: PeriodEvidence) {
  const copy = dailyCopy(bandFor(evidence.summary.averageScore));
  const scope = evidence.kind === "daily" ? "ယနေ့" : evidence.kind === "weekly" ? "ဤအပတ်" : "ဤလ";
  return `${scope} (${evidence.label}) ၏ ပျမ်းမျှစွမ်းအင်အညွှန်းမှာ ${toBurmeseDigits(evidence.summary.averageScore)} ဖြစ်ပြီး ${copy.energy} သဘော ဆောင်ပါသည်။ ${copy.summary}`;
}

function action(evidence: PeriodEvidence) {
  const best = findDay(evidence, evidence.summary.bestDays[0]);
  if (evidence.kind === "daily") return "လက်တွေ့လုပ်ဆောင်ရန် — ယနေ့ အရေးကြီးဆုံး အလုပ်တစ်ခုကို တွက်ချက်ထားသော သင့်လျော်ချိန်အတွင်း ဦးစားပေး လုပ်ဆောင်ပါ။";
  return `လက်တွေ့လုပ်ဆောင်ရန် — အရေးကြီးသော စတင်မှု သို့မဟုတ် ဆွေးနွေးမှုကို ${dayLabel(best)} တွင် စီစဉ်ပြီး သတိထားရမည့်ရက်များတွင် အလျင်စလို မဆုံးဖြတ်ပါနှင့်။`;
}

export function buildDeterministicPeriodReading(evidence: PeriodEvidence): string {
  const paragraphs: string[] = [overview(evidence)];
  if (evidence.kind === "daily") {
    for (const factor of (evidence.factors ?? []).slice(0, 3)) paragraphs.push(`${factor.label} — ${factor.description}`);
  } else {
    paragraphs.push(dashaLine(evidence), transitLine(evidence));
  }
  if (evidence.kind === "weekly") {
    const best = evidence.summary.bestDays.map((date) => findDay(evidence, date)).map((day) => `${dayLabel(day)} · အမှတ် ${toBurmeseDigits(day.score)}`).join("၊ ");
    const caution = evidence.summary.cautionDays.map((date) => findDay(evidence, date)).map(dayLabel).join("၊ ");
    paragraphs.push(`ရက်အလိုက် — အထောက်အကူဖြစ်နိုင်ဆုံးရက်များမှာ ${best} ဖြစ်ပြီး ${caution} တို့တွင် သတိအမှတ် မြင့်နေသဖြင့် ဖြည်းဖြည်းချင်း ဆောင်ရွက်ပါ။`);
  }
  if (evidence.kind === "monthly") {
    for (let index = 0; index < evidence.days.length; index += 7) {
      const week = evidence.days.slice(index, index + 7);
      const average = Math.round(week.reduce((sum, day) => sum + day.score, 0) / week.length);
      const best = [...week].sort((a, b) => b.score - a.score)[0];
      paragraphs.push(`ရက်သတ္တပတ် ${toBurmeseDigits(index / 7 + 1)} (${toBurmeseDigits(Number(week[0].date.slice(-2)))}–${toBurmeseDigits(Number(week[week.length - 1].date.slice(-2)))} ရက်) — ပျမ်းမျှအမှတ် ${toBurmeseDigits(average)}၊ အကောင်းဆုံးရက်မှာ ${dayLabel(best)} ဖြစ်သည်။`);
    }
  }
  paragraphs.push(action(evidence));
  return paragraphs.join("\n\n");
}
