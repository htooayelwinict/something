import { createSpecialist, getSpecialist } from "@/db/repositories/specialists";
import { tellerCreateSchema } from "@/lib/schemas/teller";
import { authorizeStudioRequest, firstIssueMessage, isUniqueViolation, jsonError, noStore } from "@/lib/studio/api";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const auth = await authorizeStudioRequest(request);
  if ("response" in auth) return auth.response;
  if (auth.staff.role !== "editor") return jsonError("forbidden", 403);
  const parsed = tellerCreateSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return jsonError(firstIssueMessage(parsed.error), 400);
  try {
    if (await getSpecialist(parsed.data.id, { includeInactive: true })) return jsonError("duplicate", 409);
    const specialist = await createSpecialist(parsed.data);
    return Response.json({ specialist }, { status: 201, headers: noStore });
  } catch (error) {
    return isUniqueViolation(error) ? jsonError("duplicate", 409) : jsonError("service_unavailable", 503);
  }
}
