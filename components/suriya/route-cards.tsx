import { ArrowRight } from "lucide-react";

const routes = [
  { href: "/ask", glyph: "✶", title: "ကိုယ်ပိုင်မေးခွန်း မေးရန်", description: "မွေးဇာတာကို အခြေခံပြီး တစ်နေ့ ၃ ကြိမ် အခမဲ့ မေးနိုင်သည်", tone: "plum" },
  { href: "/tarot", glyph: "✦", title: "လူချင်းတွေ့ Tarot ဆွေးနွေးမှု", description: "လူသားအမြင် လိုအပ်သည့်အခါ ပညာရှင်နှင့် အချိန်ယူ ဆွေးနွေးရန်", tone: "gold" },
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
