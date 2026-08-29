/** Pure helpers behind the observatory motifs (moon phase, zodiac glyphs, star field). */

export const zodiacGlyphs = ["♈", "♉", "♊", "♋", "♌", "♍", "♎", "♏", "♐", "♑", "♒", "♓"] as const;

export function zodiacGlyph(signIndex: number): string {
  return zodiacGlyphs[((signIndex % 12) + 12) % 12];
}

/** Lit fraction of the Moon from the tithi: Shukla waxes 0→1, Krishna wanes 1→0. */
export function moonPhaseFraction(tithi: { number: number; paksha: "Shukla" | "Krishna" }): number {
  const n = Math.min(15, Math.max(1, tithi.number));
  return tithi.paksha === "Shukla" ? n / 15 : 1 - n / 15;
}

export type Star = { x: number; y: number; r: number; twinkle: boolean };

/** Mulberry32 — small seeded PRNG so server and client render the same sky. */
function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function starFieldPoints(seed: number, count: number): Star[] {
  const random = mulberry32(seed);
  return Array.from({ length: count }, () => {
    const size = random();
    return {
      x: Math.round(random() * 1000) / 10,
      y: Math.round(random() * 1000) / 10,
      r: size < 0.75 ? 0.6 : size < 0.95 ? 1 : 1.6,
      twinkle: random() < 0.25,
    };
  });
}
