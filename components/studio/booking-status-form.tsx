"use client";

import { FormEvent, useState } from "react";
import { bookingStatusLabels, bookingStatusOrder, studioErrorMessage, studioMessages, type StudioBookingStatus } from "@/lib/content/studio-copy";

export function BookingStatusForm({ bookingId, status, staffNote }: { bookingId: string; status: StudioBookingStatus; staffNote: string | null }) {
  const [current, setCurrent] = useState(status);
  const [note, setNote] = useState(staffNote ?? "");
  const [message, setMessage] = useState<{ tone: "ok" | "error"; text: string } | null>(null);
  const [pending, setPending] = useState(false);

  async function patch(body: { status?: StudioBookingStatus; staffNote?: string }) {
    setPending(true);
    setMessage(null);
    try {
      const response = await fetch(`/api/studio/bookings/${bookingId}`, { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
      const result = (await response.json().catch(() => ({}))) as { error?: string; booking?: { status: StudioBookingStatus; staffNote: string | null } };
      if (!response.ok || !result.booking) throw new Error(result.error ?? "invalid_input");
      setCurrent(result.booking.status);
      setNote(result.booking.staffNote ?? "");
      setMessage({ tone: "ok", text: studioMessages.saved });
    } catch (error) {
      setMessage({ tone: "error", text: studioErrorMessage(error instanceof Error ? error.message : undefined) });
    } finally {
      setPending(false);
    }
  }

  function saveNote(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void patch({ staffNote: note });
  }

  return (
    <section className="surface form-card" aria-labelledby="booking-status-title">
      <div className="section-title"><h2 id="booking-status-title">အခြေအနေ</h2><span className="status-badge" data-status={current}>{bookingStatusLabels[current]}</span></div>
      <div className="studio-actions" role="group" aria-label="အခြေအနေ ပြောင်းရန်">
        {bookingStatusOrder.filter((item) => item !== current).map((item) => (
          <button key={item} type="button" className={item === "cancelled" ? "ghost-button" : "secondary-button"} disabled={pending} onClick={() => void patch({ status: item })}>
            {bookingStatusLabels[item]}
          </button>
        ))}
      </div>
      <form className="form-grid" onSubmit={saveNote}>
        <div className="field-group">
          <label className="field-label" htmlFor="staff-note">ဝန်ထမ်း မှတ်ချက် (ဖောက်သည် မမြင်ရ)</label>
          <textarea className="text-area" id="staff-note" rows={3} maxLength={500} value={note} onChange={(event) => setNote(event.target.value)} />
        </div>
        <button className="primary-button" type="submit" disabled={pending}>မှတ်ချက် သိမ်းမည်</button>
        {message && <p className={message.tone === "error" ? "form-error" : "form-message"} role="status">{message.text}</p>}
      </form>
    </section>
  );
}
