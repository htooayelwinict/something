"use client";

import { FormEvent, useEffect, useState } from "react";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import type { BirthProfileInput } from "@/lib/schemas/profile";

const defaults: BirthProfileInput = {
  name: "",
  birthDate: "1990-01-01",
  birthTime: "12:00",
  birthCity: "ရန်ကုန်",
  latitude: 16.7967,
  longitude: 96.161,
  timezone: "Asia/Yangon",
};

export function BirthProfileForm({ initialName = "", onboarding = false }: { initialName?: string; onboarding?: boolean }) {
  const [values, setValues] = useState({ ...defaults, name: initialName });
  const [status, setStatus] = useState("");
  const [pending, setPending] = useState(false);

  useEffect(() => {
    if (onboarding) return;
    let active = true;
    fetch("/api/profile", { headers: { accept: "application/json" } })
      .then((response) => response.ok ? response.json() : null)
      .then((data: { birthProfile?: BirthProfileInput | null } | null) => {
        if (active && data?.birthProfile) setValues(data.birthProfile);
      })
      .catch(() => undefined);
    return () => { active = false; };
  }, [onboarding]);

  function update<K extends keyof BirthProfileInput>(key: K, value: BirthProfileInput[K]) {
    setValues((current) => ({ ...current, [key]: value }));
  }

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setStatus("");
    try {
      const response = await fetch("/api/profile", {
        method: "PUT", headers: { "content-type": "application/json" }, body: JSON.stringify(values),
      });
      const result = (await response.json()) as { birthProfile?: BirthProfileInput; error?: string };
      if (!response.ok) throw new Error(result.error ?? "save_failed");
      setStatus("မွေးဖွားမှုအချက်အလက်ကို လုံခြုံစွာ သိမ်းပြီးပါပြီ။");
      if (onboarding) window.location.assign("/");
    } catch (error) {
      setStatus(error instanceof Error && error.message !== "save_failed" ? error.message : "သိမ်းဆည်းမှု မအောင်မြင်ပါ။ ပြန်စမ်းကြည့်ပါ။");
    } finally {
      setPending(false);
    }
  }

  return (
    <form className="form-grid" onSubmit={save}>
      <div className="field-group">
        <label className="field-label" htmlFor="profile-name">ခေါ်ဝေါ်လိုသော အမည်</label>
        <input className="text-field" id="profile-name" value={values.name} onChange={(e) => update("name", e.target.value)} required maxLength={80} autoComplete="name" />
      </div>
      <div className="form-grid-two">
        <div className="field-group">
          <label className="field-label" htmlFor="birth-date">မွေးသက္ကရာဇ်</label>
          <input className="text-field" id="birth-date" type="date" value={values.birthDate} max={new Date().toISOString().slice(0, 10)} onChange={(e) => update("birthDate", e.target.value)} required />
        </div>
        <div className="field-group">
          <label className="field-label" htmlFor="birth-time">မွေးချိန်အတိအကျ</label>
          <input className="text-field" id="birth-time" type="time" value={values.birthTime} onChange={(e) => update("birthTime", e.target.value)} required />
        </div>
      </div>
      <p className="field-meta">မွေးချိန်က လဂ်နှင့် အိမ်တည်နေရာများကို ပြောင်းလဲစေသောကြောင့် ဖြစ်နိုင်သမျှ အတိအကျ ထည့်ပါ။</p>
      <div className="field-group">
        <label className="field-label" htmlFor="birth-city">မွေးဖွားရာမြို့</label>
        <input className="text-field" id="birth-city" value={values.birthCity} onChange={(e) => update("birthCity", e.target.value)} required />
      </div>
      <div className="form-grid-two">
        <div className="field-group">
          <label className="field-label" htmlFor="latitude">လတ္တီကျု</label>
          <input className="text-field" id="latitude" type="number" step="0.00001" min="-90" max="90" value={values.latitude} onChange={(e) => update("latitude", Number(e.target.value))} required />
        </div>
        <div className="field-group">
          <label className="field-label" htmlFor="longitude">လောင်ဂျီကျု</label>
          <input className="text-field" id="longitude" type="number" step="0.00001" min="-180" max="180" value={values.longitude} onChange={(e) => update("longitude", Number(e.target.value))} required />
        </div>
      </div>
      <div className="field-group">
        <label className="field-label" htmlFor="timezone">အချိန်ဇုန်</label>
        <input className="text-field" id="timezone" value={values.timezone} onChange={(e) => update("timezone", e.target.value)} required aria-describedby="timezone-help" />
        <span className="field-meta" id="timezone-help">IANA အမည်ကို သုံးပါ — ဥပမာ Asia/Yangon</span>
      </div>
      <button className="primary-button" type="submit" disabled={pending}>
        {pending ? "သိမ်းနေပါတယ်…" : onboarding ? "ဇာတာတွက်ပြီး စတင်မည်" : "ပြောင်းလဲမှု သိမ်းမည်"}
        {!pending && <ArrowRight size={17} aria-hidden="true" />}
      </button>
      {status && <p className="form-message" role="status"><CheckCircle2 size={15} aria-hidden="true" /> {status}</p>}
    </form>
  );
}
