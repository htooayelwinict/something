import { ArrowRight, Star } from "lucide-react";
import type { TarotSpecialist } from "@/lib/content/demo";

export function TarotSpecialistCard({ specialist }: { specialist: TarotSpecialist }) {
  return (
    <article className="surface specialist-card">
      <div className="specialist-visual">
        <span className="availability">Preview · {specialist.availability}</span>
        <span className="specialist-monogram" aria-hidden="true">{specialist.initials}</span>
      </div>
      <div className="specialist-body">
        <h2>{specialist.name}</h2>
        <p className="specialist-meta">{specialist.specialty} · {specialist.experience}</p>
        <div className="tag-row">{specialist.tags.map((tag) => <span className="tag" key={tag}>{tag}</span>)}</div>
        <p className="metric-value">{specialist.rate}</p>
        <p className="preview-note"><Star size={13} aria-hidden="true" /> အကြံပေး၏ profile ကို ကြည့်နိုင်ပါပြီ။ တိုက်ရိုက်ဆွေးနွေးမှုကို မဖွင့်ရသေးပါ။</p>
        <a className="secondary-button specialist-link" href={`/tarot/${specialist.id}`}>Profile ကြည့်ရန် <ArrowRight size={15} aria-hidden="true" /></a>
      </div>
    </article>
  );
}
