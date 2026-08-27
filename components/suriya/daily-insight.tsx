import { ArrowRight, Clock3, Compass, MoonStar } from "lucide-react";
import { demoDailyInsight } from "@/lib/content/demo";
import type { DailyCategoryScores, DailyFactor } from "@/lib/astrology/types";

type DailyFactorView = Pick<DailyFactor, "id" | "source" | "label" | "description">;

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
};

export function DailyInsight({ expanded = false, data }: { expanded?: boolean; data?: DailyInsightView }) {
  const insight = data ?? demoDailyInsight;
  const factors = insight.factors?.length ? insight.factors : [{
    id: "summary.focus",
    source: "transit" as const,
    label: "ဦးစားပေးရမည့်အရာ",
    description: insight.focus,
  }];
  return (
    <>
      <article className="dark-card hero-insight">
        <div>
          <p className="eyebrow">ယနေ့၏ မင်္ဂလာလမ်းညွှန် · DAILY ENERGY</p>
          <h2>{insight.title}</h2>
          <p>{insight.summary}</p>
        </div>
        <div className="score-row">
          <div>
            <div className="score-value">{insight.score}<small>/100</small></div>
            <span className="score-caption">ယနေ့ စွမ်းအင်အညွှန်း</span>
          </div>
          <div
            className="score-ring"
            style={{ "--score": `${insight.score}%` } as React.CSSProperties}
            aria-label={`ယနေ့ စွမ်းအင်အညွှန်း ${insight.score} အမှတ်`}
            role="img"
          />
        </div>
      </article>
      <div className="metrics-grid">
        <article className="surface metric-card">
          <span className="metric-icon"><Clock3 size={19} aria-hidden="true" /></span>
          <p className="metric-label">တွက်ချက်ထားသော သင့်လျော်ချိန်</p><p className="metric-value">{insight.favorableWindow}</p>
          {insight.horaLord && <small>{insight.horaLord} Hora · {insight.timingStatus}</small>}
        </article>
        <article className="surface metric-card">
          <span className="metric-icon"><MoonStar size={19} aria-hidden="true" /></span>
          <p className="metric-label">လ ရောက်ရှိရာ</p><p className="metric-value">{insight.moonSign}</p>
        </article>
      </div>
      {expanded ? (
        <section className="surface prose-card" aria-labelledby="today-factors">
          <div className="section-title"><h2 id="today-factors">ယနေ့အတွက် သင့်အမြင်</h2></div>
          <ul className="factor-list">
            {factors.map((item) => {
              const Icon = item.source === "muhurta" ? Clock3 : item.source === "transit" ? Compass : MoonStar;
              return (
                <li className="factor-item" key={item.id}>
                  <Icon size={18} aria-hidden="true" />
                  <div><strong>{item.label}</strong><span>{item.description}</span></div>
                </li>
              );
            })}
          </ul>
        </section>
      ) : (
        <a className="text-link" href="/daily">အသေးစိတ်ဖတ်ရန် <ArrowRight size={15} aria-hidden="true" /></a>
      )}
    </>
  );
}
