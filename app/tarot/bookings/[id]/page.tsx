import type { Metadata } from "next";
import { CalendarCheck, PhoneCall, ShieldCheck } from "lucide-react";
import { notFound } from "next/navigation";
import { AppShell } from "@/components/suriya/app-shell";
import { getBooking } from "@/db/repositories/bookings";
import { getSpecialist } from "@/db/repositories/specialists";
import { bookingLabels, formatBookingDate, maskPhone } from "@/lib/content/booking-copy";
import { findDemoSpecialist } from "@/lib/content/demo";

export const metadata: Metadata = { title: "ရက်ချိန်း လက်ခံရရှိပါပြီ", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default async function BookingConfirmationPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const booking = await getBooking(id).catch(() => null);
  if (!booking) notFound();
  const specialistRow = await getSpecialist(booking.specialistId).catch(() => null);
  const specialistName = specialistRow?.name ?? findDemoSpecialist(booking.specialistId)?.name ?? booking.specialistId;

  return (
    <AppShell>
      <header className="page-heading">
        <p className="eyebrow">Tarot · ရက်ချိန်း တောင်းဆိုမှု</p>
        <h1 className="page-title">ရက်ချိန်း တောင်းဆိုမှု လက်ခံရရှိပါပြီ</h1>
        <p className="page-lede">{booking.name} ၏ တောင်းဆိုမှုကို {specialistName} ထံ ပေးပို့ထားပါသည်။ ၂၄ နာရီအတွင်း ဖုန်းဆက်၍ အတည်ပြုပေးပါမည်။</p>
      </header>
      <section className="surface booking-summary" aria-labelledby="booking-summary-title">
        <div className="section-title"><h2 id="booking-summary-title">တောင်းဆိုမှု အသေးစိတ်</h2><span className="section-note">{bookingLabels.contactChannel[booking.contactChannel]} · {maskPhone(booking.phone)}</span></div>
        <dl>
          <div><dt>ပညာရှင်</dt><dd>{specialistName}</dd></div>
          <div><dt>ရက်</dt><dd>{formatBookingDate(booking.preferredDate)}</dd></div>
          <div><dt>အချိန်ပိုင်း</dt><dd>{bookingLabels.preferredTime[booking.preferredTime]}</dd></div>
          <div><dt>အကြောင်းအရာ</dt><dd>{bookingLabels.topic[booking.topic]}</dd></div>
        </dl>
      </section>
      <ul className="booking-policy" aria-label="ဆွေးနွေးမှု စည်းကမ်း">
        <li><PhoneCall size={16} aria-hidden="true" /><span>အတည်ပြုချက်ကို {bookingLabels.contactChannel[booking.contactChannel]} ဖြင့် ပေးပို့ပါမည်။</span></li>
        <li><CalendarCheck size={16} aria-hidden="true" /><span>ငွေကို ဆွေးနွေးချိန်တွင် ပေးချေပါ။ ၂၄ နာရီ ကြိုတင်၍ အခမဲ့ ပြောင်းလဲ သို့မဟုတ် ပယ်ဖျက်နိုင်ပါသည်။</span></li>
        <li><ShieldCheck size={16} aria-hidden="true" /><span>သင့်ဖုန်းနံပါတ်ကို ရက်ချိန်းအတွက်သာ အသုံးပြုပါမည်။</span></li>
      </ul>
      <div className="daily-actions">
        <a className="primary-button" href="/daily">ယနေ့ဖတ်စာသို့ ပြန်သွားရန်</a>
        <a className="secondary-button" href="/tarot">အခြားပညာရှင်များ</a>
      </div>
    </AppShell>
  );
}
