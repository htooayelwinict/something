import { updateBookingForStaff } from "@/db/repositories/bookings";
import { bookingScope } from "@/lib/auth/staff";
import { bookingStaffPatchSchema } from "@/lib/schemas/staff-booking";
import { authorizeStudioRequest, firstIssueMessage, jsonError, noStore } from "@/lib/studio/api";

export const dynamic = "force-dynamic";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await authorizeStudioRequest(request);
  if ("response" in auth) return auth.response;
  const { id } = await params;
  const parsed = bookingStaffPatchSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return jsonError(firstIssueMessage(parsed.error), 400);
  try {
    const booking = await updateBookingForStaff(id, bookingScope(auth.staff), parsed.data);
    if (!booking) return jsonError("not_found", 404);
    return Response.json({ booking }, { headers: noStore });
  } catch {
    return jsonError("service_unavailable", 503);
  }
}
