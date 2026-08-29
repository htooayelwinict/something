import { Clock3, Compass, MoonStar } from "lucide-react";
import { Dial } from "./dial";
import { MoonPhase } from "./moon-phase";
import { ZodiacGlyph } from "./zodiac-glyph";
import { demoDailyInsight } from "@/lib/content/demo";
import type { DailyCategoryScores, DailyFactor } from "@/lib/astrology/types";
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
  const factors: DailyFactorView[] = insight.factors?.length ? insight.factors : [{
    id: "summary.focus",
    source: "transit" as const,
    label: "ဦးစားပေးရမည့်အရာ",
    description: insight.focus,
  }];
  const groups = groupDailyFactors(factors);
  return (
    <>
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
            <div className="score-value">{insight.score}<small>/100</small></div>
            <span className="score-caption">ယနေ့ စွမ်းအင်အညွှန်း · {insight.energy}</span>
          </div>
          <Dial score={insight.score} label="ယနေ့ စွမ်းအင်အညွှန်း" size={104} />
        </div>
      </article>
      <div className="metrics-grid">
        <article className="surface metric-card">
          <span className="metric-icon"><Clock3 size={19} aria-hidden="true" /></span>
          <p className="metric-label">တွက်ချက်ထားသော သင့်လျော်ချိန်</p><p className="metric-value">{insight.favorableWindow}</p>
          {insight.horaLord && <small className="metric-note">{insight.horaLord} Hora · {insight.timingStatus}</small>}
        </article>
        <article className="surface metric-card">
          <span className="metric-icon"><MoonStar size={19} aria-hidden="true" /></span>
          <p className="metric-label">လ ရောက်ရှိရာ</p><p className="metric-value">{insight.moonSign}</p>
        </article>
      </div>
      <section className="surface prose-card" aria-labelledby="today-factors">
        <div className="section-title"><h2 id="today-factors">ယနေ့ အမှတ်၏ အကြောင်းရင်းများ</h2><span className="section-note">အချက် {factors.length}</span></div>
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
    </>
  );
}
