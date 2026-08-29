import { ArrowRight, Clock3 } from "lucide-react";
import { MoonPhase } from "./moon-phase";
import { ZodiacGlyph } from "./zodiac-glyph";

export type DailyBriefView = {
  score: number;
  title: string;
  favorableWindow: string;
  windowAvailable: boolean;
  horaLord?: string;
  moonSign: string;
  transitMoonSignIndex?: number;
  tithi?: { number: number; paksha: "Shukla" | "Krishna"; name?: string };
};

export function DailyBrief({ data, personalized }: { data: DailyBriefView; personalized: boolean }) {
  return (
    <article className="dark-card daily-brief" aria-labelledby="daily-brief-title">
      <div
        className="score-ring"
        style={{ "--score": `${data.score}%` } as React.CSSProperties}
        aria-label={`ယနေ့ စွမ်းအင်အညွှန်း ${data.score} အမှတ်`}
        role="img"
      >
        <span className="daily-brief-score">{data.score}</span>
      </div>
      <div className="daily-brief-copy">
        <p className="eyebrow">ယနေ့ အကျဉ်း · {personalized ? "ကိုယ်ပိုင်" : "နမူနာ"}</p>
        <h2 id="daily-brief-title">{data.title}</h2>
        <p className="daily-brief-meta">
          <Clock3 size={14} aria-hidden="true" />
          {data.windowAvailable ? `သင့်လျော်ချိန် ${data.favorableWindow}${data.horaLord ? ` · ${data.horaLord} Hora` : ""}` : data.favorableWindow}
          <span aria-hidden="true">·</span>
          လ {data.moonSign}
        </p>
        {data.transitMoonSignIndex !== undefined && (
          <p className="daily-brief-sky">
            <ZodiacGlyph signIndex={data.transitMoonSignIndex} size="sm" label={`ယနေ့ လ ${data.moonSign}`} />
            {data.tithi && <MoonPhase tithi={data.tithi} size={26} />}
            <span>{data.tithi?.name}</span>
          </p>
        )}
        <a className="text-link" href="/daily">နေ့စဉ်ဖတ်စာ အပြည့်အစုံ <ArrowRight size={15} aria-hidden="true" /></a>
        <p className="daily-brief-periods"><a href="/daily/week">ဤအပတ်</a><span aria-hidden="true">·</span><a href="/daily/month">ဤလ</a></p>
      </div>
    </article>
  );
}
