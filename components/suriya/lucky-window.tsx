import { Clock3 } from "lucide-react";

export function LuckyWindow({ favorableWindow, available, horaLord, timingStatus, timing }: {
  favorableWindow: string;
  available: boolean;
  horaLord?: string;
  timingStatus: string;
  timing?: { sunrise: string; sunset: string; rahuKalam: string } | null;
}) {
  return (
    <section className="lucky-window" aria-labelledby="lucky-window-title">
      <div className="lucky-window-heading">
        <span className="metric-icon"><Clock3 size={18} aria-hidden="true" /></span>
        <div><p className="eyebrow">တွက်ချက်ထားသော အချိန်</p><h2 id="lucky-window-title">အလုပ်စတင်ရန် တွက်ချက်ထားသောအချိန်</h2></div>
      </div>
      {available && (
        <div className="lucky-window-track" aria-label={`တွက်ချက်ထားသော သင့်လျော်ချိန် ${favorableWindow}`}>
          <span>နေထွက် {timing?.sunrise ?? ""}</span><strong>{favorableWindow}</strong><span>နေဝင် {timing?.sunset ?? ""}</span>
        </div>
      )}
      {available && timing && (
        <dl className="lucky-window-facts">
          <div><dt>Hora</dt><dd>{horaLord}</dd></div>
          <div><dt>Rahu Kalam (ရှောင်ရန်)</dt><dd>{timing.rahuKalam}</dd></div>
          <div><dt>အခြေအနေ</dt><dd>{timingStatus}</dd></div>
        </dl>
      )}
      <p>{available
        ? "နေထွက်မှ နေဝင်အထိ Hora ၁၂ ခုအနက် Rahu Kalam မထိသော၊ Panchanga အရ သင့်လျော်ဆုံးအချိန်ကို ရွေးထားသည်။ အာမခံချက်မဟုတ်ဘဲ လမ်းညွှန်သာဖြစ်သည်။"
        : favorableWindow}</p>
    </section>
  );
}
