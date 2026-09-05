import type { Metadata } from "next";
import { BookingTable } from "@/components/studio/booking-table";
import { StatTiles } from "@/components/studio/stat-tiles";
import { StudioNoAccess } from "@/components/studio/studio-no-access";
import { StudioShell } from "@/components/studio/studio-shell";
import { countBookingsByStatus, listBookingsForStaff } from "@/db/repositories/bookings";
import { listSpecialists } from "@/db/repositories/specialists";
import { localDateInTimezone } from "@/lib/astrology/time";
import { bookingScope, requireStaff } from "@/lib/auth/staff";
import { bookingStatusLabels, studioMessages } from "@/lib/content/studio-copy";
import { BOOKING_TIMEZONE } from "@/lib/schemas/booking";

export const metadata: Metadata = { title: "Studio", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default async function StudioPage() {
  const staff = await requireStaff("/studio");
  if (staff.role === "none") return <StudioNoAccess email={staff.user.email} />;
  const scope = bookingScope(staff);
  const today = localDateInTimezone(new Date(), BOOKING_TIMEZONE);
  const [counts, upcoming, tellers] = await Promise.all([
    countBookingsByStatus(scope).catch(() => null),
    listBookingsForStaff(scope, { statuses: ["requested", "confirmed"], fromDate: today, limit: 10 }).catch(() => null),
    listSpecialists({ includeInactive: true }).catch(() => []),
  ]);
  const tellerNames = Object.fromEntries(tellers.map((teller) => [teller.id, teller.name]));
  return (
    <StudioShell staff={staff} current="/studio">
      <header className="page-heading">
        <p className="eyebrow">Studio · {staff.role === "editor" ? "တည်းဖြတ်သူ" : tellerNames[staff.specialistId] ?? "ပညာရှင်"}</p>
        <h1 className="page-title">ခြုံငုံကြည့်ရှုမှု</h1>
        <p className="page-lede">{staff.user.email}</p>
      </header>
      {counts
        ? <StatTiles tiles={[{ label: bookingStatusLabels.requested, value: counts.requested }, { label: bookingStatusLabels.confirmed, value: counts.confirmed }, { label: bookingStatusLabels.completed, value: counts.completed }]} />
        : <p className="form-error" role="status">{studioMessages.db_unavailable}</p>}
      <section aria-labelledby="upcoming-title">
        <div className="section-title"><h2 id="upcoming-title">လာမည့် ရက်ချိန်းများ</h2><a className="text-link" href="/studio/bookings">အားလုံး ကြည့်ရန်</a></div>
        {upcoming ? <BookingTable bookings={upcoming} tellerNames={tellerNames} showTeller={staff.role === "editor"} /> : <p className="empty-state">{studioMessages.db_unavailable}</p>}
      </section>
      {staff.role === "editor" ? (
        <section aria-labelledby="tellers-title">
          <div className="section-title"><h2 id="tellers-title">ပညာရှင်များ</h2><a className="text-link" href="/studio/tellers/new">ပညာရှင် အသစ် ထည့်ရန်</a></div>
          <ul className="studio-list">
            {tellers.map((teller) => (
              <li key={teller.id}><a href={`/studio/tellers/${teller.id}`}>{teller.name}</a><span className="status-badge" data-status={teller.isActive ? "confirmed" : "cancelled"}>{teller.isActive ? "ပြသနေ" : "ရပ်ထား"}</span></li>
            ))}
          </ul>
        </section>
      ) : (
        <a className="secondary-button" href={`/studio/tellers/${staff.specialistId}`}>ကျွန်ုပ်၏ Profile ပြင်ဆင်ရန်</a>
      )}
    </StudioShell>
  );
}
