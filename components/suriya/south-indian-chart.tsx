import type { CelestialChart } from "@/lib/astrology/types";
import { buildChartCells, divisionCopy, type Division, type TodayHighlight } from "@/lib/content/chart-view";

const chartOrder: Array<number | "center"> = [11, 0, 1, 2, 10, "center", "center", 3, 9, "center", "center", 4, 8, 7, 6, 5];

export function SouthIndianChart({ chart, division, size = "compact", caption, describedBy, highlights = [] }: {
  chart: CelestialChart;
  division: Division;
  size?: "hero" | "compact";
  caption?: string;
  describedBy?: string;
  highlights?: TodayHighlight[];
}) {
  const cells = buildChartCells(chart, division);
  const copy = divisionCopy[division];
  const title = `${copy.code} · ${copy.nameMy}`;
  return (
    <figure className="chart-figure" data-size={size}>
      <div
        className="chart-grid"
        role="img"
        aria-label={`${title} ဇာတာပုံ`}
        aria-describedby={describedBy}
      >
        {chartOrder.map((entry, index) => {
          if (entry === "center") {
            return index === 5 ? (
              <div className="chart-center" key="center">
                <strong>{copy.code}</strong>
                <span>{copy.nameMy} · {copy.nameEn}</span>
                {caption && <small>{caption}</small>}
              </div>
            ) : null;
          }
          const cell = cells[entry];
          const todays = highlights.filter((item) => item.signIndex === cell.signIndex);
          return (
            <div
              className="chart-cell"
              data-lagna={cell.isLagna ? "true" : undefined}
              data-today={todays.length > 0 ? "true" : undefined}
              key={cell.signIndex}
            >
              <span className="chart-cell-head">
                <span className="chart-sign">{cell.signMy}<small>{cell.sign}</small></span>
                <span className="chart-house">{cell.isLagna ? "လဂ်" : cell.house}</span>
              </span>
              {cell.placements.length > 0 && (
                <span className="chart-placements">
                  {cell.placements.map((placement) => (
                    <span className="chart-planet" data-category={placement.category} key={placement.name}>
                      <b>{placement.abbreviation}</b>
                      {placement.degree && <span>{placement.degree}</span>}
                      {placement.retrograde && <i aria-hidden="true">R</i>}
                    </span>
                  ))}
                </span>
              )}
              {todays.length > 0 && (
                <span className="chart-today">
                  {todays.map((item) => <span aria-label={item.ariaLabel} key={item.planet}>{item.label}</span>)}
                </span>
              )}
            </div>
          );
        })}
      </div>
    </figure>
  );
}
