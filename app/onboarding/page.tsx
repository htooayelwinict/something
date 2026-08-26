import type { Metadata } from "next";
import { requireChatGPTUser } from "@/app/chatgpt-auth";
import { AppShell } from "@/components/suriya/app-shell";
import { BirthProfileForm } from "@/components/suriya/birth-profile-form";

export const metadata: Metadata = { title: "မွေးဇာတာ စတင်ရန်" };

export default async function OnboardingPage() {
  const user = await requireChatGPTUser("/onboarding");
  return (
    <AppShell>
      <header className="page-heading">
        <p className="eyebrow">Step 1 of 1</p>
        <h1 className="page-title">သင့်ကောင်းကင်ကို တည်ဆောက်ပါ</h1>
        <p className="page-lede">မွေးဖွားခဲ့သည့် နေရာနှင့် အချိန်အတိအကျမှ သင့်ဇာတာကို တွက်ချက်ပါမယ်။ ဒီအချက်အလက်ကို အများမြင် မပြပါ။</p>
      </header>
      <section className="surface form-card"><BirthProfileForm initialName={user.fullName ?? ""} onboarding /></section>
    </AppShell>
  );
}
