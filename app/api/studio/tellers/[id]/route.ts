import { updateSpecialist } from "@/db/repositories/specialists";
import { tellerEditorSchema, tellerProfileSchema } from "@/lib/schemas/teller";
import { authorizeStudioRequest, firstIssueMessage, isUniqueViolation, jsonError, noStore } from "@/lib/studio/api";

export const dynamic = "force-dynamic";

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await authorizeStudioRequest(request);
  if ("response" in auth) return auth.response;
  const { id } = await params;
  const { staff } = auth;
  if (staff.role === "teller" && staff.specialistId !== id) return jsonError("forbidden", 403);
  const body = await request.json().catch(() => null);
  const parsed = staff.role === "editor" ? tellerEditorSchema.safeParse(body) : tellerProfileSchema.safeParse(body);
  if (!parsed.success) return jsonError(firstIssueMessage(parsed.error), 400);
  try {
    const specialist = await updateSpecialist(id, parsed.data);
    if (!specialist) return jsonError("not_found", 404);
    return Response.json({ specialist }, { headers: noStore });
  } catch (error) {
    return isUniqueViolation(error) ? jsonError("duplicate", 409) : jsonError("service_unavailable", 503);
  }
}
