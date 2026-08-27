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

export function readingBasisLede(snapshot: ReadingSnapshotLike, fallback: ReadingTechniqueId): string {
  const technique = readingTechnique(snapshot, fallback);
  if (!isReadingSnapshot(snapshot) && technique !== "janma") {
    return "ဤ v1 မှတ်တမ်းဟောင်းတွင် မွေးဇာတာသာ သိမ်းထားပြီး မေးချိန်ဇာတာ မဟုတ်ပါ။ နည်းလမ်းသစ်ဖြင့် ပြန်တွက်ချက်နိုင်ပါတယ်။";
  }
  if (technique === "prashna") {
    return "မေးခွန်းပေးပို့သည့်အချိန်နှင့် သိမ်းထားသောနေရာမှ တွက်ချက်ထားသည့် မေးချိန်ဇာတာအမြင်။";
  }
  if (technique === "muhurta") {
    return "နေထွက်၊ Hora၊ Rahu Kalam နှင့် Panchanga ကို အခြေခံ၍ ရွေးထားသော ကိုယ်စားလှယ်အချိန်။";
  }
  return "သင့်မွေးဇာတာနှင့် လက်ရှိဒဿာကာလမှ ဖန်တီးထားသည့် ပြန်လည်စဉ်းစားရန်အမြင်။";
}
