import { getCurrentUser } from "@/lib/auth/current-user";
import { deleteAccountData, getBirthProfile, saveBirthProfile, upsertProfile } from "@/db/repositories/profiles";
import { birthProfileSchema } from "@/lib/schemas/profile";

export const dynamic = "force-dynamic";

function safeMessage(error: unknown) {
  const message = error instanceof Error ? error.message : "unknown";
  return message.includes("no such table") ? "ဒေတာဘေ့စ် စတင်ပြင်ဆင်နေဆဲဖြစ်ပါတယ်။" : "ဝန်ဆောင်မှု ခေတ္တမရနိုင်ပါ။";
}

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return Response.json({ error: "unauthorized" }, { status: 401 });
  try {
    await upsertProfile(user);
    return Response.json({ birthProfile: await getBirthProfile(user.userId) }, { headers: { "cache-control": "private, no-store" } });
  } catch (error) {
    return Response.json({ error: safeMessage(error) }, { status: 503 });
  }
}

export async function PUT(request: Request) {
  const user = await getCurrentUser();
  if (!user) return Response.json({ error: "unauthorized" }, { status: 401 });
  const parsed = birthProfileSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: parsed.error.issues[0]?.message ?? "invalid_profile", issues: parsed.error.flatten() }, { status: 400 });
  try {
    await upsertProfile(user);
    const birthProfile = await saveBirthProfile(user.userId, parsed.data);
    return Response.json({ birthProfile }, { headers: { "cache-control": "private, no-store" } });
  } catch (error) {
    return Response.json({ error: safeMessage(error) }, { status: 503 });
  }
}

export async function DELETE() {
  const user = await getCurrentUser();
  if (!user) return Response.json({ error: "unauthorized" }, { status: 401 });
  try {
    await deleteAccountData(user.userId);
    return new Response(null, { status: 204 });
  } catch (error) {
    return Response.json({ error: safeMessage(error) }, { status: 503 });
  }
}
