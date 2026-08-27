import { CircleCheck, LockKeyhole, Sparkles } from "lucide-react";
import type { NumerologySnapshot } from "@/lib/numerology/calculate";

export function IdentityRail({
  name,
  birthLabel,
  numerology,
  personalized,
}: {
  name: string;
  birthLabel: string;
  numerology: NumerologySnapshot;
  personalized: boolean;
}) {
  const initial = name.trim().slice(0, 1).toUpperCase() || "S";
  return (
    <div className="identity-rail">
      <section className="identity-card" aria-label="Cosmic ID">
        <div className="identity-person">
          <span className="identity-avatar" aria-hidden="true">{initial}</span>
          <div><strong>{name}</strong><span>{birthLabel}</span></div>
        </div>
        <p className="identity-intro">
          {personalized
            ? "သင့်မွေးဖွားမှုအချက်အလက်မှ တွက်ချက်ထားသော Cosmic ID"
            : "နမူနာအချက်အလက်ဖြင့် ပြထားသော Cosmic ID"}
        </p>
        <div className="fingerprint-mini-grid">
          <div><strong>{numerology.lifePath}</strong><span>ဘဝလမ်း</span></div>
          <div><strong>{numerology.birthNumber}</strong><span>မွေးဂဏန်း</span></div>
          <div><strong>{numerology.attitudeNumber}</strong><span>သဘောထား</span></div>
        </div>
        <a className="identity-chart-link" href="/chart">မွေးဇာတာ ကြည့်ရန်</a>
        <a className="identity-profile-link" href="/profile">
          {personalized ? <CircleCheck size={14} aria-hidden="true" /> : <LockKeyhole size={14} aria-hidden="true" />}
          {personalized ? "အခြေခံအချက်အလက် ပြည့်စုံ" : "ကိုယ်ပိုင်ဇာတာ စတင်မည်"}
        </a>
      </section>
      <section className="identity-methods" aria-labelledby="method-title">
        <h2 id="method-title">တွက်ချက်မှုနည်းလမ်း</h2>
        <ul>
          <li><Sparkles size={15} aria-hidden="true" /><span>Jyotish · Lahiri</span><small>အဓိက</small></li>
          <li><CircleCheck size={15} aria-hidden="true" /><span>ဂဏန်းဗေဒင်</span><small>သီးခြား</small></li>
        </ul>
      </section>
    </div>
  );
}
