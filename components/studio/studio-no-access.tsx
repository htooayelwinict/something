import { Lock } from "lucide-react";
import { Brand } from "@/components/suriya/brand";
import { StarField } from "@/components/suriya/star-field";
import { signOutPath } from "@/lib/auth/paths";
import { studioMessages } from "@/lib/content/studio-copy";

export function StudioNoAccess({ email }: { email: string }) {
  return (
    <div className="studio-shell">
      <StarField />
      <main className="studio-main" id="main-content">
        <div className="login-top"><Brand /></div>
        <section className="surface empty-state studio-no-access">
          <Lock size={34} aria-hidden="true" />
          <h1>{studioMessages.no_access_title}</h1>
          <p>{studioMessages.no_access_body}</p>
          <p className="field-meta">{email}</p>
          <a className="secondary-button" href={signOutPath("/studio")}>အခြားအကောင့်ဖြင့် ဝင်ရောက်မည်</a>
          <a className="text-link" href="/">ပင်မသို့ ပြန်သွားရန်</a>
        </section>
      </main>
    </div>
  );
}
