import type { Metadata } from "next";
import { BookingTable } from "@/components/studio/booking-table";
import { StudioNoAccess } from "@/components/studio/studio-no-access";
import { StudioShell } from "@/components/studio/studio-shell";
import { listBookingsForStaff } from "@/db/repositories/bookings";
import { listSpecialists } from "@/db/repositories/specialists";
import { bookingScope, requireStaff } from "@/lib/auth/staff";
import { bookingStatusLabels, bookingStatusOrder, studioMessages } from "@/lib/content/studio-copy";
import { bookingStatusSchema } from "@/lib/schemas/staff-booking";

export const metadata: Metadata = { title: "Studio · ရက်ချိန်းများ", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default async function StudioBookingsPage({ searchParams }: { searchParams: Promise<{ status?: string; teller?: string }> }) {
  const staff = await requireStaff("/studio/bookings");
  if (staff.role === "none") return <StudioNoAccess email={staff.user.email} />;
  const params = await searchParams;
  const statusFilter = bookingStatusSchema.safeParse(params.status);
  const status = statusFilter.success ? statusFilter.data : undefined;
  const teller = staff.role === "editor" && params.teller ? params.teller : undefined;
  const [bookings, tellers] = await Promise.all([
    listBookingsForStaff(bookingScope(staff), { statuses: status ? [status] : undefined, specialistId: teller }).catch(() => null),
    listSpecialists({ includeInactive: true }).catch(() => []),
  ]);
  const tellerNames = Object.fromEntries(tellers.map((item) => [item.id, item.name]));
  return (
    <StudioShell staff={staff} current="/studio/bookings">
      <header className="page-heading"><p className="eyebrow">Studio · ရက်ချိန်းများ</p><h1 className="page-title">ရက်ချိန်း တောင်းဆိုမှုများ</h1></header>
      <form className="studio-filters" method="get" action="/studio/bookings">
        <div className="field-group">
          <label className="field-label" htmlFor="filter-status">အခြေအနေ</label>
          <select className="select-field" id="filter-status" name="status" defaultValue={status ?? ""}>
            <option value="">အားလုံး</option>
            {bookingStatusOrder.map((item) => <option key={item} value={item}>{bookingStatusLabels[item]}</option>)}
          </select>
        </div>
        {staff.role === "editor" && (
          <div className="field-group">
            <label className="field-label" htmlFor="filter-teller">ပညာရှင်</label>
            <select className="select-field" id="filter-teller" name="teller" defaultValue={teller ?? ""}>
              <option value="">အားလုံး</option>
              {tellers.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
            </select>
          </div>
        )}
        <button className="secondary-button" type="submit">စစ်ထုတ်မည်</button>
      </form>
      {bookings ? <BookingTable bookings={bookings} tellerNames={tellerNames} showTeller={staff.role === "editor"} /> : <p className="empty-state">{studioMessages.db_unavailable}</p>}
    </StudioShell>
  );
}
