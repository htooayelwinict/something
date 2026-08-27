import type { CelestialChart } from "@/lib/astrology/types";
import { zodiacSignsMyanmar } from "@/lib/astrology/types";
import { formatDegree, planetAbbreviation, planetLabel } from "@/lib/content/chart-view";

export function PlacementList({ chart, id = "placement-list" }: { chart: CelestialChart; id?: string }) {
  const grahas = chart.planets.filter((planet) => planet.category !== "outer");
  const outer = chart.planets.filter((planet) => planet.category === "outer");
  const row = (planet: (typeof chart.planets)[number]) => (
    <tr key={planet.name}>
      <th scope="row"><b>{planetAbbreviation(planet.name)}</b> {planetLabel(planet.name)} <small>{planet.name}</small></th>
      <td>{zodiacSignsMyanmar[planet.signIndex]} <small>{planet.sign}</small></td>
      <td className="numeric">{formatDegree(planet.degreeInSign)}</td>
      <td className="numeric">{planet.house}</td>
      <td>{planet.retrograde ? "ဆုတ်ယုတ် (R)" : "ပုံမှန်"}</td>
    </tr>
  );
  return (
    <section className="placement-list surface" aria-labelledby={`${id}-title`} id={id}>
      <div className="section-title"><h2 id={`${id}-title`}>ဂြိုဟ်တည်နေရာများ</h2><span className="section-note">လဂ်: {zodiacSignsMyanmar[chart.ascendant.signIndex]} {formatDegree(chart.ascendant.degreeInSign)}</span></div>
      <div className="table-scroll">
        <table>
          <thead>
            <tr><th scope="col">ဂြိုဟ်</th><th scope="col">ရာသီ</th><th scope="col">ဒီဂရီ</th><th scope="col">အိမ်</th><th scope="col">အခြေအနေ</th></tr>
          </thead>
          <tbody>{grahas.map(row)}</tbody>
        </table>
      </div>
      {outer.length > 0 && (
        <details className="outer-planets">
          <summary>အပြင်ဂြိုဟ်များ (ပြသရန်သာ · Jyotish တွက်ချက်မှုတွင် မပါ)</summary>
          <div className="table-scroll">
            <table>
              <tbody>{outer.map(row)}</tbody>
            </table>
          </div>
        </details>
      )}
    </section>
  );
}
