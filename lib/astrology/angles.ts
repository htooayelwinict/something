export function normalizeDegrees(value: number): number {
  if (!Number.isFinite(value)) throw new Error("Angle must be finite");
  return ((value % 360) + 360) % 360;
}

export function signIndex(longitude: number): number {
  return Math.floor(normalizeDegrees(longitude) / 30);
}

export function degreeInSign(longitude: number): number {
  return normalizeDegrees(longitude) % 30;
}

export function signedAngularDelta(to: number, from: number): number {
  return ((normalizeDegrees(to) - normalizeDegrees(from) + 540) % 360) - 180;
}

export function angularSeparation(a: number, b: number): number {
  return Math.abs(signedAngularDelta(a, b));
}
