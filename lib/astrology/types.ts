import type { BirthProfileInput } from "@/lib/schemas/profile";
import type { NumerologySnapshot } from "@/lib/numerology/calculate";

export const CALCULATION_VERSION = "suriya-vedic-1";

export const zodiacSigns = [
  "Aries", "Taurus", "Gemini", "Cancer", "Leo", "Virgo",
  "Libra", "Scorpio", "Sagittarius", "Capricorn", "Aquarius", "Pisces",
] as const;

export const zodiacSignsMyanmar = [
  "မိဿ", "ပြိဿ", "မေထုန်", "ကရကဋ်", "သိဟ်", "ကန်",
  "တူ", "ဗြိစ္ဆာ", "ဓနု", "မကာရ", "ကုံ", "မိန်",
] as const;

export type ZodiacSign = (typeof zodiacSigns)[number];
export type PlanetName = "Sun" | "Moon" | "Mercury" | "Venus" | "Mars" | "Jupiter" | "Saturn" | "Uranus" | "Neptune" | "Pluto";

export type PlanetPosition = {
  name: PlanetName;
  tropicalLongitude: number;
  longitude: number;
  signIndex: number;
  sign: ZodiacSign;
  degreeInSign: number;
  house: number;
  retrograde: boolean;
};

export type Panchanga = {
  vara: string;
  tithi: { index: number; number: number; paksha: "Shukla" | "Krishna"; name: string };
  nakshatra: { index: number; name: string; pada: number };
  yoga: { index: number; name: string };
  karana: { index: number; name: string };
};

export type DashaPeriod = { lord: string; start: string; end: string };

export type ChartSnapshot = {
  version: typeof CALCULATION_VERSION;
  numerology: NumerologySnapshot;
  input: BirthProfileInput;
  instant: string;
  asOf: string;
  ayanamsa: number;
  ascendant: { tropicalLongitude: number; longitude: number; signIndex: number; sign: ZodiacSign; degreeInSign: number };
  planets: PlanetPosition[];
  houses: Array<{ house: number; signIndex: number; sign: ZodiacSign }>;
  panchanga: Panchanga;
  dasha: { mahadasha: DashaPeriod; antardasha: DashaPeriod };
  divisional: {
    d1: Record<PlanetName | "Ascendant", number>;
    d9: Record<PlanetName | "Ascendant", number>;
    d10: Record<PlanetName | "Ascendant", number>;
  };
};

export type DailyInsightData = {
  score: number;
  band: "quiet" | "steady" | "open" | "bright";
  favorableWindow: string;
  factors: string[];
};
