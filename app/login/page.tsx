import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, ShieldCheck, Sun } from "lucide-react";
import { Brand } from "@/components/suriya/brand";
import { chatGPTSignInPath } from "@/app/chatgpt-auth";

export const metadata: Metadata = { title: "ဝင်ရောက်ရန်" };

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ return_to?: string }> }) {
  const params = await searchParams;
  const returnTo = params.return_to?.startsWith("/") ? params.return_to : "/onboarding";
  return (
    <main className="login-page" id="main-content">
      <div className="login-top"><Brand /></div>
      <section className="login-card">
        <span className="login-orbit"><Sun size={36} strokeWidth={1.25} aria-hidden="true" /></span>
        <div>
          <p className="eyebrow">Your private sky</p>
          <h1>ပြန်လည်ကြိုဆိုပါတယ်</h1>
          <p>သင့်မွေးဇာတာနှင့် ဖတ်ကြားမှုမှတ်တမ်းကို လုံခြုံစွာ သိမ်းဆည်းပြီး မည်သည့်စက်မှမဆို ဆက်လက်ဖတ်ရှုနိုင်ပါတယ်။</p>
        </div>
        <Link className="primary-button" href={chatGPTSignInPath(returnTo)}>ChatGPT ဖြင့် ဝင်ရောက်မည် <ArrowRight size={17} aria-hidden="true" /></Link>
        <div className="privacy-note"><ShieldCheck size={17} aria-hidden="true" /><span>OpenAI ၏ လုံခြုံသော ဝင်ရောက်မှုကို အသုံးပြုပါတယ်။ သင့်စကားဝှက်ကို သုရိယက မမြင်ရ၊ မသိမ်းဆည်းပါ။</span></div>
      </section>
      <p className="login-foot">ဆက်လက်ဝင်ရောက်ခြင်းဖြင့် သုရိယ၏ ကိုယ်ရေးအချက်အလက် မူဝါဒကို သဘောတူပါသည်။</p>
    </main>
  );
}
