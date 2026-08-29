import { ArrowRight, Sparkles } from "lucide-react";
import { toBurmeseDigits } from "@/lib/content/burmese-digits";

function resetLabel(resetsAt: string) {
  const time = new Intl.DateTimeFormat("en-GB", { hour: "2-digit", minute: "2-digit", hourCycle: "h23", timeZone: "Asia/Yangon" }).format(new Date(resetsAt));
  return `မနက်ဖြန် ${toBurmeseDigits(time)} တွင် အခမဲ့မေးခွန်း ၃ ခု ပြန်ရပါမည်။`;
}

export function TarotUpsell({ variant, resetsAt }: { variant: "inline" | "quota"; resetsAt?: string }) {
  if (variant === "quota") {
    return (
      <section className="tarot-upsell" data-variant="quota" aria-labelledby="quota-title">
        <span className="tarot-upsell-icon"><Sparkles size={20} aria-hidden="true" /></span>
        <div className="tarot-upsell-copy">
          <p className="eyebrow">DAILY LIMIT REACHED</p>
          <h2 id="quota-title">ယနေ့ အခမဲ့မေးခွန်း ကုန်သွားပါပြီ</h2>
          <p>{resetsAt ? resetLabel(resetsAt) : "မနက်ဖြန် အခမဲ့မေးခွန်း ၃ ခု ပြန်ရပါမည်။"} ယခုပင် နက်နက်နဲနဲ ဆွေးနွေးလိုပါက Tarot ပညာရှင်နှင့် လူချင်းတွေ့ ရက်ချိန်းယူနိုင်ပါသည်။</p>
        </div>
        <a className="primary-button" href="/tarot">Tarot ရက်ချိန်းယူရန် <ArrowRight size={15} aria-hidden="true" /></a>
      </section>
    );
  }
  return (
    <aside className="tarot-upsell" data-variant="inline" aria-label="Tarot ဆွေးနွေးမှု">
      <span className="tarot-upsell-icon"><Sparkles size={18} aria-hidden="true" /></span>
      <div className="tarot-upsell-copy">
        <strong>လူသားအမြင် လိုအပ်ပါသလား။</strong>
        <p>Tarot ပညာရှင်နှင့် ၃၀ မိနစ် လူချင်းတွေ့ ဆွေးနွေးနိုင်ပါသည်။ ဆွေးနွေးချိန်တွင်သာ ငွေပေးချေပါ။</p>
      </div>
      <a className="secondary-button" href="/tarot">ရက်ချိန်းယူရန် <ArrowRight size={15} aria-hidden="true" /></a>
    </aside>
  );
}
