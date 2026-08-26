import { degreeInSign, normalizeDegrees, signIndex } from "./angles";

export function d1Sign(longitude: number): number {
  return signIndex(longitude);
}

export function d9Sign(longitude: number): number {
  return Math.floor(normalizeDegrees(longitude) / (30 / 9)) % 12;
}

export function d10Sign(longitude: number): number {
  const sign = signIndex(longitude);
  const segment = Math.min(9, Math.floor(degreeInSign(longitude) / 3));
  const start = sign % 2 === 0 ? sign : sign + 8;
  return (start + segment) % 12;
}
