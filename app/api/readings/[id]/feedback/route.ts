import { getCurrentUser } from "@/lib/auth/current-user";
import { setReadingFeedback } from "@/db/repositories/readings";
import { readingFeedbackSchema } from "@/lib/schemas/feedback";

export const dynamic = "force-dynamic";

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getCurrentUser();
  if (!user) return Response.json({ error: "unauthorized" }, { status: 401 });

  const parsed = readingFeedbackSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return Response.json({ error: "invalid_feedback" }, { status: 400 });
  }

  const { id } = await params;
  const reading = await setReadingFeedback(user.userId, id, parsed.data.value).catch(() => null);
  if (!reading) return Response.json({ error: "not_found" }, { status: 404 });

  return Response.json(
    { feedback: reading.feedback },
    { headers: { "cache-control": "private, no-store" } },
  );
}
