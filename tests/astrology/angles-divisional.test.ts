import { describe, expect, it } from "vitest";
import { degreeInSign, normalizeDegrees, signIndex, signedAngularDelta } from "@/lib/astrology/angles";
import { d9Sign, d10Sign } from "@/lib/astrology/divisional";

describe("angle utilities", () => {
  it("normalizes and classifies boundary angles", () => {
    expect(normalizeDegrees(-1)).toBe(359);
    expect(normalizeDegrees(720)).toBe(0);
    expect(signIndex(29.999)).toBe(0);
    expect(signIndex(30)).toBe(1);
    expect(degreeInSign(390.5)).toBeCloseTo(0.5);
    expect(signedAngularDelta(1, 359)).toBe(2);
  });
});

describe("divisional signs", () => {
  it("maps D9 across movable, fixed, and dual sign starts", () => {
    expect(d9Sign(0)).toBe(0);
    expect(d9Sign(30)).toBe(9);
    expect(d9Sign(60)).toBe(6);
    expect(d9Sign(359.999)).toBe(11);
  });

  it("maps D10 odd and even signs", () => {
    expect(d10Sign(0)).toBe(0);
    expect(d10Sign(27.1)).toBe(9);
    expect(d10Sign(30)).toBe(9);
    expect(d10Sign(57.1)).toBe(6);
  });
});
