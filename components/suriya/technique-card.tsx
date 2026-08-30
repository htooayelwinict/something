import { Check, Clock3, Compass, Sparkles } from "lucide-react";
import type { ReadingTechnique } from "@/lib/content/demo";

const icons = { janma: Sparkles, prashna: Compass, muhurta: Clock3 };

export function TechniqueCard({ technique, selected, onSelect }: {
  technique: ReadingTechnique;
  selected: boolean;
  onSelect: (id: ReadingTechnique["id"]) => void;
}) {
  const Icon = icons[technique.id];
  return (
    <label className="technique-card" data-selected={selected}>
      <input type="radio" name="technique" value={technique.id} checked={selected} onChange={() => onSelect(technique.id)} />
      <span className="technique-icon"><Icon size={19} aria-hidden="true" /></span>
      <span><strong>{technique.title}</strong><small>{technique.description}</small></span>
      <span className="selection-dot" aria-hidden="true"><Check size={13} /></span>
      {selected && <span className="sr-only">ရွေးထားသည်</span>}
    </label>
  );
}
