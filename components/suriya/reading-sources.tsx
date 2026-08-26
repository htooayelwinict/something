import type { ChartSnapshot } from "@/lib/astrology/types";

export type ReadingSource = {
  id: "ascendant" | "moon" | "numerology";
  label: string;
  value: string;
};

export function extractReadingSources(_chart: ChartSnapshot): ReadingSource[] {
  const moon = _chart.planets.find((planet) => planet.name === "Moon")!;
  return [
    { id: "ascendant", label: "ASCENDANT", value: _chart.ascendant.sign },
    { id: "moon", label: "MOON", value: `${moon.sign} · House ${moon.house}` },
    { id: "numerology", label: "LIFE PATH", value: String(_chart.numerology.lifePath) },
  ];
}

export function ReadingSources({ chart }: { chart: ChartSnapshot }) {
  return (
    <section className="reading-sources" aria-labelledby="reading-sources-title">
      <div>
        <p className="eyebrow">SOURCE TRANSPARENCY</p>
        <h2 id="reading-sources-title">ဤအဖြေတွင် အသုံးပြုထားသည်</h2>
      </div>
      <div className="reading-source-grid">
        {extractReadingSources(chart).map((source) => (
          <article key={source.id}><span>{source.label}</span><strong>{source.value}</strong></article>
        ))}
      </div>
    </section>
  );
}
