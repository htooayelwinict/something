import { ArrowRight } from "lucide-react";

const routes = [
  { href: "/daily", glyph: "☉", title: "နေ့စဉ်ဖတ်စာ", description: "ယနေ့ · အပတ်စဉ် · လစဉ် ဖတ်စာ၊ အချက်များနှင့် သင့်လျော်ချိန်", tone: "green" },
  { href: "/ask", glyph: "✶", title: "သုရိယကို မေးရန်", description: "မွေးဇာတာ၊ မေးချိန်ဇာတာ သို့မဟုတ် အချိန်ရွေးချယ်မှုဖြင့် ကိုယ်ပိုင်မေးခွန်း", tone: "plum" },
  { href: "/tarot", glyph: "✦", title: "Tarot ဆွေးနွေးမှု", description: "လူသားအမြင် လိုအပ်ပါက Tarot ပညာရှင်နှင့် လူချင်းတွေ့ ဆွေးနွေးမှု ရက်ချိန်းယူရန်", tone: "gold" },
  { href: "/chart", glyph: "☾", title: "မွေးဇာတာ", description: "လဂ်၊ ဂြိုဟ်တည်နေရာနှင့် ဒဿာကာလကို ဇာတာပုံဖြင့် ကြည့်ရန်", tone: "paper" },
] as const;

export function RouteCards() {
  return (
    <nav className="route-cards" aria-label="အဓိက စာမျက်နှာများ">
      {routes.map((route) => (
        <a className="route-card portal-card" data-tone={route.tone} href={route.href} key={route.href}>
          <span className="route-card-icon" aria-hidden="true">{route.glyph}</span>
          <span className="route-card-copy">
            <strong>{route.title}</strong>
            <span>{route.description}</span>
          </span>
          <ArrowRight size={16} aria-hidden="true" />
        </a>
      ))}
    </nav>
  );
}
