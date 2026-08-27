import { normalizeDegrees } from "./angles";

const J2000_MS = Date.UTC(2000, 0, 1, 12);
const JULIAN_CENTURY_MS = 36_525 * 86_400_000;

/** Mean ascending lunar node (Rahu), referred to the mean ecliptic of date. */
export function meanLunarNodes(instant: Date) {
  const centuries = (instant.valueOf() - J2000_MS) / JULIAN_CENTURY_MS;
  const rahu = normalizeDegrees(
    125.0445479
      - 1_934.1362891 * centuries
      + 0.0020754 * centuries ** 2
      + centuries ** 3 / 467_441
      - centuries ** 4 / 60_616_000,
  );
  return { rahu, ketu: normalizeDegrees(rahu + 180) };
}
