import type { Metadata } from "next";
import { ArrowLeft, CalendarClock, CircleCheck, Clock3, Headphones, MapPin, Star } from "lucide-react";
import { notFound } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/current-user";
import { AppShell } from "@/components/suriya/app-shell";
import { BookingForm } from "@/components/suriya/booking-form";
import { getSpecialist } from "@/db/repositories/specialists";
import { toBurmeseDigits } from "@/lib/content/burmese-digits";
import { findDemoSpecialist, specialistFromRow } from "@/lib/content/demo";

export const metadata: Metadata = { title: "Tarot ပညာရှင် · ရက်ချိန်းယူရန်" };
export const dynamic = "force-dynamic";

export default async function ConsultantProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const row = await getSpecialist(id).catch(() => null);
  const specialist = row ? specialistFromRow(row) : findDemoSpecialist(id);
  if (!specialist) notFound();
  const user = await getCurrentUser();

  return (
    <AppShell>
      <a className="back-link" href="/tarot"><ArrowLeft size={15} aria-hidden="true" /> ပညာရှင်များသို့</a>
      <article className="consultant-profile">
        <header className="consultant-profile-hero">
          <span className="consultant-profile-monogram" aria-hidden="true">{specialist.initials}</span>
          <div><p className="eyebrow">Tarot · လူချင်းတွေ့ ဆွေးနွေးမှု</p><h1>{specialist.name}</h1><p>{specialist.specialty}</p></div>
          <span className="consultant-status"><CircleCheck size={13} aria-hidden="true" /> Profile စစ်ဆေးပြီး</span>
        </header>
        <div className="consultant-profile-body">
          <section aria-labelledby="advisor-about">
            <p className="eyebrow">ပညာရှင်အကြောင်း</p>
            <h2 id="advisor-about">သင့်အခြေအနေကို လူသားအမြင်ဖြင့် နားထောင်ပေးမည့် ပညာရှင်</h2>
            <p>{specialist.experience} ရှိပြီး {specialist.tags.join("၊ ")} ကိစ္စများကို အဓိကထား ဆွေးနွေးပေးသည်။</p>
            <div className="tag-row">{specialist.tags.map((tag) => <span className="tag" key={tag}>{tag}</span>)}</div>
            <ul className="consultant-facts">
              <li><Star size={15} aria-hidden="true" /><span>အထူးပြု</span><strong>{specialist.specialty}</strong></li>
              <li><Headphones size={15} aria-hidden="true" /><span>အတွေ့အကြုံ</span><strong>{specialist.experience}</strong></li>
              <li><MapPin size={15} aria-hidden="true" /><span>နေရာ</span><strong>{specialist.location}</strong></li>
              <li><Clock3 size={15} aria-hidden="true" /><span>ကြာချိန်</span><strong>{toBurmeseDigits(specialist.sessionMinutes)} မိနစ်</strong></li>
              <li><CalendarClock size={15} aria-hidden="true" /><span>ပြသနှုန်း</span><strong>{specialist.rate}</strong></li>
            </ul>
            <p className="booking-availability">ရနိုင်သောရက်များ · {specialist.availability}</p>
          </section>
          <section className="booking-card" id="booking" aria-labelledby="booking-title">
            <p className="eyebrow">ရက်ချိန်းယူရန်</p>
            <h2 id="booking-title">ရက်ချိန်း တောင်းဆိုရန်</h2>
            <BookingForm
              specialistId={specialist.id}
              specialistName={specialist.name}
              defaultName={user?.fullName ?? ""}
              contactPhone={process.env.TAROT_CONTACT_PHONE ?? null}
            />
          </section>
        </div>
      </article>
    </AppShell>
  );
}
