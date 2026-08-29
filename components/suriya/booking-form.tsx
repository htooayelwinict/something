"use client";

import { FormEvent, useState } from "react";
import { ArrowRight } from "lucide-react";
import { bookingErrorMessages, bookingLabels } from "@/lib/content/booking-copy";
import { toBurmeseDigits } from "@/lib/content/burmese-digits";
import { bookingDateBounds, type BookingRequestInput, type BookingTopic, type ContactChannel, type PreferredTime } from "@/lib/schemas/booking";

const NOTE_MAX = 500;

export function bookingErrorMessage(code: string | undefined, contactPhone?: string | null) {
  const base = (code && bookingErrorMessages[code]) ?? code ?? bookingErrorMessages.invalid_booking;
  return code === "booking_service_unavailable" && contactPhone ? `${base} ဖုန်းဖြင့် ဆက်သွယ်ရန် ${contactPhone}` : base;
}

export function BookingForm({ specialistId, specialistName, defaultName = "", timezone = "Asia/Yangon", contactPhone = null }: {
  specialistId: string;
  specialistName: string;
  defaultName?: string;
  timezone?: string;
  contactPhone?: string | null;
}) {
  const bounds = bookingDateBounds(new Date(), timezone);
  const [name, setName] = useState(defaultName);
  const [phone, setPhone] = useState("");
  const [contactChannel, setContactChannel] = useState<ContactChannel>("phone");
  const [preferredDate, setPreferredDate] = useState(bounds.min);
  const [preferredTime, setPreferredTime] = useState<PreferredTime>("evening");
  const [topic, setTopic] = useState<BookingTopic>("love");
  const [note, setNote] = useState("");
  const [status, setStatus] = useState("");
  const [pending, setPending] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending) return;
    setPending(true);
    setStatus("ရက်ချိန်း တောင်းဆိုနေပါတယ်…");
    const payload: BookingRequestInput = { specialistId, name: name.trim(), phone: phone.trim(), contactChannel, preferredDate, preferredTime, topic, note: note.trim() || undefined };
    try {
      const response = await fetch("/api/bookings", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(payload) });
      const result = (await response.json().catch(() => ({}))) as { id?: string; error?: string };
      if (response.ok && result.id) {
        window.location.assign(`/tarot/bookings/${result.id}`);
        return;
      }
      setStatus(bookingErrorMessage(result.error, contactPhone));
    } catch {
      setStatus(bookingErrorMessage("booking_service_unavailable", contactPhone));
    }
    setPending(false);
  }

  return (
    <form className="booking-form" onSubmit={submit} aria-describedby="booking-note-hint">
      <p id="booking-note-hint" className="booking-hint">{specialistName} နှင့် လူချင်းတွေ့ ဆွေးနွေးရန် ရက်ချိန်း တောင်းဆိုပါ။ ၂၄ နာရီအတွင်း ဖုန်းဖြင့် အတည်ပြုပေးပါမည်။</p>
      <div className="booking-grid">
        <div className="field-group">
          <label className="field-label" htmlFor="booking-name">အမည်</label>
          <input className="text-field" id="booking-name" name="name" value={name} onChange={(event) => setName(event.target.value)} maxLength={80} required autoComplete="name" />
        </div>
        <div className="field-group">
          <label className="field-label" htmlFor="booking-phone">ဖုန်းနံပါတ်</label>
          <input className="text-field" id="booking-phone" name="phone" type="tel" inputMode="tel" value={phone} onChange={(event) => setPhone(event.target.value)} placeholder="09 …" required autoComplete="tel" />
        </div>
        <div className="field-group">
          <label className="field-label" htmlFor="booking-channel">ဆက်သွယ်လိုသည့် နည်းလမ်း</label>
          <select className="select-field" id="booking-channel" value={contactChannel} onChange={(event) => setContactChannel(event.target.value as ContactChannel)}>
            {Object.entries(bookingLabels.contactChannel).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
          </select>
        </div>
        <div className="field-group">
          <label className="field-label" htmlFor="booking-topic">ဆွေးနွေးလိုသည့် အကြောင်းအရာ</label>
          <select className="select-field" id="booking-topic" value={topic} onChange={(event) => setTopic(event.target.value as BookingTopic)}>
            {Object.entries(bookingLabels.topic).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
          </select>
        </div>
        <div className="field-group">
          <label className="field-label" htmlFor="booking-date">လိုချင်သည့်ရက်</label>
          <input className="text-field" id="booking-date" type="date" min={bounds.min} max={bounds.max} value={preferredDate} onChange={(event) => setPreferredDate(event.target.value)} required />
        </div>
        <div className="field-group">
          <label className="field-label" htmlFor="booking-time">အချိန်ပိုင်း</label>
          <select className="select-field" id="booking-time" value={preferredTime} onChange={(event) => setPreferredTime(event.target.value as PreferredTime)}>
            {Object.entries(bookingLabels.preferredTime).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
          </select>
        </div>
      </div>
      <div className="field-group">
        <label className="field-label" htmlFor="booking-note">မှတ်ချက် (မဖြည့်လည်းရ)</label>
        <textarea className="text-area booking-note" id="booking-note" maxLength={NOTE_MAX} value={note} onChange={(event) => setNote(event.target.value)} placeholder="ဆွေးနွေးလိုသည့် အခြေအနေကို အကျဉ်းချုပ် ရေးနိုင်ပါသည်" />
        <div className="field-meta"><span>ကိုယ်ရေးအချက်အလက်ကို ရက်ချိန်းအတွက်သာ အသုံးပြုပါမည်</span><span>{toBurmeseDigits(note.length)}/{toBurmeseDigits(NOTE_MAX)}</span></div>
      </div>
      <button className="primary-button" type="submit" disabled={pending || !name.trim() || !phone.trim()}>
        {pending ? "ပေးပို့နေပါတယ်…" : "ရက်ချိန်း တောင်းဆိုမည်"}
        {!pending && <ArrowRight size={17} aria-hidden="true" />}
      </button>
      {status && <p className="form-message" role="status">{status}</p>}
    </form>
  );
}
