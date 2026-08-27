import { Body, MakeTime, SiderealTime, e_tilt } from "astronomy-engine";
import type { BirthProfileInput } from "@/lib/schemas/profile";
import { degreeInSign, normalizeDegrees, signIndex, signedAngularDelta } from "./angles";
import { lahiriAyanamsa, toSidereal } from "./ayanamsa";
import { vimshottariAt } from "./dasha";
import { d1Sign, d9Sign, d10Sign } from "./divisional";
import { calculatePanchanga } from "./panchanga";
import { localBirthToUtc } from "./time";
import { meanLunarNodes } from "./nodes";
import { tropicalGeocentricLongitude } from "./ephemeris";
import {
  CALCULATION_VERSION,
  zodiacSigns,
  type CelestialChart,
  type ChartLocation,
  type ChartRole,
  type ChartSnapshot,
  type PlanetCategory,
  type PlanetName,
  type PlanetPosition,
} from "./types";
import { calculateNumerology } from "@/lib/numerology/calculate";

type PhysicalPlanetName = Exclude<PlanetName, "Rahu" | "Ketu">;

const bodies: Array<[PhysicalPlanetName, Body, PlanetCategory]> = [
  ["Sun", Body.Sun, "classical"], ["Moon", Body.Moon, "classical"], ["Mercury", Body.Mercury, "classical"],
  ["Venus", Body.Venus, "classical"], ["Mars", Body.Mars, "classical"], ["Jupiter", Body.Jupiter, "classical"],
  ["Saturn", Body.Saturn, "classical"], ["Uranus", Body.Uranus, "outer"], ["Neptune", Body.Neptune, "outer"],
  ["Pluto", Body.Pluto, "outer"],
];

const metadata = {
  ephemeris: "astronomy-engine-2.1",
  ayanamsa: "lahiri-chitrapaksha",
  ayanamsaVersion: "suriya-lahiri-1",
  houseSystem: "whole-sign",
  nodeMode: "mean",
  dashaYear: "tropical-365.2425-days",
} as const;

export { tropicalGeocentricLongitude } from "./ephemeris";

export function tropicalAscendant(instant: Date, latitude: number, longitude: number): number {
  const localSidereal = normalizeDegrees(SiderealTime(instant) * 15 + longitude) * Math.PI / 180;
  const obliquity = e_tilt(MakeTime(instant)).tobl * Math.PI / 180;
  const lat = latitude * Math.PI / 180;
  const raw = Math.atan2(
    -Math.cos(localSidereal),
    Math.sin(localSidereal) * Math.cos(obliquity) + Math.tan(lat) * Math.sin(obliquity),
  ) * 180 / Math.PI;
  return normalizeDegrees(raw + 180);
}

function isRetrograde(body: Body, instant: Date) {
  if (body === Body.Sun || body === Body.Moon) return false;
  const span = 6 * 60 * 60 * 1000;
  const before = tropicalGeocentricLongitude(body, new Date(instant.valueOf() - span));
  const after = tropicalGeocentricLongitude(body, new Date(instant.valueOf() + span));
  return signedAngularDelta(after, before) < 0;
}

export function calculateCelestialChart(
  instant: Date,
  location: ChartLocation,
  role: ChartRole,
  asOf = instant,
): CelestialChart {
  const ayanamsa = lahiriAyanamsa(instant);
  const tropicalAsc = tropicalAscendant(instant, location.latitude, location.longitude);
  const ascLongitude = toSidereal(tropicalAsc, instant);
  const ascSign = signIndex(ascLongitude);

  const positionFromLongitude = (
    name: PlanetName,
    tropicalLongitude: number,
    retrograde: boolean,
    category: PlanetCategory,
  ): PlanetPosition => {
    const longitude = toSidereal(tropicalLongitude, instant);
    const planetSign = signIndex(longitude);
    return {
      name, tropicalLongitude, longitude, signIndex: planetSign, sign: zodiacSigns[planetSign],
      degreeInSign: degreeInSign(longitude), house: ((planetSign - ascSign + 12) % 12) + 1,
      retrograde, category,
    };
  };

  const physicalPlanets = bodies.map(([name, body, category]) => positionFromLongitude(
    name,
    tropicalGeocentricLongitude(body, instant),
    isRetrograde(body, instant),
    category,
  ));
  const nodes = meanLunarNodes(instant);
  const planets: PlanetPosition[] = [
    ...physicalPlanets.slice(0, 7),
    positionFromLongitude("Rahu", nodes.rahu, true, "node"),
    positionFromLongitude("Ketu", nodes.ketu, true, "node"),
    ...physicalPlanets.slice(7),
  ];

  const sun = planets.find((planet) => planet.name === "Sun")!;
  const moon = planets.find((planet) => planet.name === "Moon")!;
  const placements = Object.fromEntries([...planets.map((planet) => [planet.name, planet.longitude]), ["Ascendant", ascLongitude]]) as Record<PlanetName | "Ascendant", number>;
  const mapDivision = (fn: (longitude: number) => number) => Object.fromEntries(Object.entries(placements).map(([key, longitude]) => [key, fn(longitude)])) as Record<PlanetName | "Ascendant", number>;

  return {
    version: CALCULATION_VERSION,
    role,
    metadata,
    location,
    instant: instant.toISOString(),
    asOf: asOf.toISOString(),
    ayanamsa,
    ascendant: {
      tropicalLongitude: tropicalAsc, longitude: ascLongitude, signIndex: ascSign,
      sign: zodiacSigns[ascSign], degreeInSign: degreeInSign(ascLongitude),
    },
    planets,
    houses: Array.from({ length: 12 }, (_, index) => ({ house: index + 1, signIndex: (ascSign + index) % 12, sign: zodiacSigns[(ascSign + index) % 12] })),
    panchanga: calculatePanchanga(sun.longitude, moon.longitude, instant, location.timezone),
    divisional: { d1: mapDivision(d1Sign), d9: mapDivision(d9Sign), d10: mapDivision(d10Sign) },
  };
}

export function calculateChart(input: BirthProfileInput, asOf = new Date()): ChartSnapshot {
  const birth = localBirthToUtc(input);
  const location: ChartLocation = {
    label: input.birthCity,
    latitude: input.latitude,
    longitude: input.longitude,
    timezone: input.timezone,
  };
  const chart = calculateCelestialChart(birth, location, "natal", asOf);
  const moon = chart.planets.find((planet) => planet.name === "Moon")!;
  return {
    ...chart,
    role: "natal",
    numerology: calculateNumerology(input.birthDate),
    input,
    dasha: vimshottariAt(moon.longitude, birth, asOf),
  };
}
