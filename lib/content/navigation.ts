export const navigationItems = [
  { href: "/", label: "ပင်မ", icon: "home" },
  { href: "/daily", label: "နေ့စဉ်", icon: "daily" },
  { href: "/ask", label: "မေးရန်", icon: "ask", featured: true },
  { href: "/tarot", label: "Tarot", icon: "tarot" },
  { href: "/profile", label: "ကိုယ်ရေး", icon: "profile" },
] as const;

export type NavigationItem = (typeof navigationItems)[number];
