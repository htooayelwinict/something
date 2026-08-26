import { getChatGPTUser } from "@/app/chatgpt-auth";
import { getBirthProfile } from "@/db/repositories/profiles";
import { calculateChart } from "@/lib/astrology/calculate-chart";
import { calculateDailyInsight } from "@/lib/astrology/daily-score";
import { birthProfileSchema, type BirthProfileInput } from "@/lib/schemas/profile";
import { buildDailyPresentation } from "@/lib/content/daily-copy";

const demoProfile: BirthProfileInput = {
  name: "Suriya Guest", birthDate: "1990-01-01", birthTime: "12:00", birthCity: "ရန်ကုန်",
  latitude: 16.7967, longitude: 96.161, timezone: "Asia/Yangon",
};

export async function getDailyExperience() {
  const now = new Date();
  const user = await getChatGPTUser();
  let input = demoProfile;
  let personalized = false;
  if (user) {
    try {
      const stored = await getBirthProfile(user.userId);
      const parsed = birthProfileSchema.safeParse(stored);
      if (parsed.success) {
        input = parsed.data;
        personalized = true;
      }
    } catch {
      // The public demo remains usable while a deployment migration is still applying.
    }
  }
  const chart = calculateChart(input, now);
  const insight = calculateDailyInsight(chart, now);
  return {
    user,
    personalized,
    chart,
    insight,
    identity: {
      name: personalized ? input.name : "Suriya Guest",
      birthLabel: `${input.birthDate} · ${input.birthCity}`,
      numerology: chart.numerology,
    },
    presentation: buildDailyPresentation(chart, insight),
  };
}
