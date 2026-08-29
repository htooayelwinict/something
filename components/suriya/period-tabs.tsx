import type { PeriodKind } from "@/lib/readings/period";

const tabs: Array<{ kind: PeriodKind; href: string; label: string }> = [
  { kind: "daily", href: "/daily", label: "ယနေ့" },
  { kind: "weekly", href: "/daily/week", label: "ဤအပတ်" },
  { kind: "monthly", href: "/daily/month", label: "ဤလ" },
];

export function PeriodTabs({ active }: { active: PeriodKind }) {
  return (
    <nav className="period-tabs" aria-label="ကာလ ရွေးရန်">
      {tabs.map((tab) => (
        <a key={tab.kind} href={tab.href} aria-current={tab.kind === active ? "page" : undefined}>{tab.label}</a>
      ))}
    </nav>
  );
}
