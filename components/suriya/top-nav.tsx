import { CircleUserRound } from "lucide-react";
import { topNavigationLinks } from "@/lib/content/navigation";
import { Brand } from "./brand";

export function TopNav() {
  return (
    <header className="top-nav">
      <div className="top-nav-inner">
        <Brand />
        <nav className="top-nav-links" aria-label="စာမျက်နှာ လမ်းညွှန်">
          {topNavigationLinks.map((item) => <a href={item.href} key={item.href}>{item.label}</a>)}
        </nav>
        <a className="profile-chip" href="/profile">
          <CircleUserRound size={16} aria-hidden="true" />
          <span>ကိုယ်ရေး</span>
        </a>
      </div>
    </header>
  );
}
