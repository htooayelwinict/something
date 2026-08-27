import type { DashaPeriod } from "@/lib/astrology/types";
import { dashaTimeline } from "@/lib/content/chart-view";

export function DashaTimeline({ dasha, now }: { dasha: { mahadasha: DashaPeriod; antardasha: DashaPeriod }; now: Date }) {
  const timeline = dashaTimeline(dasha, now);
  return (
    <section className="dasha-timeline surface" aria-labelledby="dasha-title">
      <div className="section-title">
        <h2 id="dasha-title">လက်ရှိ ဒဿာကာလ</h2>
        <span className="section-note">Vimshottari</span>
      </div>
      <p className="dasha-lead"><strong>{timeline.mahadashaLabel}</strong> ({timeline.startLabel} – {timeline.endLabel}) အတွင်း <strong>{timeline.antardashaLabel}</strong> ({timeline.antarStartLabel} – {timeline.antarEndLabel})</p>
      <div
        className="dasha-track"
        role="img"
        aria-label={`${timeline.mahadashaLabel} ၏ ${Math.round(timeline.progress * 100)} ရာခိုင်နှုန်း ကုန်လွန်ပြီ`}
        style={{
          "--progress": `${timeline.progress * 100}%`,
          "--antar-start": `${timeline.antarStart * 100}%`,
          "--antar-end": `${timeline.antarEnd * 100}%`,
        } as React.CSSProperties}
      >
        <span className="dasha-antar" />
        <span className="dasha-now" />
      </div>
      <div className="dasha-scale"><span>{timeline.startLabel}</span><span>{timeline.endLabel}</span></div>
    </section>
  );
}
