import type { Metadata } from "next";
import { CalendarDays, Clock3, LogIn, LogOut, MapPin, ShieldCheck } from "lucide-react";
import { chatGPTSignInPath, chatGPTSignOutPath, getChatGPTUser } from "@/app/chatgpt-auth";
import { AppShell } from "@/components/suriya/app-shell";
import { BirthProfileForm } from "@/components/suriya/birth-profile-form";
import { CosmicFingerprint } from "@/components/suriya/cosmic-fingerprint";
import { getBirthProfile } from "@/db/repositories/profiles";
import { calculateNumerology } from "@/lib/numerology/calculate";

export const metadata: Metadata = { title: "ကိုယ်ရေးအချက်အလက်" };

export default async function ProfilePage() {
  const user = await getChatGPTUser();
  const birthProfile = user ? await getBirthProfile(user.userId).catch(() => null) : null;
  const numerology = birthProfile ? calculateNumerology(birthProfile.birthDate) : null;
  return (
    <AppShell>
      <header className="page-heading">
        <p className="eyebrow">YOUR COSMIC IDENTITY</p>
        <h1 className="page-title">သင့်ကောင်းကင် ကိုယ်ရေး</h1>
        <p className="page-lede">သင့်မွေးဇာတာတွက်ချက်မှုအတွက် အသုံးပြုသော ကိုယ်ပိုင်အချက်အလက်များကို ကြည့်ရှုပြင်ဆင်နိုင်ပါတယ်။</p>
      </header>
      {user ? (
        <>
          <section className="profile-identity-card">
            <div className="profile-avatar" aria-hidden="true">{(birthProfile?.name ?? user.displayName).slice(0, 1).toUpperCase()}</div>
            <div className="profile-identity-copy">
              <p className="eyebrow">PRIVATE COSMIC ID</p>
              <h2>{birthProfile?.name ?? user.displayName}</h2>
              <p>{birthProfile ? `${birthProfile.birthDate} · ${birthProfile.birthCity}` : "မွေးဖွားမှုအချက်အလက် မဖြည့်ရသေးပါ"}</p>
            </div>
            <div className="profile-completion">
              <span><strong>{birthProfile ? "100%" : "20%"}</strong> PROFILE COMPLETE</span>
              <div><i style={{ width: birthProfile ? "100%" : "20%" }} /></div>
            </div>
          </section>
          {birthProfile && numerology ? (
            <div className="profile-summary-grid">
              <section className="birth-facts" aria-labelledby="birth-facts-title">
                <p className="eyebrow">BIRTH FACTS</p><h2 id="birth-facts-title">သိမ်းထားသော အချက်အလက်</h2>
                <dl>
                  <div><dt><CalendarDays size={15} aria-hidden="true" /> မွေးရက်</dt><dd>{birthProfile.birthDate}</dd></div>
                  <div><dt><Clock3 size={15} aria-hidden="true" /> မွေးချိန်</dt><dd>{birthProfile.birthTime}</dd></div>
                  <div><dt><MapPin size={15} aria-hidden="true" /> နေရာ</dt><dd>{birthProfile.birthCity} · {birthProfile.timezone}</dd></div>
                </dl>
              </section>
              <CosmicFingerprint numerology={numerology} connectedMethods={["Jyotish · Lahiri", "Numerology"]} />
            </div>
          ) : (
            <aside className="profile-start-note"><ShieldCheck size={20} aria-hidden="true" /><div><strong>Cosmic fingerprint အတွက် အချက်အလက်ဖြည့်ပါ</strong><p>သိမ်းပြီးသည်နှင့် Lahiri sidereal Jyotish chart နှင့် numerology ကို သီးခြားတွက်ချက်ပေးပါမယ်။</p></div></aside>
          )}
          <section className="surface form-card profile-edit-card">
            <div className="section-title"><div><p className="eyebrow">EDIT PROFILE</p><h2>မွေးဖွားမှုအချက်အလက် ပြင်ဆင်ရန်</h2></div></div>
            <BirthProfileForm initialName={birthProfile?.name ?? user.fullName ?? ""} />
          </section>
          <div className="profile-account-row"><span>အကောင့်ပိုင်ရှင် — {user.displayName}</span><a className="ghost-button" href={chatGPTSignOutPath("/")}><LogOut size={16} aria-hidden="true" /> ထွက်မည်</a></div>
        </>
      ) : (
        <section className="profile-signin"><span><LogIn size={28} aria-hidden="true" /></span><h2>သင့် Cosmic ID ကို ဖွင့်ပါ</h2><p>မွေးဖွားမှုအချက်အလက်နှင့် ဖတ်ကြားမှုများကို အကောင့်ပိုင်ရှင်တစ်ဦးတည်းအတွက် လုံခြုံစွာ သိမ်းထားပါမယ်။</p><a className="primary-button" href={chatGPTSignInPath("/profile")}>ChatGPT ဖြင့် ဝင်ရောက်မည်</a></section>
      )}
    </AppShell>
  );
}
