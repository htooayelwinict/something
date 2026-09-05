import type { TarotBookingRow } from "@/db/schema";
import { bookingLabels, formatBookingDate } from "@/lib/content/booking-copy";
import { bookingStatusLabels, studioMessages } from "@/lib/content/studio-copy";

export function BookingTable({ bookings, tellerNames, showTeller }: { bookings: TarotBookingRow[]; tellerNames: Record<string, string>; showTeller: boolean }) {
  if (bookings.length === 0) return <p className="empty-state">{studioMessages.empty_bookings}</p>;
  return (
    <div className="table-scroll">
      <table className="data-table">
        <thead>
          <tr><th scope="col">ရက်</th><th scope="col">အချိန်ပိုင်း</th><th scope="col">ဖောက်သည်</th>{showTeller && <th scope="col">ပညာရှင်</th>}<th scope="col">အကြောင်းအရာ</th><th scope="col">အခြေအနေ</th></tr>
        </thead>
        <tbody>
          {bookings.map((booking) => (
            <tr key={booking.id}>
              <td><a href={`/studio/bookings/${booking.id}`}>{formatBookingDate(booking.preferredDate)}</a></td>
              <td>{bookingLabels.preferredTime[booking.preferredTime]}</td>
              <td>{booking.name}</td>
              {showTeller && <td>{tellerNames[booking.specialistId] ?? booking.specialistId}</td>}
              <td>{bookingLabels.topic[booking.topic]}</td>
              <td><span className="status-badge" data-status={booking.status}>{bookingStatusLabels[booking.status]}</span></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
