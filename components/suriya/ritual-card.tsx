import { Sparkles } from "lucide-react";

export function RitualCard({ lifePath }: { lifePath: number }) {
  return (
    <aside className="ritual-card">
      <span className="ritual-symbol" aria-hidden="true"><Sparkles size={20} /></span>
      <div>
        <p className="eyebrow">TODAY’S RITUAL</p>
        <h2>ဂဏန်း {lifePath} အတွက် အာရုံတည်စေမည့် မိနစ်တို</h2>
        <p>အသက်ရှူသံကို {lifePath} ကြိမ် ရေတွက်ပြီး ယနေ့ပြီးမြောက်လိုသည့်အရာတစ်ခုကို စာတစ်ကြောင်းရေးပါ။</p>
      </div>
    </aside>
  );
}
