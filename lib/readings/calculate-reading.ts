import { calculateCelestialChart, calculateChart } from "@/lib/astrology/calculate-chart";
import { findMuhurtaWindow } from "@/lib/astrology/muhurta";
import { localDateInTimezone, localDateTimeToUtc } from "@/lib/astrology/time";
import type { BirthProfileInput } from "@/lib/schemas/profile";
import type {
  JanmaReadingRequestInput,
  MuhurtaReadingRequestInput,
  PrashnaReadingRequestInput,
  ReadingRequestInput,
} from "@/lib/schemas/reading";
import type { ChartLocation } from "@/lib/astrology/types";
import {
  READING_SNAPSHOT_VERSION,
  type JanmaReadingSnapshot,
  type MuhurtaReadingSnapshot,
  type PrashnaReadingSnapshot,
  type ReadingSnapshot,
} from "./snapshot";

function profileLocation(profile: BirthProfileInput): ChartLocation {
  return {
    label: profile.birthCity,
    latitude: profile.latitude,
    longitude: profile.longitude,
    timezone: profile.timezone,
  };
}

function dayDistance(from: string, to: string): number {
  return Math.round((Date.parse(`${to}T00:00:00.000Z`) - Date.parse(`${from}T00:00:00.000Z`)) / 86_400_000);
}

export function validateMuhurtaTargetDate(targetDate: string, now: Date, timezone: string): void {
  const today = localDateInTimezone(now, timezone);
  const distance = dayDistance(today, targetDate);
  if (!Number.isFinite(distance) || distance < 0) throw new RangeError("Muhurta target date must not be in the past");
  if (distance > 90) throw new RangeError("Muhurta target date must be within 90 days");
}

export function readingPeriod(snapshot: ReadingSnapshot): { start: string; end: string } {
  const date = snapshot.technique === "muhurta"
    ? snapshot.context.targetDate
    : snapshot.calculatedAt.slice(0, 10);
  return { start: date, end: date };
}

export function calculateReadingSnapshot(profile: BirthProfileInput, input: JanmaReadingRequestInput, now: Date): JanmaReadingSnapshot;
export function calculateReadingSnapshot(profile: BirthProfileInput, input: PrashnaReadingRequestInput, now: Date): PrashnaReadingSnapshot;
export function calculateReadingSnapshot(profile: BirthProfileInput, input: MuhurtaReadingRequestInput, now: Date): MuhurtaReadingSnapshot;
export function calculateReadingSnapshot(profile: BirthProfileInput, input: ReadingRequestInput, now: Date): ReadingSnapshot;
export function calculateReadingSnapshot(profile: BirthProfileInput, input: ReadingRequestInput, now: Date): ReadingSnapshot {
  const location = profileLocation(profile);
  const calculatedAt = now.toISOString();

  if (input.kind === "janma") {
    return {
      snapshotVersion: READING_SNAPSHOT_VERSION,
      technique: "janma",
      calculatedAt,
      chart: calculateChart(profile, now),
      context: { basis: "birth-chart" },
    };
  }

  if (input.kind === "prashna") {
    return {
      snapshotVersion: READING_SNAPSHOT_VERSION,
      technique: "prashna",
      calculatedAt,
      chart: calculateCelestialChart(now, location, "question", now),
      context: { basis: "question-chart", askedAt: calculatedAt, locationSource: "saved-profile" },
    };
  }

  validateMuhurtaTargetDate(input.targetDate, now, profile.timezone);
  const notBefore = input.targetDate === localDateInTimezone(now, profile.timezone) ? now : undefined;
  const window = findMuhurtaWindow(location, input.targetDate, input.eventType, notBefore);
  const instant = window ? new Date(window.start) : localDateTimeToUtc(input.targetDate, "12:00", profile.timezone);
  return {
    snapshotVersion: READING_SNAPSHOT_VERSION,
    technique: "muhurta",
    calculatedAt,
    chart: calculateCelestialChart(instant, location, "election", now),
    context: {
      basis: "election-chart",
      targetDate: input.targetDate,
      eventType: input.eventType,
      locationSource: "saved-profile",
      window,
    },
  };
}
