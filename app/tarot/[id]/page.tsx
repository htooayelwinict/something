import type { Metadata } from "next";
import { ArrowLeft, CalendarClock, CircleCheck, Headphones, ShieldCheck, Star } from "lucide-react";
import { notFound } from "next/navigation";
import { AppShell } from "@/components/suriya/app-shell";
import { getSpecialist } from "@/db/repositories/specialists";
import { findDemoSpecialist, specialistFromRow } from "@/lib/content/demo";

export const metadata: Metadata = { title: "အကြံပေး Profile" };

export default async function ConsultantProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const row = await getSpecialist(id).catch(() => null);
  const specialist = row ? specialistFromRow(row) : findDemoSpecialist(id);
  if (!specialist) notFound();

  return (
    <AppShell>
      <a className="back-link" href="/tarot"><ArrowLeft size={15} aria-hidden="true" /> အကြံပေးများသို့</a>
      <article className="consultant-profile">
        <header className="consultant-profile-hero">
          <span className="consultant-profile-monogram" aria-hidden="true">{specialist.initials}</span>
          <div><p className="eyebrow">HUMAN ADVISOR · Preview</p><h1>{specialist.name}</h1><p>{specialist.specialty}</p></div>
          <span className="consultant-status"><CircleCheck size={13} aria-hidden="true" /> Profile စစ်ဆေးပြီး</span>
        </header>
        <div className="consultant-profile-body">
          <section>
            <p className="eyebrow">ABOUT THE ADVISOR</p>
            <h2>သင့်မေးခွန်းကို လူသားအမြင်ဖြင့် နားထောင်ပေးမည့် အကြံပေး</h2>
            <p>{specialist.experience} ရှိပြီး {specialist.tags.join("၊ ")} ကိစ္စများကို အဓိကထား ဆွေးနွေးပေးသည်။</p>
            <div className="tag-row">{specialist.tags.map((tag) => <span className="tag" key={tag}>{tag}</span>)}</div>
            <ul className="consultant-facts">
              <li><Star size={15} aria-hidden="true" /><span>အထူးပြု</span><strong>{specialist.specialty}</strong></li>
              <li><Headphones size={15} aria-hidden="true" /><span>အတွေ့အကြုံ</span><strong>{specialist.experience}</strong></li>
              <li><CalendarClock size={15} aria-hidden="true" /><span>ပြသနှုန်း</span><strong>{specialist.rate}</strong></li>
            </ul>
          </section>
          <aside className="consultant-preview-action">
            <ShieldCheck size={22} aria-hidden="true" />
            <p className="eyebrow">CONSULTATION PREVIEW</p>
            <h2>booking မဖွင့်ရသေးပါ</h2>
            <p>{specialist.availability}။ ရက်ချိန်း၊ ငွေပေးချေမှုနှင့် live session များသည် ယခု Preview တွင် အလုပ်မလုပ်သေးပါ။</p>
            <button className="primary-button" type="button" disabled>ဆွေးနွေးမှု မကြာမီ</button>
          </aside>
        </div>
      </article>
    </AppShell>
  );
}
