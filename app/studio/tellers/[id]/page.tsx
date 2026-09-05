import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { StudioNoAccess } from "@/components/studio/studio-no-access";
import { StudioShell } from "@/components/studio/studio-shell";
import { TellerForm } from "@/components/studio/teller-form";
import { getSpecialist } from "@/db/repositories/specialists";
import { requireStaff } from "@/lib/auth/staff";
import { tellerFormValues } from "@/lib/studio/teller-form-values";

export const metadata: Metadata = { title: "Studio · ပညာရှင် ပြင်ဆင်ရန်", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default async function EditTellerPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const staff = await requireStaff(`/studio/tellers/${id}`);
  if (staff.role === "none" || (staff.role === "teller" && staff.specialistId !== id)) return <StudioNoAccess email={staff.user.email} />;
  const row = await getSpecialist(id, { includeInactive: true }).catch(() => null);
  if (!row) notFound();
  return (
    <StudioShell staff={staff} current="/studio/tellers">
      <header className="page-heading">
        <p className="eyebrow">Studio · {staff.role === "editor" ? "ပညာရှင်များ" : "ကျွန်ုပ်၏ Profile"}</p>
        <h1 className="page-title">{row.name}</h1>
        <p className="page-lede">အများမြင် စာမျက်နှာ — <a className="text-link" href={`/tarot/${row.id}`}>/tarot/{row.id}</a>{row.isActive ? "" : " (လောလောဆယ် ရပ်ထားသည်)"}</p>
      </header>
      <section className="surface form-card"><TellerForm mode={staff.role === "editor" ? "editor" : "self"} initial={tellerFormValues(row)} /></section>
    </StudioShell>
  );
}
