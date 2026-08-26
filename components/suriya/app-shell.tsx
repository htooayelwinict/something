import { BottomNav } from "./bottom-nav";
import { TopNav } from "./top-nav";

export function AppShell({
  children,
  rail,
  aside,
}: {
  children: React.ReactNode;
  rail?: React.ReactNode;
  aside?: React.ReactNode;
}) {
  return (
    <div className="cosmic-shell">
      <TopNav />
      <BottomNav />
      <div
        className="cosmic-layout"
        data-with-rail={rail ? "true" : "false"}
        data-with-aside={aside ? "true" : "false"}
      >
        {rail && <aside className="cosmic-rail">{rail}</aside>}
        <main className="page-main cosmic-content" id="main-content">{children}</main>
        {aside && <aside className="cosmic-aside">{aside}</aside>}
      </div>
    </div>
  );
}
