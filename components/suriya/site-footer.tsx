import { Brand } from "./brand";

const links = [
  { href: "/daily", label: "နေ့စဉ်ဖတ်စာ" },
  { href: "/chart", label: "မွေးဇာတာ" },
  { href: "/readings", label: "သိမ်းထားသောဖတ်စာ" },
  { href: "/today", label: "ယနေ့ Panchanga" },
  { href: "/rasi", label: "ရာသီ ၁၂ ခု" },
];

export function SiteFooter() {
  return (
    <footer className="site-footer" aria-label="အောက်ခြေ လမ်းညွှန်">
      <div className="site-footer-inner">
        <div className="site-footer-brand">
          <Brand />
          <p>မြန်မာဘာသာဖြင့် Jyotish (ဝေဒ) ဗေဒင်တွက်ချက်မှုနှင့် ရန်ကုန်ရှိ Tarot ပညာရှင်များနှင့် လူချင်းတွေ့ ဆွေးနွေးမှု။</p>
        </div>
        <nav className="site-footer-links" aria-label="စာမျက်နှာများ">
          {links.map((link) => <a key={link.href} href={link.href}>{link.label}</a>)}
        </nav>
        <p className="site-footer-note">Lahiri ayanamsa · whole-sign · Vimshottari · လမ်းညွှန်အဖြစ်သာ အသုံးပြုပါ</p>
      </div>
    </footer>
  );
}
