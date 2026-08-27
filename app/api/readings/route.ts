import { getChatGPTUser } from "@/app/chatgpt-auth";
import { getBirthProfile, upsertProfile } from "@/db/repositories/profiles";
import { createReading, listReadings } from "@/db/repositories/readings";
import { calculateReadingSnapshot, readingPeriod } from "@/lib/readings/calculate-reading";
import { CALCULATION_VERSION } from "@/lib/astrology/types";
import { PROMPT_VERSION } from "@/lib/ai/prompt";
import { birthProfileSchema } from "@/lib/schemas/profile";
import { readingRequestSchema } from "@/lib/schemas/reading";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const user = await getChatGPTUser();
  if (!user) return Response.json({ error: "unauthorized" }, { status: 401 });
  const parsed = readingRequestSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: parsed.error.issues[0]?.message ?? "invalid_reading" }, { status: 400 });
  try {
    await upsertProfile(user);
    const recent = await listReadings(user.userId);
    const cutoff = Date.now() - 10 * 60_000;
    if (recent.filter((item) => Date.parse(item.createdAt) > cutoff).length >= 5) {
      return Response.json({ error: "မေးခွန်းများလွန်းနေပါတယ်။ ခဏနားပြီး ပြန်စမ်းပါ။" }, { status: 429 });
    }
    const storedProfile = await getBirthProfile(user.userId);
    const birthProfile = birthProfileSchema.safeParse(storedProfile);
    if (!birthProfile.success || !storedProfile) return Response.json({ error: "birth_profile_required" }, { status: 409 });
    const now = new Date();
    const snapshot = calculateReadingSnapshot(birthProfile.data, parsed.data, now);
    const period = readingPeriod(snapshot);
    const reading = await createReading(user.userId, {
      birthProfileId: storedProfile.id,
      kind: parsed.data.kind,
      question: parsed.data.question,
      periodStart: period.start,
      periodEnd: period.end,
      chartSnapshot: snapshot as unknown as Record<string, unknown>,
      calculationVersion: CALCULATION_VERSION,
      promptVersion: PROMPT_VERSION,
      responseText: null,
      interpretationMode: "deterministic",
      feedback: null,
      status: "generating",
      errorCode: null,
    });
    return Response.json({ id: reading.id }, { status: 201, headers: { "cache-control": "private, no-store" } });
  } catch (error) {
    if (error instanceof RangeError) return Response.json({ error: error.message }, { status: 400 });
    return Response.json({ error: "reading_service_unavailable" }, { status: 503 });
  }
}
