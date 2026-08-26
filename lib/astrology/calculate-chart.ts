import { Body, Ecliptic, GeoVector, MakeTime, SiderealTime, e_tilt } from "astronomy-engine";
import type { BirthProfileInput } from "@/lib/schemas/profile";
import { degreeInSign, normalizeDegrees, signIndex, signedAngularDelta } from "./angles";
import { lahiriAyanamsa, toSidereal } from "./ayanamsa";
import { vimshottariAt } from "./dasha";
import { d1Sign, d9Sign, d10Sign } from "./divisional";
import { calculatePanchanga } from "./panchanga";
import { localBirthToUtc } from "./time";
import { CALCULATION_VERSION, zodiacSigns, type ChartSnapshot, type PlanetName, type PlanetPosition } from "./types";

const bodies: Array<[PlanetName, Body]> = [
  ["Sun", Body.Sun], ["Moon", Body.Moon], ["Mercury", Body.Mercury], ["Venus", Body.Venus], ["Mars", Body.Mars],
  ["Jupiter", Body.Jupiter], ["Saturn", Body.Saturn], ["Uranus", Body.Uranus], ["Neptune", Body.Neptune], ["Pluto", Body.Pluto],
];

export function tropicalGeocentricLongitude(body: Body, instant: Date): number {
  return normalizeDegrees(Ecliptic(GeoVector(body, instant, true)).elon);
}

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

export function calculateChart(input: BirthProfileInput, asOf = new Date()): ChartSnapshot {
  const birth = localBirthToUtc(input);
  const ayanamsa = lahiriAyanamsa(birth);
  const tropicalAsc = tropicalAscendant(birth, input.latitude, input.longitude);
  const ascLongitude = toSidereal(tropicalAsc, birth);
  const ascSign = signIndex(ascLongitude);

  const planets: PlanetPosition[] = bodies.map(([name, body]) => {
    const tropicalLongitude = tropicalGeocentricLongitude(body, birth);
    const longitude = toSidereal(tropicalLongitude, birth);
    const planetSign = signIndex(longitude);
    return {
      name, tropicalLongitude, longitude, signIndex: planetSign, sign: zodiacSigns[planetSign],
      degreeInSign: degreeInSign(longitude), house: ((planetSign - ascSign + 12) % 12) + 1,
      retrograde: isRetrograde(body, birth),
    };
  });

  const sun = planets.find((planet) => planet.name === "Sun")!;
  const moon = planets.find((planet) => planet.name === "Moon")!;
  const placements = Object.fromEntries([...planets.map((planet) => [planet.name, planet.longitude]), ["Ascendant", ascLongitude]]) as Record<PlanetName | "Ascendant", number>;
  const mapDivision = (fn: (longitude: number) => number) => Object.fromEntries(Object.entries(placements).map(([key, longitude]) => [key, fn(longitude)])) as Record<PlanetName | "Ascendant", number>;

  return {
    version: CALCULATION_VERSION,
    input,
    instant: birth.toISOString(),
    asOf: asOf.toISOString(),
    ayanamsa,
    ascendant: {
      tropicalLongitude: tropicalAsc, longitude: ascLongitude, signIndex: ascSign,
      sign: zodiacSigns[ascSign], degreeInSign: degreeInSign(ascLongitude),
    },
    planets,
    houses: Array.from({ length: 12 }, (_, index) => ({ house: index + 1, signIndex: (ascSign + index) % 12, sign: zodiacSigns[(ascSign + index) % 12] })),
    panchanga: calculatePanchanga(sun.longitude, moon.longitude, birth, input.timezone),
    dasha: vimshottariAt(moon.longitude, birth, asOf),
    divisional: { d1: mapDivision(d1Sign), d9: mapDivision(d9Sign), d10: mapDivision(d10Sign) },
  };
}
