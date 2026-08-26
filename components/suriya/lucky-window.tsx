import { Clock3 } from "lucide-react";

export function LuckyWindow({ favorableWindow }: { favorableWindow: string }) {
  return (
    <section className="lucky-window" aria-labelledby="lucky-window-title">
      <div className="lucky-window-heading">
        <span className="metric-icon"><Clock3 size={18} aria-hidden="true" /></span>
        <div><p className="eyebrow">LUCKY WINDOW</p><h2 id="lucky-window-title">အလုပ်စတင်ရန် သင့်လျော်ချိန်</h2></div>
      </div>
      <div className="lucky-window-track" aria-label={`သင့်လျော်ချိန် ${favorableWindow}`}>
        <span>နံနက်</span><strong>{favorableWindow}</strong><span>ညနေ</span>
      </div>
      <p>အရေးကြီးဆုံးလုပ်ဆောင်ချက်တစ်ခုကို ဤအချိန်အတွင်း စတင်ကြည့်ပါ။</p>
    </section>
  );
}
