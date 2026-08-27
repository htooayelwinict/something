import { CircleCheck, Clock3 } from "lucide-react";
import type { NumerologySnapshot } from "@/lib/numerology/calculate";

export function CosmicFingerprint({
  numerology,
  connectedMethods,
}: {
  numerology: NumerologySnapshot;
  connectedMethods: string[];
}) {
  const methods = ["Jyotish · Lahiri", "Numerology"];
  return (
    <section className="cosmic-fingerprint" aria-labelledby="fingerprint-title">
      <div><p className="eyebrow">COSMIC FINGERPRINT</p><h2 id="fingerprint-title">တွက်ချက်ထားသော သင့်ဂဏန်းများ</h2></div>
      <div className="fingerprint-grid">
        <article><span>LIFE PATH</span><strong>{numerology.lifePath}</strong><small>ဘဝလမ်းကြောင်း</small></article>
        <article><span>BIRTH NUMBER</span><strong>{numerology.birthNumber}</strong><small>မွေးရာပါစွမ်းအင်</small></article>
        <article><span>ATTITUDE</span><strong>{numerology.attitudeNumber}</strong><small>ပြင်ပအမြင်</small></article>
      </div>
      <ul className="fingerprint-methods" aria-label="ချိတ်ဆက်ထားသော နည်းလမ်းများ">
        {methods.map((method) => {
          const connected = connectedMethods.includes(method);
          return (
            <li data-connected={connected ? "true" : "false"} key={method}>
              {connected ? <CircleCheck size={14} aria-hidden="true" /> : <Clock3 size={14} aria-hidden="true" />}
              <span>{method}</span><small>{connected ? "တွက်ချက်ပြီး" : "မကြာမီ"}</small>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
