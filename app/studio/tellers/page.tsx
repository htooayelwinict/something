import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { StudioNoAccess } from "@/components/studio/studio-no-access";
import { StudioShell } from "@/components/studio/studio-shell";
import { listSpecialists } from "@/db/repositories/specialists";
import { requireStaff } from "@/lib/auth/staff";
import { studioMessages } from "@/lib/content/studio-copy";

export const metadata: Metadata = { title: "Studio · ပညာရှင်များ", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default async function StudioTellersPage() {
  const staff = await requireStaff("/studio/tellers");
  if (staff.role === "none") return <StudioNoAccess email={staff.user.email} />;
  if (staff.role === "teller") redirect(`/studio/tellers/${staff.specialistId}`);
  const tellers = await listSpecialists({ includeInactive: true }).catch(() => null);
  return (
    <StudioShell staff={staff} current="/studio/tellers">
      <header className="page-heading"><p className="eyebrow">Studio · ပညာရှင်များ</p><h1 className="page-title">Tarot ပညာရှင်များ</h1></header>
      <div className="studio-actions"><a className="primary-button" href="/studio/tellers/new">ပညာရှင် အသစ် ထည့်ရန်</a></div>
      {tellers ? (
        <div className="table-scroll">
          <table className="data-table">
            <thead><tr><th scope="col">အမည်</th><th scope="col">ID</th><th scope="col">ပြသမှု</th><th scope="col">ဝင်ရောက်ရန် Gmail</th><th scope="col">အစီအစဉ်</th></tr></thead>
            <tbody>
              {tellers.map((teller) => (
                <tr key={teller.id}>
                  <td><a href={`/studio/tellers/${teller.id}`}>{teller.name}</a></td>
                  <td>{teller.id}</td>
                  <td><span className="status-badge" data-status={teller.isActive ? "confirmed" : "cancelled"}>{teller.isActive ? "ပြသနေ" : "ရပ်ထား"}</span></td>
                  <td>{teller.loginEmail ?? "—"}</td>
                  <td>{teller.sortOrder}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : <p className="empty-state">{studioMessages.db_unavailable}</p>}
    </StudioShell>
  );
}
