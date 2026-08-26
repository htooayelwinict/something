export const NUMEROLOGY_VERSION = "suriya-numerology-1" as const;

export type NumerologySnapshot = {
  version: typeof NUMEROLOGY_VERSION;
  lifePath: number;
  birthNumber: number;
  attitudeNumber: number;
};

function reduceNumber(value: number): number {
  let current = Math.abs(Math.trunc(value));
  while (current > 9) {
    current = String(current)
      .split("")
      .reduce((sum, digit) => sum + Number(digit), 0);
  }
  return current;
}

export function calculateNumerology(birthDate: string): NumerologySnapshot {
  const [year, month, day] = birthDate.split("-").map(Number);
  const dateDigits = [
    ...String(year),
    ...String(month).padStart(2, "0"),
    ...String(day).padStart(2, "0"),
  ];

  return {
    version: NUMEROLOGY_VERSION,
    lifePath: reduceNumber(dateDigits.reduce((sum, digit) => sum + Number(digit), 0)),
    birthNumber: reduceNumber(day),
    attitudeNumber: reduceNumber(month + day),
  };
}
