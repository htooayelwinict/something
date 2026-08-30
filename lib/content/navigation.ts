export const navigationItems = [
  { href: "/", label: "ယနေ့", icon: "today" },
  { href: "/ask", label: "မေးရန်", icon: "ask" },
  { href: "/tarot", label: "Tarot", icon: "tarot" },
  { href: "/profile", label: "ကိုယ်ရေး", icon: "profile" },
] as const;

export const topNavigationLinks = [
  { href: "/", label: "ယနေ့" },
  { href: "/ask", label: "မေးရန်" },
  { href: "/tarot", label: "Tarot" },
] as const;

export function isPrimaryDestinationCurrent(href: string, pathname: string) {
  if (href === "/") return pathname === "/" || pathname === "/daily" || pathname.startsWith("/daily/");
  return pathname === href || pathname.startsWith(`${href}/`);
}

export type NavigationItem = (typeof navigationItems)[number];
