import type { ChartSnapshot } from "@/lib/astrology/types";
import { SouthIndianChart } from "./south-indian-chart";

export function ChartGrid({ chart }: { chart: ChartSnapshot }) {
  return (
    <section className="surface prose-card" aria-labelledby="chart-title">
      <div className="section-title"><h2 id="chart-title">သင့်ဇာတာ အကျဉ်း</h2></div>
      <div className="history-grid">
        <SouthIndianChart title="D1 · RASI" placements={chart.divisional.d1} />
        <SouthIndianChart title="D9 · NAVAMSA" placements={chart.divisional.d9} />
        <SouthIndianChart title="D10 · DASAMSA" placements={chart.divisional.d10} />
      </div>
    </section>
  );
}
