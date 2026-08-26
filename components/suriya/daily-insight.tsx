import { ArrowRight, Clock3, Compass, MoonStar } from "lucide-react";
import { demoDailyInsight } from "@/lib/content/demo";

export type DailyInsightView = {
  score: number;
  title: string;
  summary: string;
  favorableWindow: string;
  moonSign: string;
  energy: string;
  focus: string;
  factors?: string[];
  powerNumber?: number;
};

export function DailyInsight({ expanded = false, data }: { expanded?: boolean; data?: DailyInsightView }) {
  const insight = data ?? demoDailyInsight;
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
            aria-label={`ယနေ့ စွမ်းအင် ${insight.score} ရာခိုင်နှုန်း`}
            role="img"
          />
        </div>
      </article>
      <div className="metrics-grid">
        <article className="surface metric-card">
          <span className="metric-icon"><Clock3 size={19} aria-hidden="true" /></span>
          <p className="metric-label">မင်္ဂလာအချိန်</p><p className="metric-value">{insight.favorableWindow}</p>
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
            <li className="factor-item"><Compass size={18} aria-hidden="true" /><div><strong>ဦးစားပေးရမည့်အရာ</strong><span>{insight.factors?.[0] ?? insight.focus}</span></div></li>
            <li className="factor-item"><MoonStar size={18} aria-hidden="true" /><div><strong>စိတ်စွမ်းအင်</strong><span>{insight.energy} — ဆုံးဖြတ်ချက်မချမီ အသက်ရှူချိန်တစ်ခုယူပါ။</span></div></li>
            <li className="factor-item"><Clock3 size={18} aria-hidden="true" /><div><strong>လက်တွေ့လုပ်ဆောင်ရန်</strong><span>{insight.factors?.[1] ?? "နံနက်ပိုင်းမှာ အရေးကြီးဆုံးစာတစ်စောင် သို့မဟုတ် စကားဝိုင်းတစ်ခုကို အပြီးသတ်ပါ။"}</span></div></li>
          </ul>
        </section>
      ) : (
        <a className="text-link" href="/daily">အသေးစိတ်ဖတ်ရန် <ArrowRight size={15} aria-hidden="true" /></a>
      )}
    </>
  );
}
