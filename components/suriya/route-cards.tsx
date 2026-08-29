import { ArrowRight, MessageCircleMore, Orbit, Sparkles, SunMedium } from "lucide-react";

const routes = [
  { href: "/daily", icon: SunMedium, title: "နေ့စဉ်ဖတ်စာ", description: "ယနေ့ · အပတ်စဉ် · လစဉ် ဖတ်စာ၊ အချက်များနှင့် သင့်လျော်ချိန်", tone: "green" },
  { href: "/ask", icon: MessageCircleMore, title: "သုရိယကို မေးရန်", description: "မွေးဇာတာ၊ မေးချိန်ဇာတာ သို့မဟုတ် အချိန်ရွေးချယ်မှုဖြင့် ကိုယ်ပိုင်မေးခွန်း", tone: "plum" },
  { href: "/tarot", icon: Sparkles, title: "Tarot ဆွေးနွေးမှု", description: "လူသားအမြင် လိုအပ်ပါက Tarot ပညာရှင်နှင့် လူချင်းတွေ့ ဆွေးနွေးမှု ရက်ချိန်းယူရန်", tone: "gold" },
  { href: "/chart", icon: Orbit, title: "မွေးဇာတာ", description: "လဂ်၊ ဂြိုဟ်တည်နေရာနှင့် ဒဿာကာလကို ဇာတာပုံဖြင့် ကြည့်ရန်", tone: "paper" },
] as const;

export function RouteCards() {
  return (
    <nav className="route-cards" aria-label="အဓိက စာမျက်နှာများ">
      {routes.map((route) => (
        <a className="route-card" data-tone={route.tone} href={route.href} key={route.href}>
          <span className="route-card-icon"><route.icon size={20} aria-hidden="true" /></span>
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
