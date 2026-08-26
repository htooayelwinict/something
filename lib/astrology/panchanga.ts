import { normalizeDegrees } from "./angles";
import type { Panchanga } from "./types";

export const nakshatraNames = [
  "Ashwini", "Bharani", "Krittika", "Rohini", "Mrigashira", "Ardra", "Punarvasu", "Pushya", "Ashlesha",
  "Magha", "Purva Phalguni", "Uttara Phalguni", "Hasta", "Chitra", "Swati", "Vishakha", "Anuradha", "Jyeshtha",
  "Mula", "Purva Ashadha", "Uttara Ashadha", "Shravana", "Dhanishta", "Shatabhisha", "Purva Bhadrapada", "Uttara Bhadrapada", "Revati",
] as const;

const tithiNames = ["Pratipada", "Dwitiya", "Tritiya", "Chaturthi", "Panchami", "Shashthi", "Saptami", "Ashtami", "Navami", "Dashami", "Ekadashi", "Dwadashi", "Trayodashi", "Chaturdashi", "Purnima"];
const yogaNames = ["Vishkambha", "Priti", "Ayushman", "Saubhagya", "Shobhana", "Atiganda", "Sukarma", "Dhriti", "Shula", "Ganda", "Vriddhi", "Dhruva", "Vyaghata", "Harshana", "Vajra", "Siddhi", "Vyatipata", "Variyana", "Parigha", "Shiva", "Siddha", "Sadhya", "Shubha", "Shukla", "Brahma", "Indra", "Vaidhriti"];
const repeatingKaranas = ["Bava", "Balava", "Kaulava", "Taitila", "Garaja", "Vanija", "Vishti"];
const varaNames = ["တနင်္ဂနွေ", "တနင်္လာ", "အင်္ဂါ", "ဗုဒ္ဓဟူး", "ကြာသပတေး", "သောကြာ", "စနေ"];

export function calculateTithi(sunLongitude: number, moonLongitude: number): Panchanga["tithi"] {
  const index = Math.floor(normalizeDegrees(moonLongitude - sunLongitude) / 12);
  const paksha = index < 15 ? "Shukla" : "Krishna";
  const withinPaksha = index % 15;
  const name = withinPaksha === 14 && paksha === "Krishna" ? "Amavasya" : tithiNames[withinPaksha];
  return { index, number: withinPaksha + 1, paksha, name };
}

export function calculateNakshatra(moonLongitude: number): Panchanga["nakshatra"] {
  const segment = 360 / 27;
  const normalized = normalizeDegrees(moonLongitude);
  const index = Math.floor(normalized / segment);
  const pada = Math.floor((normalized - index * segment) / (segment / 4)) + 1;
  return { index, name: nakshatraNames[index], pada: Math.min(4, pada) };
}

export function calculateYoga(sunLongitude: number, moonLongitude: number): Panchanga["yoga"] {
  const index = Math.floor(normalizeDegrees(sunLongitude + moonLongitude) / (360 / 27));
  return { index, name: yogaNames[index] };
}

export function calculateKarana(sunLongitude: number, moonLongitude: number): Panchanga["karana"] {
  const index = Math.floor(normalizeDegrees(moonLongitude - sunLongitude) / 6);
  let name: string;
  if (index === 0) name = "Kimstughna";
  else if (index >= 57) name = ["Shakuni", "Chatushpada", "Naga"][index - 57];
  else name = repeatingKaranas[(index - 1) % repeatingKaranas.length];
  return { index, name };
}

export function weekdayInTimezone(instant: Date, timezone: string): string {
  const weekday = new Intl.DateTimeFormat("en-US", { timeZone: timezone, weekday: "short" }).format(instant);
  const index = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].indexOf(weekday);
  return varaNames[Math.max(0, index)];
}

export function calculatePanchanga(sunLongitude: number, moonLongitude: number, instant: Date, timezone: string): Panchanga {
  return {
    vara: weekdayInTimezone(instant, timezone),
    tithi: calculateTithi(sunLongitude, moonLongitude),
    nakshatra: calculateNakshatra(moonLongitude),
    yoga: calculateYoga(sunLongitude, moonLongitude),
    karana: calculateKarana(sunLongitude, moonLongitude),
  };
}
