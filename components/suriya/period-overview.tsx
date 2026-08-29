import { toBurmeseDigits } from "@/lib/content/burmese-digits";
import { planetLabel } from "@/lib/content/chart-view";
import type { PeriodEvidence } from "@/lib/readings/period-evidence";

function dayLabel(evidence: PeriodEvidence, date: string) {
  const day = evidence.days.find((item) => item.date === date);
  return day ? `${day.weekday} ${toBurmeseDigits(Number(date.slice(-2)))}` : toBurmeseDigits(date);
}

export function PeriodOverview({ evidence }: { evidence: PeriodEvidence }) {
  const { summary, dasha, transits } = evidence;
  const moonSigns = [...new Set(transits.moonPath.map((step) => step.signMy))];
  return (
    <section className="surface period-overview" aria-labelledby="period-overview-title">
      <div className="section-title"><h2 id="period-overview-title">ကာလ အကျဉ်းချုပ်</h2><span className="section-note">{evidence.label}</span></div>
      <dl>
        <div><dt>ပျမ်းမျှ အမှတ်</dt><dd><strong className="period-score">{toBurmeseDigits(summary.averageScore)}</strong><small>/၁၀၀</small></dd></div>
        <div><dt>အကောင်းဆုံးရက်များ</dt><dd>{summary.bestDays.map((date) => <span className="period-day" data-tone="good" key={date}>{dayLabel(evidence, date)}</span>)}</dd></div>
        <div><dt>သတိထားရမည့်ရက်များ</dt><dd>{summary.cautionDays.map((date) => <span className="period-day" data-tone="caution" key={date}>{dayLabel(evidence, date)}</span>)}</dd></div>
        <div>
          <dt>ဒဿာ</dt>
          <dd>
            {planetLabel(dasha.mahadasha.lord)} · {planetLabel(dasha.antardasha.lord)}
            {dasha.changeInside && <small className="period-note">{dayLabel(evidence, dasha.changeInside.on)} တွင် {planetLabel(dasha.changeInside.to)} အန္တရဒဿာသို့ ပြောင်းမည်</small>}
          </dd>
        </div>
        <div><dt>လ လမ်းကြောင်း</dt><dd className="moon-path">{moonSigns.map((sign) => <span key={sign}>{sign}</span>)}</dd></div>
      </dl>
    </section>
  );
}
