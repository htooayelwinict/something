import { calculateDailyInsight } from "@/lib/astrology/daily-score";
import { vimshottariAt } from "@/lib/astrology/dasha";
import { zodiacSigns, zodiacSignsMyanmar, type ChartSnapshot, type DailyCategoryScores, type DailyInsightData, type DashaPeriod } from "@/lib/astrology/types";
import { burmeseWeekdays } from "@/lib/content/booking-copy";
import { localNoonUtc, type Period, type PeriodKind } from "./period";

export type PeriodDay = {
  date: string;
  weekday: string;
  score: number;
  band: DailyInsightData["band"];
  categories: DailyCategoryScores;
  topFactorLabel: string;
  moonSignMy: string;
  moonHouse: number;
};

export type PeriodEvidence = {
  kind: PeriodKind;
  key: string;
  label: string;
  timezone: string;
  calculationVersion: string;
  rulesetVersion: string;
  natal: { ascendant: string; moonSign: string; moonSignMy: string };
  dasha: { mahadasha: DashaPeriod; antardasha: DashaPeriod; changeInside: { on: string; from: string; to: string } | null };
  transits: { jupiterSign: string; saturnSign: string; moonPath: Array<{ date: string; signMy: string; house: number }> };
  days: PeriodDay[];
  /** Daily only: the engine's factors verbatim. */
  factors?: DailyInsightData["factors"];
  summary: {
    averageScore: number;
    averageCategories: DailyCategoryScores;
    bestDays: string[];
    cautionDays: string[];
    dominantFactor: string;
  };
};

const categoryKeys: Array<keyof DailyCategoryScores> = ["career", "relationships", "focus", "energy", "caution"];

function weekdayOf(localDate: string) {
  return burmeseWeekdays[new Date(`${localDate}T12:00:00.000Z`).getUTCDay()];
}

function signFromHouse(natalMoonSignIndex: number, house: number) {
  return (natalMoonSignIndex + house - 1) % 12;
}

function houseOf(insight: DailyInsightData, prefix: string) {
  return insight.factors.find((factor) => factor.id.startsWith(prefix))?.house ?? 1;
}

function mostFrequent(labels: string[]) {
  const counts = new Map<string, number>();
  for (const label of labels) counts.set(label, (counts.get(label) ?? 0) + 1);
  return [...counts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? "";
}

export function buildPeriodEvidence(snapshot: ChartSnapshot, period: Period): PeriodEvidence {
  const natalMoon = snapshot.planets.find((planet) => planet.name === "Moon");
  if (!natalMoon) throw new Error("Natal Moon is required for period evidence");
  const birth = new Date(snapshot.instant);

  const evaluated = period.days.map((date) => {
    const instant = localNoonUtc(date, period.timezone);
    const insight = calculateDailyInsight(snapshot, instant);
    const dasha = vimshottariAt(natalMoon.longitude, birth, instant);
    return { date, instant, insight, dasha };
  });

  const days: PeriodDay[] = evaluated.map(({ date, insight }) => {
    const moonHouse = houseOf(insight, "transit.moon.");
    const transitFactor = insight.factors.find((factor) => factor.source === "transit");
    return {
      date,
      weekday: weekdayOf(date),
      score: insight.score,
      band: insight.band,
      categories: insight.categories,
      topFactorLabel: transitFactor?.label ?? insight.factors[0]?.label ?? "",
      moonSignMy: zodiacSignsMyanmar[signFromHouse(natalMoon.signIndex, moonHouse)],
      moonHouse,
    };
  });

  const first = evaluated[0];
  const last = evaluated[evaluated.length - 1];
  let changeInside: PeriodEvidence["dasha"]["changeInside"] = null;
  if (first.dasha.antardasha.lord !== last.dasha.antardasha.lord) {
    const changed = evaluated.find((day) => day.dasha.antardasha.lord !== first.dasha.antardasha.lord) ?? last;
    changeInside = { on: changed.date, from: first.dasha.antardasha.lord, to: changed.dasha.antardasha.lord };
  }

  const averageCategories = Object.fromEntries(
    categoryKeys.map((key) => [key, Math.round(days.reduce((sum, day) => sum + day.categories[key], 0) / days.length)]),
  ) as DailyCategoryScores;
  const byScore = [...days].sort((a, b) => b.score - a.score || a.date.localeCompare(b.date));
  const byCaution = [...days].sort((a, b) => b.categories.caution - a.categories.caution || a.date.localeCompare(b.date));

  return {
    kind: period.kind,
    key: period.key,
    label: period.label,
    timezone: period.timezone,
    calculationVersion: snapshot.version,
    rulesetVersion: first.insight.rulesetVersion,
    natal: { ascendant: snapshot.ascendant.sign, moonSign: natalMoon.sign, moonSignMy: zodiacSignsMyanmar[natalMoon.signIndex] },
    dasha: { mahadasha: first.dasha.mahadasha, antardasha: first.dasha.antardasha, changeInside },
    transits: {
      jupiterSign: zodiacSigns[signFromHouse(natalMoon.signIndex, houseOf(first.insight, "transit.jupiter."))],
      saturnSign: zodiacSigns[signFromHouse(natalMoon.signIndex, houseOf(first.insight, "transit.saturn."))],
      moonPath: days.map((day) => ({ date: day.date, signMy: day.moonSignMy, house: day.moonHouse })),
    },
    days,
    factors: period.kind === "daily" ? first.insight.factors : undefined,
    summary: {
      averageScore: Math.round(days.reduce((sum, day) => sum + day.score, 0) / days.length),
      averageCategories,
      bestDays: byScore.slice(0, Math.min(3, days.length)).map((day) => day.date),
      cautionDays: period.kind === "daily" ? [] : byCaution.slice(0, 2).map((day) => day.date),
      dominantFactor: mostFrequent(days.map((day) => day.topFactorLabel)),
    },
  };
}
