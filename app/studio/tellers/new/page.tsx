import type { Metadata } from "next";
import { StudioNoAccess } from "@/components/studio/studio-no-access";
import { StudioShell } from "@/components/studio/studio-shell";
import { emptyTeller, TellerForm } from "@/components/studio/teller-form";
import { requireStaff } from "@/lib/auth/staff";

export const metadata: Metadata = { title: "Studio · ပညာရှင် အသစ်", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default async function NewTellerPage() {
  const staff = await requireStaff("/studio/tellers/new");
  if (staff.role !== "editor") return <StudioNoAccess email={staff.user.email} />;
  return (
    <StudioShell staff={staff} current="/studio/tellers">
      <header className="page-heading"><p className="eyebrow">Studio · ပညာရှင်များ</p><h1 className="page-title">ပညာရှင် အသစ် ထည့်ရန်</h1><p className="page-lede">ID သည် အများမြင် URL (/tarot/ID) ဖြစ်ပြီး နောက်မှ ပြောင်း၍ မရပါ။</p></header>
      <section className="surface form-card"><TellerForm mode="create" initial={emptyTeller} /></section>
    </StudioShell>
  );
}
