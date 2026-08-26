import { zodiacSigns } from "@/lib/astrology/types";

const chartOrder: Array<number | "center"> = [11, 0, 1, 2, 10, "center", "center", 3, 9, "center", "center", 4, 8, 7, 6, 5];

export function SouthIndianChart({ title, placements }: {
  title: string;
  placements: Record<string, number>;
}) {
  const bySign = Array.from({ length: 12 }, (_, sign) => Object.entries(placements)
    .filter(([, placement]) => placement === sign)
    .map(([name]) => name === "Ascendant" ? "Asc" : name.slice(0, 3)));
  return (
    <figure>
      <figcaption className="field-label">{title}</figcaption>
      <div className="chart-grid" role="img" aria-label={`${title} ရာသီခွင်ဇယား`}>
        {chartOrder.map((sign, index) => sign === "center" ? (
          <span className="chart-cell" data-center="true" key={`center-${index}`} aria-hidden="true" />
        ) : (
          <span className="chart-cell" key={sign}>
            <strong>{zodiacSigns[sign].slice(0, 3)}</strong>
            <span>{bySign[sign].join(" · ") || "—"}</span>
          </span>
        ))}
      </div>
      <span className="sr-only">{Object.entries(placements).map(([planet, sign]) => `${planet}: ${zodiacSigns[sign]}`).join("; ")}</span>
    </figure>
  );
}
