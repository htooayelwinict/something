export const navigationItems = [
  { href: "/", label: "ပင်မ", icon: "home" },
  { href: "/daily", label: "နေ့စဉ်", icon: "daily" },
  { href: "/ask", label: "မေးရန်", icon: "ask", featured: true },
  { href: "/tarot", label: "Tarot", icon: "tarot" },
  { href: "/profile", label: "ကိုယ်ရေး", icon: "profile" },
] as const;

export const topNavigationLinks = [
  { href: "/", label: "ပင်မ" },
  { href: "/daily", label: "နေ့စဉ်ဖတ်စာ" },
  { href: "/chart", label: "မွေးဇာတာ" },
  { href: "/tarot", label: "Tarot ဆွေးနွေးမှု" },
  { href: "/rasi", label: "ရာသီများ" },
  { href: "/readings", label: "သိမ်းထားသည်" },
] as const;

export type NavigationItem = (typeof navigationItems)[number];
