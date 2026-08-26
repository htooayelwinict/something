import type { Metadata } from "next";
import { LogIn, LogOut } from "lucide-react";
import { chatGPTSignInPath, chatGPTSignOutPath, getChatGPTUser } from "@/app/chatgpt-auth";
import { AppShell } from "@/components/suriya/app-shell";
import { BirthProfileForm } from "@/components/suriya/birth-profile-form";

export const metadata: Metadata = { title: "ကိုယ်ရေးအချက်အလက်" };

export default async function ProfilePage() {
  const user = await getChatGPTUser();
  return (
    <AppShell>
      <header className="page-heading">
        <p className="eyebrow">Private profile</p>
        <h1 className="page-title">ကိုယ်ရေးအချက်အလက်</h1>
        <p className="page-lede">သင့်မွေးဇာတာတွက်ချက်မှုအတွက် အသုံးပြုသော ကိုယ်ပိုင်အချက်အလက်များကို ကြည့်ရှုပြင်ဆင်နိုင်ပါတယ်။</p>
      </header>
      {user ? (
        <div className="profile-layout">
          <section className="surface form-card"><BirthProfileForm initialName={user.fullName ?? ""} /></section>
          <aside className="surface prose-card">
            <p className="eyebrow">အကောင့်</p><h2>{user.displayName}</h2><p className="page-lede">သင့်ပရိုဖိုင်နှင့် ဖတ်ကြားမှုများကို အကောင့် ID ဖြင့် သီးခြားပိုင်ဆိုင်မှု စစ်ဆေးထားပါတယ်။</p>
            <a className="ghost-button" href={chatGPTSignOutPath("/")}><LogOut size={16} aria-hidden="true" /> ထွက်မည်</a>
          </aside>
        </div>
      ) : (
        <section className="surface empty-state"><LogIn size={34} aria-hidden="true" /><h2>အကောင့်နှင့် ချိတ်ဆက်ပါ</h2><p>မွေးဖွားမှုအချက်အလက်နှင့် ဖတ်ကြားမှုများကို လုံခြုံစွာ သိမ်းရန် ဝင်ရောက်ပါ။</p><a className="primary-button" href={chatGPTSignInPath("/profile")}>ChatGPT ဖြင့် ဝင်ရောက်မည်</a></section>
      )}
    </AppShell>
  );
}
