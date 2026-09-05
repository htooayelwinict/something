import type { Metadata } from "next";
import { ArrowRight, ShieldCheck, Sun } from "lucide-react";
import { Brand } from "@/components/suriya/brand";
import { googleStartPath } from "@/lib/auth/paths";

export const metadata: Metadata = { title: "ဝင်ရောက်ရန်", robots: { index: false, follow: false } };

const errorMessages: Record<string, string> = {
  unconfigured: "ဝင်ရောက်ခြင်းကို ခဏ ရပ်ထားပါသည်။ နောက်မှ ပြန်စမ်းပါ။",
  google: "Google ဖြင့် ဝင်ရောက်ခြင်း မအောင်မြင်ပါ။ ပြန်စမ်းကြည့်ပါ။",
  service: "ဝန်ဆောင်မှု ခေတ္တမရနိုင်ပါ။ ခဏနေမှ ပြန်စမ်းပါ။",
};

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ return_to?: string; error?: string }> }) {
  const params = await searchParams;
  const returnTo = params.return_to?.startsWith("/") ? params.return_to : "/onboarding";
  const error = params.error ? errorMessages[params.error] ?? null : null;
  return (
    <main className="login-page" id="main-content">
      <div className="login-top"><Brand /></div>
      <section className="login-card">
        <span className="login-orbit"><Sun size={36} strokeWidth={1.25} aria-hidden="true" /></span>
        <div>
          <p className="eyebrow">သင့်ကိုယ်ပိုင် ကောင်းကင်အထောက်အထား</p>
          <h1>ပြန်လည်ကြိုဆိုပါတယ်</h1>
          <p><strong>သင့်မွေးချိန်အတိုင်း တွက်ချက်ပေးမည်။</strong> သင့်မွေးဇာတာနှင့် ဖတ်ကြားမှုမှတ်တမ်းကို လုံခြုံစွာ သိမ်းဆည်းပြီး မည်သည့်စက်မှမဆို ဆက်လက်ဖတ်ရှုနိုင်ပါတယ်။</p>
        </div>
        {error && <p className="form-error" role="alert">{error}</p>}
        <a className="primary-button" href={googleStartPath(returnTo)}>Google ဖြင့် အကောင့်ဖွင့်/ဝင်ရောက်မည် <ArrowRight size={17} aria-hidden="true" /></a>
        <div className="privacy-note"><ShieldCheck size={17} aria-hidden="true" /><span>Google ၏ လုံခြုံသော အကောင့်ဝင်ခြင်းကို အသုံးပြုပါတယ်။ သင့်စကားဝှက်ကို သုရိယက မမြင်ရ၊ မသိမ်းဆည်းပါ။</span></div>
      </section>
      <p className="login-foot">ဆက်လက်ဝင်ရောက်ခြင်းဖြင့် သုရိယ၏ ကိုယ်ရေးအချက်အလက် မူဝါဒကို သဘောတူပါသည်။</p>
    </main>
  );
}
