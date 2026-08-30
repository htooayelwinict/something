"use client";

import { CircleUserRound, MessageCircleMore, Sparkles, SunMedium } from "lucide-react";
import { usePathname } from "next/navigation";
import { isPrimaryDestinationCurrent, navigationItems } from "@/lib/content/navigation";

const icons = { today: SunMedium, ask: MessageCircleMore, tarot: Sparkles, profile: CircleUserRound };

export function BottomNav() {
  const pathname = usePathname();
  return (
    <nav className="bottom-nav" aria-label="အဓိက လမ်းညွှန်">
      {navigationItems.map((item) => {
        const Icon = icons[item.icon];
        const current = isPrimaryDestinationCurrent(item.href, pathname);
        return (
          <a
            className="nav-item"
            href={item.href}
            key={item.href}
            aria-current={current ? "page" : undefined}
            aria-label={item.label}
          >
            <Icon size={20} strokeWidth={1.7} aria-hidden="true" />
            <span>{item.label}</span>
          </a>
        );
      })}
    </nav>
  );
}
