import type { CelestialChart, ChartSnapshot, MuhurtaEventType, MuhurtaWindow } from "@/lib/astrology/types";
import type { ReadingTechniqueId } from "@/lib/schemas/reading";

export const READING_SNAPSHOT_VERSION = "suriya-reading-2" as const;

type ReadingSnapshotBase = {
  snapshotVersion: typeof READING_SNAPSHOT_VERSION;
  calculatedAt: string;
  chart: CelestialChart;
};

export type JanmaReadingSnapshot = ReadingSnapshotBase & {
  technique: "janma";
  chart: ChartSnapshot;
  context: { basis: "birth-chart" };
};

export type PrashnaReadingSnapshot = ReadingSnapshotBase & {
  technique: "prashna";
  context: {
    basis: "question-chart";
    askedAt: string;
    locationSource: "saved-profile";
  };
};

export type MuhurtaReadingSnapshot = ReadingSnapshotBase & {
  technique: "muhurta";
  context: {
    basis: "election-chart";
    targetDate: string;
    eventType: MuhurtaEventType;
    locationSource: "saved-profile";
    window: MuhurtaWindow | null;
  };
};

export type ReadingSnapshot = JanmaReadingSnapshot | PrashnaReadingSnapshot | MuhurtaReadingSnapshot;
export type ReadingSnapshotLike = ReadingSnapshot | ChartSnapshot;

export function isReadingSnapshot(snapshot: ReadingSnapshotLike): snapshot is ReadingSnapshot {
  return "snapshotVersion" in snapshot && snapshot.snapshotVersion === READING_SNAPSHOT_VERSION;
}

export function readingChart(snapshot: ReadingSnapshotLike): CelestialChart {
  return isReadingSnapshot(snapshot) ? snapshot.chart : snapshot;
}

export function readingTechnique(snapshot: ReadingSnapshotLike, fallback: ReadingTechniqueId): ReadingTechniqueId {
  return isReadingSnapshot(snapshot) ? snapshot.technique : fallback;
}
