import type { CelestialChart } from "@/lib/astrology/types";
import { chartKeyFacts } from "@/lib/content/chart-view";

export function ChartKeyFacts({ chart, id }: { chart: CelestialChart; id?: string }) {
  const facts = chartKeyFacts(chart);
  return (
    <dl className="key-facts" id={id} aria-label="အဓိက အချက်များ">
      <div data-tone="gold">
        <dt>လဂ်</dt>
        <dd><strong>{facts.lagna.signMy}</strong><span>{facts.lagna.sign} · {facts.lagna.degree}</span></dd>
      </div>
      {facts.moon && (
        <div data-tone="lilac">
          <dt>လ</dt>
          <dd><strong>{facts.moon.signMy}</strong><span>{facts.moon.nakshatra} · ပါဒ {facts.moon.pada} · အိမ် {facts.moon.house}</span></dd>
        </div>
      )}
      {facts.dasha && (
        <div data-tone="green">
          <dt>ဒဿာ</dt>
          <dd><strong>{facts.dasha.mahadasha} · {facts.dasha.antardasha}</strong><span>အန္တရဒဿာ {facts.dasha.antardashaEnd} အထိ</span></dd>
        </div>
      )}
    </dl>
  );
}
