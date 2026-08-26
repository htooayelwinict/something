"use client";

import type { TarotSpecialist } from "@/lib/content/demo";
import { useState } from "react";
import { TarotSpecialistCard } from "./tarot-specialist-card";

export type ConsultantCategory = "all" | "love" | "career" | "direction";

const categoryTags: Record<Exclude<ConsultantCategory, "all">, string[]> = {
  love: ["ချစ်ရေး", "စိတ်ခံစားမှု"],
  career: ["အလုပ်အကိုင်", "စီးပွားရေး"],
  direction: ["ဘဝလမ်းကြောင်း", "ဆုံးဖြတ်ချက်"],
};

export function matchesConsultantCategory(tags: string[], category: ConsultantCategory) {
  return category === "all" || tags.some((tag) => categoryTags[category].includes(tag));
}

const categories: Array<{ id: ConsultantCategory; label: string }> = [
  { id: "all", label: "အားလုံး" },
  { id: "love", label: "ချစ်ရေး" },
  { id: "career", label: "အလုပ်အကိုင်" },
  { id: "direction", label: "ဘဝလမ်းကြောင်း" },
];

export function ConsultantDirectory({ specialists }: { specialists: TarotSpecialist[] }) {
  const [category, setCategory] = useState<ConsultantCategory>("all");
  const visible = specialists.filter((specialist) => matchesConsultantCategory(specialist.tags, category));
  return (
    <>
      <div className="consultant-categories" role="group" aria-label="အကြံပေး အမျိုးအစားများ">
        {categories.map((item) => (
          <button
            key={item.id}
            type="button"
            aria-pressed={category === item.id}
            onClick={() => setCategory(item.id)}
          >
            {item.label}
          </button>
        ))}
      </div>
      <section className="tarot-grid" id="consultants" aria-label="Tarot ပညာရှင်များ" aria-live="polite">
        {visible.map((specialist) => <TarotSpecialistCard key={specialist.id} specialist={specialist} />)}
      </section>
    </>
  );
}
