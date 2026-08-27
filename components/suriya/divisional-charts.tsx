import type { CelestialChart } from "@/lib/astrology/types";
import { divisionCopy } from "@/lib/content/chart-view";
import { SouthIndianChart } from "./south-indian-chart";

export function DivisionalCharts({ chart }: { chart: CelestialChart }) {
  return (
    <section className="divisional-charts" aria-labelledby="divisional-title">
      <div className="section-title"><h2 id="divisional-title">အသေးစိတ်ဇာတာများ</h2><span className="section-note">D9 · D10</span></div>
      <div className="divisional-grid">
        {(["d9", "d10"] as const).map((division) => (
          <details className="divisional-panel surface" key={division}>
            <summary>
              <span><strong>{divisionCopy[division].code} · {divisionCopy[division].nameMy}</strong><span>{divisionCopy[division].purpose}</span></span>
            </summary>
            <SouthIndianChart chart={chart} division={division} size="compact" />
          </details>
        ))}
      </div>
    </section>
  );
}
