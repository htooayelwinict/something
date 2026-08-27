import { ArrowRight, MessageCircleMore, Orbit, Sparkles } from "lucide-react";

const routes = [
  { href: "/daily", icon: Sparkles, title: "နေ့စဉ်ဖတ်စာ", description: "ယနေ့ အမှတ်၊ အချက်များနှင့် သင့်လျော်ချိန်ကို အပြည့်အစုံ ဖတ်ရန်", tone: "green" },
  { href: "/ask", icon: MessageCircleMore, title: "သုရိယကို မေးရန်", description: "မွေးဇာတာ၊ မေးချိန်ဇာတာ သို့မဟုတ် အချိန်ရွေးချယ်မှုဖြင့် ကိုယ်ပိုင်မေးခွန်း", tone: "plum" },
  { href: "/chart", icon: Orbit, title: "မွေးဇာတာ", description: "လဂ်၊ ဂြိုဟ်တည်နေရာနှင့် ဒဿာကာလကို ဇာတာပုံဖြင့် ကြည့်ရန်", tone: "gold" },
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
