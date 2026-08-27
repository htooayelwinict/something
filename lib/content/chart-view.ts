import type {
  CelestialChart,
  ChartSnapshot,
  DailyFactor,
  DashaPeriod,
  PlanetCategory,
  PlanetName,
} from "@/lib/astrology/types";
import { zodiacSigns, zodiacSignsMyanmar } from "@/lib/astrology/types";

export type Division = "d1" | "d9" | "d10";

export const divisionCopy: Record<Division, { code: string; nameMy: string; nameEn: string; purpose: string }> = {
  d1: { code: "D1", nameMy: "ရာသီ", nameEn: "Rasi", purpose: "မွေးဇာတာ၏ အခြေခံအနေအထား" },
  d9: { code: "D9", nameMy: "နဝံသ", nameEn: "Navamsa", purpose: "ဆက်ဆံရေးနှင့် အတွင်းစိတ်အားကို ကြည့်ရန်" },
  d10: { code: "D10", nameMy: "ဒသံသ", nameEn: "Dasamsa", purpose: "အလုပ်အကိုင်နှင့် တာဝန်ကို ကြည့်ရန်" },
};

const planetNamesMy: Record<PlanetName, string> = {
  Sun: "နေ", Moon: "လ", Mars: "အင်္ဂါ", Mercury: "ဗုဒ္ဓဟူး", Jupiter: "ကြာသပတေး", Venus: "သောကြာ", Saturn: "စနေ",
  Rahu: "ရာဟု", Ketu: "ကိတ်", Uranus: "ယူရေးနပ်စ်", Neptune: "နက်ပကျွန်း", Pluto: "ပလူတို",
};

const planetAbbreviations: Record<PlanetName, string> = {
  Sun: "Su", Moon: "Mo", Mars: "Ma", Mercury: "Me", Jupiter: "Ju", Venus: "Ve", Saturn: "Sa",
  Rahu: "Ra", Ketu: "Ke", Uranus: "Ur", Neptune: "Ne", Pluto: "Pl",
};

export function planetLabel(name: string): string {
  return planetNamesMy[name as PlanetName] ?? name;
}

export function planetAbbreviation(name: string): string {
  return planetAbbreviations[name as PlanetName] ?? name.slice(0, 2);
}

export function formatDegree(degreeInSign: number): string {
  const whole = Math.floor(degreeInSign);
  const minutes = Math.floor((degreeInSign - whole) * 60);
  return `${whole}°${String(minutes).padStart(2, "0")}′`;
}

export type ChartPlacement = {
  name: PlanetName;
  label: string;
  abbreviation: string;
  degree: string | null;
  retrograde: boolean;
  category: PlanetCategory;
};

export type ChartCell = {
  signIndex: number;
  sign: string;
  signMy: string;
  house: number;
  isLagna: boolean;
  placements: ChartPlacement[];
};

export function buildChartCells(chart: CelestialChart, division: Division): ChartCell[] {
  const placements = chart.divisional[division];
  const lagnaSign = placements.Ascendant;
  return Array.from({ length: 12 }, (_, signIndex) => ({
    signIndex,
    sign: zodiacSigns[signIndex],
    signMy: zodiacSignsMyanmar[signIndex],
    house: ((signIndex - lagnaSign + 12) % 12) + 1,
    isLagna: signIndex === lagnaSign,
    placements: chart.planets
      .filter((planet) => planet.category !== "outer" && placements[planet.name] === signIndex)
      .map((planet) => ({
        name: planet.name,
        label: planetLabel(planet.name),
        abbreviation: planetAbbreviation(planet.name),
        degree: division === "d1" ? `${Math.floor(planet.degreeInSign)}°` : null,
        retrograde: planet.retrograde,
        category: planet.category,
      })),
  }));
}

export function isNatalSnapshot(chart: CelestialChart): chart is ChartSnapshot {
  return "dasha" in chart && "input" in chart;
}

export function chartKeyFacts(chart: CelestialChart) {
  const moon = chart.planets.find((planet) => planet.name === "Moon");
  const dasha = isNatalSnapshot(chart) ? chart.dasha : null;
  return {
    lagna: {
      sign: chart.ascendant.sign,
      signMy: zodiacSignsMyanmar[chart.ascendant.signIndex],
      degree: formatDegree(chart.ascendant.degreeInSign),
    },
    moon: moon
      ? {
        sign: moon.sign,
        signMy: zodiacSignsMyanmar[moon.signIndex],
        house: moon.house,
        nakshatra: chart.panchanga.nakshatra.name,
        pada: chart.panchanga.nakshatra.pada,
      }
      : null,
    dasha: dasha
      ? {
        mahadasha: planetLabel(dasha.mahadasha.lord),
        antardasha: planetLabel(dasha.antardasha.lord),
        antardashaEnd: formatPeriodDate(dasha.antardasha.end),
      }
      : null,
  };
}

