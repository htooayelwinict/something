import { getChatGPTUser } from "@/app/chatgpt-auth";
import { getBirthProfile } from "@/db/repositories/profiles";
import { calculateChart } from "@/lib/astrology/calculate-chart";
import { calculateDailyInsight } from "@/lib/astrology/daily-score";
import { birthProfileSchema, type BirthProfileInput } from "@/lib/schemas/profile";
import { demoProfile } from "@/lib/content/demo-profile";
import { buildDailyPresentation } from "@/lib/content/daily-copy";

function calculateDaily(input: BirthProfileInput, now: Date) {
  const chart = calculateChart(input, now);
  return { chart, insight: calculateDailyInsight(chart, now) };
}

export async function getDailyExperience() {
  const now = new Date();
  const user = await getChatGPTUser();
  let input = demoProfile;
  let personalized = false;
  let calculated: ReturnType<typeof calculateDaily> | null = null;
  if (user) {
    try {
      const stored = await getBirthProfile(user.userId);
      const parsed = birthProfileSchema.safeParse(stored);
      if (parsed.success) {
        calculated = calculateDaily(parsed.data, now);
        input = parsed.data;
        personalized = true;
      }
    } catch {
      // Keep the public demo usable when profile loading or personalized calculation fails.
    }
  }
  const { chart, insight } = calculated ?? calculateDaily(demoProfile, now);
  return {
    user,
    personalized,
    chart,
    insight,
    identity: {
      name: personalized ? input.name : "Suriya Guest",
      birthLabel: `${input.birthDate} · ${input.birthCity}`,
      numerology: chart.numerology,
      ascendantSignIndex: chart.ascendant.signIndex,
      moonSignIndex: chart.planets.find((planet) => planet.name === "Moon")?.signIndex ?? 0,
    },
    presentation: buildDailyPresentation(chart, insight),
  };
}
