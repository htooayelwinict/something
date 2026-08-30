import { Clock3, Compass, MoonStar } from "lucide-react";
import { Dial } from "./dial";
import { MoonPhase } from "./moon-phase";
import { ZodiacGlyph } from "./zodiac-glyph";
import { demoDailyInsight } from "@/lib/content/demo";
import type { DailyCategoryScores, DailyFactor } from "@/lib/astrology/types";
import { toBurmeseDigits } from "@/lib/content/burmese-digits";
import { groupDailyFactors } from "@/lib/content/chart-view";

type DailyFactorView = Pick<DailyFactor, "id" | "source" | "label" | "description" | "house">;

export type DailyInsightView = {
  score: number;
  title: string;
  summary: string;
  favorableWindow: string;
  moonSign: string;
  energy: string;
  focus: string;
  factors?: DailyFactorView[];
  powerNumber?: number;
  categories?: DailyCategoryScores;
  timingStatus?: string;
  horaLord?: string;
  transitMoonSignIndex?: number;
  tithi?: { number: number; paksha: "Shukla" | "Krishna"; name?: string };
};

export function DailyInsight({ data }: { data?: DailyInsightView }) {
  const insight: DailyInsightView = data ?? demoDailyInsight;
  return (
    <article className="dark-card hero-insight">
      <div className="hero-sky" aria-hidden="true" />
      <div className="hero-insight-top">
        {insight.transitMoonSignIndex !== undefined && (
          <div className="hero-sign">
            <ZodiacGlyph signIndex={insight.transitMoonSignIndex} size="lg" label={`ယနေ့ လ ${insight.moonSign}`} />
            {insight.tithi && <MoonPhase tithi={insight.tithi} size={40} />}
          </div>
        )}
        <div>
          <p className="eyebrow">ယနေ့၏ မင်္ဂလာလမ်းညွှန်</p>
          <h2>{insight.title}</h2>
          <p>{insight.summary}</p>
        </div>
      </div>
      <div className="score-row">
        <div>
          <div className="score-value">{toBurmeseDigits(insight.score)}<small>/၁၀၀</small></div>
          <span className="score-caption">ယနေ့ စွမ်းအင်အညွှန်း · {insight.energy}</span>
        </div>
        <Dial score={insight.score} label="ယနေ့ စွမ်းအင်အညွှန်း" size={104} />
      </div>
    </article>
  );
}

export function DailyEvidence({ data }: { data?: DailyInsightView }) {
  const insight: DailyInsightView = data ?? demoDailyInsight;
  const factors: DailyFactorView[] = insight.factors?.length ? insight.factors : [{
    id: "summary.focus",
    source: "transit" as const,
    label: "ဦးစားပေးရမည့်အရာ",
    description: insight.focus,
  }];
  const groups = groupDailyFactors(factors);
  return (
    <details className="daily-evidence-disclosure disclosure-card surface">
      <summary><span>ယနေ့အမှတ်ကို ဘယ်လိုတွက်သလဲ</span><small>အကြောင်းရင်း {toBurmeseDigits(factors.length)} ချက်</small></summary>
      <section className="disclosure-content" aria-labelledby="today-factors">
        <h2 className="sr-only" id="today-factors">ယနေ့ အမှတ်၏ အကြောင်းရင်းများ</h2>
        {groups.map((group) => (
          <div className="factor-group" key={group.source}>
            <h3>{group.label}</h3>
            <ul className="factor-list">
              {group.factors.map((item) => {
                const Icon = item.source === "muhurta" ? Clock3 : item.source === "transit" ? Compass : MoonStar;
                return (
                  <li className="factor-item" key={item.id}>
                    <Icon size={18} aria-hidden="true" />
                    <div><strong>{item.label}{item.house ? <small> · အိမ် {item.house}</small> : null}</strong><span>{item.description}</span></div>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </section>
    </details>
  );
}
