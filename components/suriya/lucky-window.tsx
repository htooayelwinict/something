import { Clock3 } from "lucide-react";

export function LuckyWindow({ favorableWindow, available, horaLord, timingStatus }: {
  favorableWindow: string;
  available: boolean;
  horaLord?: string;
  timingStatus: string;
}) {
  return (
    <section className="lucky-window" aria-labelledby="lucky-window-title">
      <div className="lucky-window-heading">
        <span className="metric-icon"><Clock3 size={18} aria-hidden="true" /></span>
        <div><p className="eyebrow">CALCULATED WINDOW</p><h2 id="lucky-window-title">အလုပ်စတင်ရန် တွက်ချက်ထားသောအချိန်</h2></div>
      </div>
      {available && (
        <div className="lucky-window-track" aria-label={`တွက်ချက်ထားသော သင့်လျော်ချိန် ${favorableWindow}`}>
          <span>နေထွက်</span><strong>{favorableWindow}</strong><span>နေဝင်</span>
        </div>
      )}
      <p>{available
        ? `${horaLord} Hora၊ Rahu Kalam နှင့် Panchanga ကို ထည့်တွက်ထားသည်။ အခြေအနေ — ${timingStatus}။`
        : favorableWindow}</p>
    </section>
  );
}
