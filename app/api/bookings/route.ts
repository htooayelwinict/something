import { getChatGPTUser } from "@/app/chatgpt-auth";
import { countRecentBookings, createBooking } from "@/db/repositories/bookings";
import { getSpecialist } from "@/db/repositories/specialists";
import { findDemoSpecialist } from "@/lib/content/demo";
import { bookingRequestSchema, isBookingDateInRange } from "@/lib/schemas/booking";

export const dynamic = "force-dynamic";

const BOOKINGS_PER_HOUR = 3;

async function hashIp(ip: string) {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(ip));
  return Array.from(new Uint8Array(digest)).map((byte) => byte.toString(16).padStart(2, "0")).join("").slice(0, 16);
}

export async function POST(request: Request) {
  const parsed = bookingRequestSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: parsed.error.issues[0]?.message ?? "invalid_booking" }, { status: 400 });
  const input = parsed.data;
  if (!isBookingDateInRange(input.preferredDate)) {
    return Response.json({ error: "ရက်စွဲသည် ယနေ့မှ ရက် ၆၀ အတွင်း ဖြစ်ရပါမည်" }, { status: 400 });
  }
  const known = findDemoSpecialist(input.specialistId) !== null || Boolean(await getSpecialist(input.specialistId).catch(() => null));
  if (!known) return Response.json({ error: "specialist_not_found" }, { status: 404 });

  const user = await getChatGPTUser();
  const ipHash = user ? null : await hashIp(request.headers.get("cf-connecting-ip") ?? "unknown");
  try {
    const since = new Date(Date.now() - 60 * 60_000).toISOString();
    const recent = await countRecentBookings(user ? { userId: user.userId } : { ipHash: ipHash ?? undefined }, since);
    if (recent >= BOOKINGS_PER_HOUR) return Response.json({ error: "too_many_bookings" }, { status: 429 });
    const booking = await createBooking({ ...input, note: input.note ?? null, userId: user?.userId ?? null, ipHash });
    return Response.json({ id: booking.id }, { status: 201, headers: { "cache-control": "private, no-store" } });
  } catch {
    return Response.json({ error: "booking_service_unavailable" }, { status: 503 });
  }
}
