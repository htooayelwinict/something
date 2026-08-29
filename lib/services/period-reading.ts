import { getChatGPTUser } from "@/app/chatgpt-auth";
import { getBirthProfile } from "@/db/repositories/profiles";
import { buildPeriodPrompt } from "@/lib/ai/period-prompt";
import { calculateChart } from "@/lib/astrology/calculate-chart";
import type { ChartSnapshot } from "@/lib/astrology/types";
import { demoProfile } from "@/lib/content/demo-profile";
import { buildDeterministicPeriodReading } from "@/lib/readings/period-deterministic";
import { buildPeriodEvidence, type PeriodEvidence } from "@/lib/readings/period-evidence";
import { periodFor, type Period, type PeriodKind } from "@/lib/readings/period";
import { birthProfileSchema, type BirthProfileInput } from "@/lib/schemas/profile";

export const DEMO_USER_ID = "demo";

export type PeriodSubject = { userId: string; profile: BirthProfileInput; personalized: boolean };

/** Resolve who the period reading is for. Guests may only read the demo daily reading. */
export async function resolvePeriodSubject(kind: PeriodKind): Promise<PeriodSubject | null> {
  const user = await getChatGPTUser();
  if (user) {
    const stored = await getBirthProfile(user.userId).catch(() => null);
    const parsed = birthProfileSchema.safeParse(stored);
    if (parsed.success) return { userId: user.userId, profile: parsed.data, personalized: true };
  }
  if (kind !== "daily") return null;
  return { userId: DEMO_USER_ID, profile: demoProfile, personalized: false };
}

export type PeriodReadingBundle = {
  snapshot: ChartSnapshot;
  period: Period;
  evidence: PeriodEvidence;
  prompt: string;
  fallback: string;
};

export function periodReadingFor(profile: BirthProfileInput, kind: PeriodKind, now = new Date(), snapshot?: ChartSnapshot): PeriodReadingBundle {
  const chart = snapshot ?? calculateChart(profile, now);
  const period = periodFor(kind, now, profile.timezone);
  const evidence = buildPeriodEvidence(chart, period);
  return { snapshot: chart, period, evidence, prompt: buildPeriodPrompt(evidence), fallback: buildDeterministicPeriodReading(evidence) };
}
