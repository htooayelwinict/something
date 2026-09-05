import { Brand } from "@/components/suriya/brand";
import { StarField } from "@/components/suriya/star-field";
import { signOutPath } from "@/lib/auth/paths";
import type { Staff } from "@/lib/auth/roles";
import { studioNav, studioRoleLabels } from "@/lib/content/studio-copy";

export function StudioShell({ staff, current, children }: { staff: Staff; current: string; children: React.ReactNode }) {
  const links = studioNav.map((item) =>
    staff.role === "teller" && item.href === "/studio/tellers"
      ? { href: `/studio/tellers/${staff.specialistId}`, label: "ကျွန်ုပ်၏ Profile" }
      : item,
  );
  return (
    <div className="studio-shell">
      <StarField />
      <header className="studio-bar">
        <Brand />
        <span className="studio-word">Studio</span>
        <span className="role-badge">{studioRoleLabels[staff.role]}</span>
        <nav className="studio-nav" aria-label="Studio လမ်းညွှန်">
          {links.map((item) => <a key={item.href} href={item.href} aria-current={current === item.href ? "page" : undefined}>{item.label}</a>)}
          <a href={signOutPath("/")}>ထွက်မည်</a>
        </nav>
      </header>
      <main className="studio-main" id="main-content">{children}</main>
    </div>
  );
}
