import { Body, Ecliptic, GeoVector } from "astronomy-engine";
import { normalizeDegrees } from "./angles";

export function tropicalGeocentricLongitude(body: Body, instant: Date): number {
  return normalizeDegrees(Ecliptic(GeoVector(body, instant, true)).elon);
}
