import Link from "next/link";
import { History } from "lucide-react";
import { BottomNav } from "./bottom-nav";
import { Brand } from "./brand";

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="app-frame">
      <header className="site-header">
        <Brand />
        <Link className="header-action" href="/readings"><History size={15} aria-hidden="true" /> မှတ်တမ်း</Link>
      </header>
      <BottomNav />
      <main className="page-main" id="main-content">{children}</main>
    </div>
  );
}
