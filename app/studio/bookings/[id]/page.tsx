import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { BookingStatusForm } from "@/components/studio/booking-status-form";
import { StudioNoAccess } from "@/components/studio/studio-no-access";
import { StudioShell } from "@/components/studio/studio-shell";
import { getBookingForStaff } from "@/db/repositories/bookings";
import { getSpecialist } from "@/db/repositories/specialists";
import { bookingScope, requireStaff } from "@/lib/auth/staff";
import { bookingLabels, formatBookingDate } from "@/lib/content/booking-copy";
import { findDemoSpecialist } from "@/lib/content/demo";
import { parseStoredTimestamp } from "@/lib/readings/quota";
import { BOOKING_TIMEZONE } from "@/lib/schemas/booking";

export const metadata: Metadata = { title: "Studio · ရက်ချိန်း", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default async function StudioBookingPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const staff = await requireStaff(`/studio/bookings/${id}`);
  if (staff.role === "none") return <StudioNoAccess email={staff.user.email} />;
  const booking = await getBookingForStaff(id, bookingScope(staff)).catch(() => null);
  if (!booking) notFound();
  const tellerRow = await getSpecialist(booking.specialistId, { includeInactive: true }).catch(() => null);
  const tellerName = tellerRow?.name ?? findDemoSpecialist(booking.specialistId)?.name ?? booking.specialistId;
  const requestedAt = new Intl.DateTimeFormat("my-MM", { dateStyle: "medium", timeStyle: "short", timeZone: BOOKING_TIMEZONE }).format(parseStoredTimestamp(booking.createdAt));
  return (
    <StudioShell staff={staff} current="/studio/bookings">
      <a className="text-link" href="/studio/bookings">← ရက်ချိန်းများသို့</a>
      <header className="page-heading"><p className="eyebrow">ရက်ချိန်း · {tellerName}</p><h1 className="page-title">{booking.name}</h1><p className="page-lede">{formatBookingDate(booking.preferredDate)} · {bookingLabels.preferredTime[booking.preferredTime]}</p></header>
      <section className="surface studio-detail" aria-label="ဖောက်သည် အချက်အလက်">
        <dl>
          <div><dt>ဖုန်း</dt><dd><a href={`tel:${booking.phone.replace(/\s+/g, "")}`}>{booking.phone}</a></dd></div>
          <div><dt>ဆက်သွယ်လိုသည့် နည်းလမ်း</dt><dd>{bookingLabels.contactChannel[booking.contactChannel]}</dd></div>
          <div><dt>ပညာရှင်</dt><dd>{tellerName}</dd></div>
          <div><dt>အကြောင်းအရာ</dt><dd>{bookingLabels.topic[booking.topic]}</dd></div>
          <div><dt>တောင်းဆိုချိန်</dt><dd>{requestedAt}</dd></div>
          <div><dt>ID</dt><dd>{booking.id}</dd></div>
        </dl>
        {booking.note && <p className="studio-note"><strong>ဖောက်သည် မှတ်ချက် —</strong> {booking.note}</p>}
      </section>
      <BookingStatusForm bookingId={booking.id} status={booking.status} staffNote={booking.staffNote} />
    </StudioShell>
  );
}
