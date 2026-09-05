"use client";

import { FormEvent, useState } from "react";
import { CheckCircle2 } from "lucide-react";
import type { TarotSpecialistRow } from "@/db/schema";
import { studioErrorMessage, studioMessages, tellerFieldLabels } from "@/lib/content/studio-copy";

export type TellerFormMode = "create" | "editor" | "self";
export type TellerFormValues = {
  id: string; name: string; initials: string; specialty: string; experience: string; displayRate: string; availabilityLabel: string;
  tags: string; location: string; sessionMinutes: number; bio: string; photoUrl: string; loginEmail: string; isActive: boolean; sortOrder: number;
};

export const emptyTeller: TellerFormValues = {
  id: "", name: "", initials: "", specialty: "", experience: "", displayRate: "၃၀ မိနစ် · ၂၅,၀၀၀ ကျပ်", availabilityLabel: "",
  tags: "", location: "ရန်ကုန်", sessionMinutes: 30, bio: "", photoUrl: "", loginEmail: "", isActive: true, sortOrder: 0,
};

export function tellerFormValues(row: TarotSpecialistRow): TellerFormValues {
  return {
    id: row.id, name: row.name, initials: row.initials, specialty: row.specialty, experience: row.experience, displayRate: row.displayRate,
    availabilityLabel: row.availabilityLabel, tags: row.tags.join("၊ "), location: row.location, sessionMinutes: row.sessionMinutes,
    bio: row.bio, photoUrl: row.photoUrl ?? "", loginEmail: row.loginEmail ?? "", isActive: row.isActive, sortOrder: row.sortOrder,
  };
}

const textFields: Array<keyof Pick<TellerFormValues, "name" | "initials" | "specialty" | "experience" | "displayRate" | "availabilityLabel" | "tags" | "location">> =
  ["name", "initials", "specialty", "experience", "displayRate", "availabilityLabel", "tags", "location"];

export function TellerForm({ mode, initial }: { mode: TellerFormMode; initial: TellerFormValues }) {
  const [values, setValues] = useState(initial);
  const [status, setStatus] = useState<{ tone: "ok" | "error"; text: string } | null>(null);
  const [pending, setPending] = useState(false);

  function update<K extends keyof TellerFormValues>(key: K, value: TellerFormValues[K]) {
    setValues((current) => ({ ...current, [key]: value }));
  }

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setStatus(null);
    const profile = {
      name: values.name, initials: values.initials, specialty: values.specialty, experience: values.experience, displayRate: values.displayRate,
      availabilityLabel: values.availabilityLabel, tags: values.tags, location: values.location, sessionMinutes: values.sessionMinutes,
      bio: values.bio, photoUrl: values.photoUrl,
    };
    const body = mode === "self"
      ? profile
      : { ...profile, loginEmail: values.loginEmail, isActive: values.isActive, sortOrder: values.sortOrder, ...(mode === "create" ? { id: values.id } : {}) };
    try {
      const response = await fetch(mode === "create" ? "/api/studio/tellers" : `/api/studio/tellers/${initial.id}`, {
        method: mode === "create" ? "POST" : "PUT", headers: { "content-type": "application/json" }, body: JSON.stringify(body),
      });
      const result = (await response.json().catch(() => ({}))) as { error?: string; specialist?: { id: string } };
      if (!response.ok) throw new Error(result.error ?? "invalid_input");
      if (mode === "create" && result.specialist) {
        window.location.assign(`/studio/tellers/${result.specialist.id}`);
        return;
      }
      setStatus({ tone: "ok", text: studioMessages.saved });
    } catch (error) {
      setStatus({ tone: "error", text: studioErrorMessage(error instanceof Error ? error.message : undefined) });
    } finally {
      setPending(false);
    }
  }

  return (
    <form className="form-grid teller-form" onSubmit={save}>
      {mode === "create" && (
        <div className="field-group">
          <label className="field-label" htmlFor="teller-id">{tellerFieldLabels.id}</label>
          <input className="text-field" id="teller-id" value={values.id} onChange={(e) => update("id", e.target.value)} pattern="[a-z0-9][a-z0-9-]{1,39}" required />
        </div>
      )}
      <div className="form-grid-two">
        {textFields.map((key) => (
          <div className="field-group" key={key}>
            <label className="field-label" htmlFor={`teller-${key}`}>{tellerFieldLabels[key]}</label>
            <input className="text-field" id={`teller-${key}`} value={values[key]} onChange={(e) => update(key, e.target.value)} required={key !== "location"} />
          </div>
        ))}
        <div className="field-group">
          <label className="field-label" htmlFor="teller-sessionMinutes">{tellerFieldLabels.sessionMinutes}</label>
          <input className="text-field" id="teller-sessionMinutes" type="number" min={15} max={180} value={values.sessionMinutes} onChange={(e) => update("sessionMinutes", Number(e.target.value))} required />
        </div>
        <div className="field-group">
          <label className="field-label" htmlFor="teller-photoUrl">{tellerFieldLabels.photoUrl}</label>
          <input className="text-field" id="teller-photoUrl" type="url" value={values.photoUrl} onChange={(e) => update("photoUrl", e.target.value)} placeholder="https://…" />
        </div>
      </div>
      <div className="field-group">
        <label className="field-label" htmlFor="teller-bio">{tellerFieldLabels.bio}</label>
        <textarea className="text-area" id="teller-bio" rows={4} maxLength={600} value={values.bio} onChange={(e) => update("bio", e.target.value)} />
      </div>
      {mode !== "self" && (
        <div className="form-grid-two">
          <div className="field-group">
            <label className="field-label" htmlFor="teller-loginEmail">{tellerFieldLabels.loginEmail}</label>
            <input className="text-field" id="teller-loginEmail" type="email" value={values.loginEmail} onChange={(e) => update("loginEmail", e.target.value)} autoComplete="off" />
          </div>
          <div className="field-group">
            <label className="field-label" htmlFor="teller-sortOrder">{tellerFieldLabels.sortOrder}</label>
            <input className="text-field" id="teller-sortOrder" type="number" min={0} max={999} value={values.sortOrder} onChange={(e) => update("sortOrder", Number(e.target.value))} />
          </div>
          <label className="checkbox-row" htmlFor="teller-isActive">
            <input id="teller-isActive" type="checkbox" checked={values.isActive} onChange={(e) => update("isActive", e.target.checked)} />
            <span>{tellerFieldLabels.isActive}</span>
          </label>
        </div>
      )}
      <button className="primary-button" type="submit" disabled={pending}>{pending ? "သိမ်းနေပါတယ်…" : mode === "create" ? "ပညာရှင် ဖန်တီးမည်" : "ပြောင်းလဲမှု သိမ်းမည်"}</button>
      {status && <p className={status.tone === "error" ? "form-error" : "form-message"} role="status">{status.tone === "ok" && <CheckCircle2 size={15} aria-hidden="true" />} {status.text}</p>}
    </form>
  );
}