function formatPeriodDate(iso: string): string {
  return new Intl.DateTimeFormat("my-MM", { year: "numeric", month: "short" }).format(new Date(iso));
}

function formatLocalInstant(iso: string, timezone: string): string {
  return new Intl.DateTimeFormat("my-MM", {
    timeZone: timezone, year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit",
  }).format(new Date(iso));
}

export function chartBirthLabel(chart: CelestialChart): string {
  if (isNatalSnapshot(chart)) {
    return `${chart.input.birthDate} · ${chart.input.birthTime} · ${chart.input.birthCity}`;
  }
  return `${formatLocalInstant(chart.instant, chart.location.timezone)} · ${chart.location.label}`;
}

export function dashaTimeline(dasha: { mahadasha: DashaPeriod; antardasha: DashaPeriod }, now: Date) {
  const start = Date.parse(dasha.mahadasha.start);
  const end = Date.parse(dasha.mahadasha.end);
  const span = Math.max(1, end - start);
  const clamp = (value: number) => Math.min(1, Math.max(0, value));
  return {
    mahadashaLabel: `${planetLabel(dasha.mahadasha.lord)} မဟာဒဿာ`,
    antardashaLabel: `${planetLabel(dasha.antardasha.lord)} အန္တရဒဿာ`,
    startLabel: formatPeriodDate(dasha.mahadasha.start),
    endLabel: formatPeriodDate(dasha.mahadasha.end),
    antarStartLabel: formatPeriodDate(dasha.antardasha.start),
    antarEndLabel: formatPeriodDate(dasha.antardasha.end),
    progress: clamp((now.valueOf() - start) / span),
    antarStart: clamp((Date.parse(dasha.antardasha.start) - start) / span),
    antarEnd: clamp((Date.parse(dasha.antardasha.end) - start) / span),
  };
}

const factorSourceCopy: Record<DailyFactor["source"], string> = {
  transit: "ဂြိုဟ်ရွေ့လျားမှု (ဂေါစရ)",
  dasha: "လက်ရှိ ဒဿာကာလ",
  panchanga: "ယနေ့ Panchanga",
  muhurta: "အချိန်တွက်ချက်မှု",
};

export function groupDailyFactors(factors: Pick<DailyFactor, "id" | "source" | "label" | "description" | "house">[]) {
  const order: DailyFactor["source"][] = ["transit", "dasha", "panchanga", "muhurta"];
  return order
    .map((source) => ({ source, label: factorSourceCopy[source], factors: factors.filter((factor) => factor.source === source) }))
    .filter((group) => group.factors.length > 0);
}

const transitPlanetByRule: Array<[string, PlanetName]> = [
  ["transit.moon", "Moon"],
  ["transit.jupiter", "Jupiter"],
  ["transit.saturn", "Saturn"],
];

const transitChipLabels: Partial<Record<PlanetName, string>> = {
  Moon: "လ",
  Jupiter: "ဂုရု",
  Saturn: "စနေ",
};

export type TodayHighlight = {
  planet: PlanetName;
  label: string;
  ariaLabel: string;
  signIndex: number;
  houseFromMoon: number;
};

/** Maps the daily transit factors (houses counted from the natal Moon) onto natal chart signs. */
export function todayHighlights(chart: CelestialChart, factors: Pick<DailyFactor, "id" | "house">[]): TodayHighlight[] {
  const moon = chart.planets.find((planet) => planet.name === "Moon");
  if (!moon) return [];
  return transitPlanetByRule.flatMap(([prefix, planet]) => {
    const factor = factors.find((item) => item.id.startsWith(prefix));
    if (!factor || factor.house === undefined) return [];
    return [{
      planet,
      label: transitChipLabels[planet] ?? planetAbbreviation(planet),
      ariaLabel: `ယနေ့ ${planetLabel(planet)}`,
      signIndex: (moon.signIndex + factor.house - 1) % 12,
      houseFromMoon: factor.house,
    }];
  });
}
