import { normalizeDegrees } from "./angles";

const J2000_MS = Date.UTC(2000, 0, 1, 12);
const JULIAN_CENTURY_MS = 36525 * 86_400_000;

/** Lahiri/Chitrapaksha ayanamsa approximation, suitable for the MVP display precision. */
export function lahiriAyanamsa(instant: Date): number {
  const centuries = (instant.valueOf() - J2000_MS) / JULIAN_CENTURY_MS;
  return 23.85675 + 1.396042 * centuries + 0.000087 * centuries * centuries;
}

export function toSidereal(tropicalLongitude: number, instant: Date): number {
  return normalizeDegrees(tropicalLongitude - lahiriAyanamsa(instant));
}
