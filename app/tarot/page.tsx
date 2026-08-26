import type { Metadata } from "next";
import { AppShell } from "@/components/suriya/app-shell";
import { ConsultantDirectory } from "@/components/suriya/consultant-directory";
import { listSpecialists } from "@/db/repositories/specialists";
import { demoSpecialists } from "@/lib/content/demo";

export const metadata: Metadata = { title: "Tarot ဆွေးနွေးမှု" };

export default async function TarotPage() {
  const rows = await listSpecialists().catch(() => []);
  const specialists = rows.length > 0 ? rows.map((row) => ({
    id: row.id,
    name: row.name,
    initials: row.initials,
    specialty: row.specialty,
    experience: row.experience,
    rate: row.displayRate,
    availability: row.availabilityLabel,
    tags: row.tags,
  })) : demoSpecialists;
  return (
    <AppShell>
      <header className="page-heading">
        <p className="eyebrow">HUMAN GUIDANCE · Preview</p>
        <h1 className="page-title">လူသားအကြံပေး ရှာဖွေပါ</h1>
        <p className="page-lede">လူသားအမြင်တစ်ခု လိုအပ်သည့်အခါ ဆက်သွယ်နိုင်မည့် Tarot ပညာရှင်များ၏ profile ကို လေ့လာပါ။ ဆွေးနွေးမှုရက်ချိန်းကို မဖွင့်ရသေးပါ။</p>
      </header>
      <section className="consultant-intro" aria-label="Preview အခြေအနေ">
        <span>PREVIEW DIRECTORY</span><p>အကြံပေးများ၏ အချက်အလက်ကို ကြည့်ရှုရန်သာ ဖြစ်ပြီး ယခုစာမျက်နှာမှ ငွေပေးချေမှု သို့မဟုတ် ရက်ချိန်း မပြုလုပ်ပါ။</p>
      </section>
      <ConsultantDirectory specialists={specialists} />
    </AppShell>
  );
}
