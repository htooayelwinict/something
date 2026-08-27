import type { Panchanga } from "@/lib/astrology/types";

export type PanchangaView = { vara: string; tithi: string; nakshatra: string; yoga: string; karana: string };

export function panchangaView(panchanga: Panchanga): PanchangaView {
  return {
    vara: panchanga.vara,
    tithi: `${panchanga.tithi.name} (${panchanga.tithi.paksha})`,
    nakshatra: `${panchanga.nakshatra.name} · ပါဒ ${panchanga.nakshatra.pada}`,
    yoga: panchanga.yoga.name,
    karana: panchanga.karana.name,
  };
}

export function PanchangaStrip({ title, data, note }: { title: string; data: PanchangaView; note?: string }) {
  const items = [
    ["ဝါရ (နေ့)", data.vara],
    ["တိထိ", data.tithi],
    ["နက္ခတ်", data.nakshatra],
    ["ယောဂ", data.yoga],
    ["ကရဏ", data.karana],
  ] as const;
  return (
    <section className="panchanga-strip" aria-label={title}>
      <p className="eyebrow">{title}</p>
      <dl>
        {items.map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}
      </dl>
      {note && <p className="panchanga-note">{note}</p>}
    </section>
  );
}
