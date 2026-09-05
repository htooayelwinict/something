import { ArrowRight, CalendarDays, MapPin } from "lucide-react";
import type { TarotSpecialist } from "@/lib/content/demo";

export function TarotSpecialistCard({ specialist }: { specialist: TarotSpecialist }) {
  return (
    <article className="surface specialist-card">
      <div className="specialist-visual">
        <span className="availability">{specialist.availability}</span>
        {specialist.photoUrl
          // eslint-disable-next-line @next/next/no-img-element -- remote photo URL; the image optimizer only serves local assets
          ? <img className="specialist-photo" src={specialist.photoUrl} alt="" loading="lazy" referrerPolicy="no-referrer" />
          : <span className="specialist-monogram" aria-hidden="true">{specialist.initials}</span>}
      </div>
      <div className="specialist-body">
        <h2>{specialist.name}</h2>
        <p className="specialist-meta">{specialist.specialty} · {specialist.experience}</p>
        <div className="tag-row">{specialist.tags.map((tag) => <span className="tag" key={tag}>{tag}</span>)}</div>
        <ul className="specialist-chips" aria-label="နေရာနှင့် ရက်များ">
          <li><MapPin size={13} aria-hidden="true" />{specialist.location}</li>
          <li><CalendarDays size={13} aria-hidden="true" />{specialist.availability}</li>
        </ul>
        <p className="metric-value">{specialist.rate}</p>
        <div className="specialist-actions">
          <a className="primary-button specialist-link" href={`/tarot/${specialist.id}#booking`}>ရက်ချိန်းယူရန် <ArrowRight size={15} aria-hidden="true" /></a>
          <a className="specialist-profile-link" href={`/tarot/${specialist.id}`}>Profile အပြည့်အစုံ</a>
        </div>
      </div>
    </article>
  );
}
