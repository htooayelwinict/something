import { Headphones, Star } from "lucide-react";
import type { TarotSpecialist } from "@/lib/content/demo";

export function TarotSpecialistCard({ specialist }: { specialist: TarotSpecialist }) {
  return (
    <article className="surface specialist-card">
      <div className="specialist-visual">
        <span className="availability">{specialist.availability}</span>
        <span className="specialist-monogram" aria-hidden="true">{specialist.initials}</span>
      </div>
      <div className="specialist-body">
        <h2>{specialist.name}</h2>
        <p className="specialist-meta">{specialist.specialty} · {specialist.experience}</p>
        <div className="tag-row">{specialist.tags.map((tag) => <span className="tag" key={tag}>{tag}</span>)}</div>
        <p className="metric-value">{specialist.rate}</p>
        <details className="preview-details">
          <summary><Headphones size={16} aria-hidden="true" /> ဆွေးနွေးမှု အစမ်းကြည့်ရန်</summary>
          <p className="preview-note"><Star size={13} aria-hidden="true" /> တိုက်ရိုက်ဆွေးနွေးခြင်းနှင့် ငွေပေးချေမှုကို မကြာမီ ထည့်သွင်းပေးပါမည်။ ယခုနှိပ်ခြင်းဖြင့် booking မပြုလုပ်ပါ။</p>
        </details>
      </div>
    </article>
  );
}
