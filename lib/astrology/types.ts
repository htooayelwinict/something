import type { BirthProfileInput } from "@/lib/schemas/profile";
import type { NumerologySnapshot } from "@/lib/numerology/calculate";

export const CALCULATION_VERSION = "suriya-vedic-2" as const;

export const zodiacSigns = [
  "Aries", "Taurus", "Gemini", "Cancer", "Leo", "Virgo",
  "Libra", "Scorpio", "Sagittarius", "Capricorn", "Aquarius", "Pisces",
] as const;

export const zodiacSignsMyanmar = [
  "မိဿ", "ပြိဿ", "မေထုန်", "ကရကဋ်", "သိဟ်", "ကန်",
  "တူ", "ဗြိစ္ဆာ", "ဓနု", "မကာရ", "ကုံ", "မိန်",
] as const;

export type ZodiacSign = (typeof zodiacSigns)[number];
export type PlanetName = "Sun" | "Moon" | "Mercury" | "Venus" | "Mars" | "Jupiter" | "Saturn" | "Rahu" | "Ketu" | "Uranus" | "Neptune" | "Pluto";
export type PlanetCategory = "classical" | "node" | "outer";
export type ChartRole = "natal" | "question" | "election" | "transit";

export type ChartLocation = {
  label: string;
  latitude: number;
  longitude: number;
  timezone: string;
};

export type CalculationMetadata = {
  ephemeris: "astronomy-engine-2.1";
  ayanamsa: "lahiri-chitrapaksha";
  ayanamsaVersion: "suriya-lahiri-1";
  houseSystem: "whole-sign";
  nodeMode: "mean";
};

export type PlanetPosition = {
  name: PlanetName;
  tropicalLongitude: number;
  longitude: number;
  signIndex: number;
  sign: ZodiacSign;
  degreeInSign: number;
  house: number;
  retrograde: boolean;
  category: PlanetCategory;
};

export type Panchanga = {
  vara: string;
  tithi: { index: number; number: number; paksha: "Shukla" | "Krishna"; name: string };
  nakshatra: { index: number; name: string; pada: number };
  yoga: { index: number; name: string };
  karana: { index: number; name: string };
};

export type DashaPeriod = { lord: string; start: string; end: string };

export type MuhurtaEventType = "general" | "work" | "relationship" | "travel";
export type TimeInterval = { start: string; end: string };
export type MuhurtaReason = { id: string; label: string; delta: number };
export type MuhurtaWindow = TimeInterval & {
  label: string;
  timezone: string;
  eventType: MuhurtaEventType;
  horaLord: "Sun" | "Moon" | "Mars" | "Mercury" | "Jupiter" | "Venus" | "Saturn";
  score: number;
  reasons: MuhurtaReason[];
  sunrise: string;
  sunset: string;
  rahuKalam: TimeInterval;
  panchanga: Panchanga;
  rulesetVersion: "suriya-muhurta-2";
};

export type CelestialChart = {
  version: typeof CALCULATION_VERSION;
  role: ChartRole;
  metadata: CalculationMetadata;
  location: ChartLocation;
  instant: string;
  asOf: string;
  ayanamsa: number;
  ascendant: { tropicalLongitude: number; longitude: number; signIndex: number; sign: ZodiacSign; degreeInSign: number };
  planets: PlanetPosition[];
  houses: Array<{ house: number; signIndex: number; sign: ZodiacSign }>;
  panchanga: Panchanga;
  divisional: {
    d1: Record<PlanetName | "Ascendant", number>;
    d9: Record<PlanetName | "Ascendant", number>;
    d10: Record<PlanetName | "Ascendant", number>;
  };
};

export type ChartSnapshot = CelestialChart & {
  role: "natal";
  numerology: NumerologySnapshot;
  input: BirthProfileInput;
  dasha: { mahadasha: DashaPeriod; antardasha: DashaPeriod };
};

export type DailyCategoryScores = {
  career: number;
  relationships: number;
  focus: number;
  energy: number;
  caution: number;
};

export type DailyFactor = {
  id: string;
  source: "transit" | "dasha" | "panchanga" | "muhurta";
  label: string;
  description: string;
  impacts: Partial<Record<keyof DailyCategoryScores, number>>;
};

export type DailyInsightData = {
  rulesetVersion: "suriya-daily-2";
  score: number;
  band: "quiet" | "steady" | "open" | "bright";
  favorableWindow: string;
  window: MuhurtaWindow | null;
  categories: DailyCategoryScores;
  confidence: "medium" | "high";
  factors: DailyFactor[];
};
