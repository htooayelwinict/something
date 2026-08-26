import type { Metadata } from "next";
import { requireChatGPTUser } from "@/app/chatgpt-auth";
import { AppShell } from "@/components/suriya/app-shell";
import { BirthProfileForm } from "@/components/suriya/birth-profile-form";

export const metadata: Metadata = { title: "မွေးဇာတာ စတင်ရန်" };

export default async function OnboardingPage() {
  const user = await requireChatGPTUser("/onboarding");
  return (
    <AppShell>
      <ol className="onboarding-progress" aria-label="စတင်ခြင်း အဆင့်များ">
        <li data-state="complete"><span>1</span><strong>အကောင့်</strong></li>
        <li data-state="current"><span>2</span><strong>မွေးဖွားမှု</strong></li>
        <li><span>3</span><strong>တွက်ချက်မှု</strong></li>
      </ol>
      <header className="page-heading">
        <p className="eyebrow">STEP 2 OF 3 · BIRTH DATA</p>
        <h1 className="page-title">သင့်ကောင်းကင်ကို တည်ဆောက်ပါ</h1>
        <p className="page-lede">မွေးဖွားခဲ့သည့် နေရာနှင့် အချိန်အတိအကျမှ သင့်ဇာတာကို တွက်ချက်ပါမယ်။ ဒီအချက်အလက်ကို အများမြင် မပြပါ။</p>
      </header>
      <section className="surface form-card onboarding-card"><BirthProfileForm initialName={user.fullName ?? ""} onboarding /></section>
    </AppShell>
  );
}
