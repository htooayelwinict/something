import { ArrowRight } from "lucide-react";
import type { DailyFactor } from "@/lib/astrology/types";

type FactorView = Pick<DailyFactor, "id" | "source" | "label" | "description" | "house">;

export function TodayConnection({ factors, score }: { factors: FactorView[]; score: number }) {
  const linked = factors.filter((factor) => factor.source === "transit" || factor.source === "dasha");
  return (
    <section className="today-connection surface" aria-labelledby="today-connection-title">
      <div className="section-title">
        <h2 id="today-connection-title">ယနေ့ ဤဇာတာနှင့် ဘယ်လိုဆက်စပ်သလဲ</h2>
        <span className="section-note">ယနေ့ အမှတ် {score}/100</span>
      </div>
      <ul className="factor-list">
        {linked.map((factor) => (
          <li className="factor-item" key={factor.id}>
            <span className="house-pill">{factor.house ? `အိမ် ${factor.house}` : "—"}</span>
            <div><strong>{factor.label}</strong><span>{factor.description}</span></div>
          </li>
        ))}
      </ul>
      <a className="text-link" href="/daily">နေ့စဉ်ဖတ်စာ အပြည့်အစုံ <ArrowRight size={15} aria-hidden="true" /></a>
    </section>
  );
}
