import type { ChartSnapshot } from "@/lib/astrology/types";
import { isReadingSnapshot, readingChart, type ReadingSnapshotLike } from "@/lib/readings/snapshot";

export type ReadingSource = {
  id: "ascendant" | "moon" | "numerology" | "question_time" | "window" | "hora" | "panchanga";
  label: string;
  value: string;
};

function isNatalChart(chart: ReturnType<typeof readingChart>): chart is ChartSnapshot {
  return chart.role === "natal" && "numerology" in chart;
}

function localInstant(instant: string, timezone: string): string {
  return new Intl.DateTimeFormat("my-MM", {
    timeZone: timezone,
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(instant));
}

export function extractReadingSources(snapshot: ReadingSnapshotLike): ReadingSource[] {
  const chart = readingChart(snapshot);
  const moon = chart.planets.find((planet) => planet.name === "Moon");
  if (!moon) return [];

  if (isReadingSnapshot(snapshot) && snapshot.technique === "prashna") {
    return [
      { id: "question_time", label: "QUESTION TIME", value: localInstant(snapshot.context.askedAt, chart.location.timezone) },
      { id: "ascendant", label: "QUESTION ASC", value: chart.ascendant.sign },
      { id: "moon", label: "QUESTION MOON", value: `${moon.sign} · House ${moon.house}` },
    ];
  }

  if (isReadingSnapshot(snapshot) && snapshot.technique === "muhurta") {
    const window = snapshot.context.window;
    return [
      { id: "window", label: "CANDIDATE WINDOW", value: window?.label ?? "No remaining interval" },
      { id: "hora", label: "PLANETARY HORA", value: window ? `${window.horaLord} Hora` : "—" },
      { id: "panchanga", label: "PANCHANGA", value: `${chart.panchanga.tithi.name} · ${chart.panchanga.nakshatra.name}` },
    ];
  }

  if (!isNatalChart(chart)) return [];
  return [
    { id: "ascendant", label: "ASCENDANT", value: chart.ascendant.sign },
    { id: "moon", label: "MOON", value: `${moon.sign} · House ${moon.house}` },
    { id: "numerology", label: "LIFE PATH", value: String(chart.numerology.lifePath) },
  ];
}

export function ReadingSources({ chart }: { chart: ReadingSnapshotLike }) {
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
