import { CircleUserRound } from "lucide-react";
import { Brand } from "./brand";

const links = [
  { href: "/", label: "နေ့စဉ်ဖတ်စာ" },
  { href: "/tarot", label: "နည်းလမ်းများ" },
  { href: "/readings", label: "သိမ်းထားသည်" },
];

export function TopNav() {
  return (
    <header className="top-nav">
      <div className="top-nav-inner">
        <Brand />
        <nav className="top-nav-links" aria-label="စာမျက်နှာ လမ်းညွှန်">
          {links.map((item) => <a href={item.href} key={item.href}>{item.label}</a>)}
        </nav>
        <a className="profile-chip" href="/profile">
          <CircleUserRound size={16} aria-hidden="true" />
          <span>ကိုယ်ရေး</span>
        </a>
      </div>
    </header>
  );
}
