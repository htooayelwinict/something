"use client";

import { CircleUserRound, House, MessageCircleMore, MoonStar, Sparkles } from "lucide-react";
import { usePathname } from "next/navigation";
import { navigationItems } from "@/lib/content/navigation";

const icons = { home: House, daily: Sparkles, ask: MessageCircleMore, tarot: MoonStar, profile: CircleUserRound };

export function BottomNav() {
  const pathname = usePathname();
  return (
    <nav className="bottom-nav" aria-label="အဓိက လမ်းညွှန်">
      {navigationItems.map((item) => {
        const Icon = icons[item.icon];
        const current = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
        return (
          <a
            className={`nav-item${item.featured ? " nav-item-ask" : ""}`}
            href={item.href}
            key={item.href}
            aria-current={current ? "page" : undefined}
            aria-label={item.featured ? "ဗေဒင် မေးမြန်းရန်" : item.label}
          >
            <Icon size={item.featured ? 23 : 20} strokeWidth={1.7} aria-hidden="true" />
            <span>{item.label}</span>
          </a>
        );
      })}
    </nav>
  );
}
