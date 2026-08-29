# Tarot Booking Funnel and Free-Question Quota Design

Date: 2026-08-30
Status: Approved in chat (sub-project 1 of 3)

## Business context

Suriya is free to use. Vedic astrology (daily insight, chart, three free
questions per day) is the acquisition hook. Revenue comes from **in-person Tarot
sessions** sold through the app. All user-facing copy is Burmese.

Sub-projects, in order:

1. Tarot booking funnel + free-question quota (this spec)
2. LLM-generated daily / weekly / monthly readings
3. UI/UX polish pass

## Goals

1. A user can request an in-person Tarot session with a named reader in under a
   minute, with or without signing in. The request is stored durably.
2. Free astrology questions are capped at 3 per Yangon calendar day per user.
   Exhausting the quota converts into a Tarot booking prompt.
3. Every high-engagement surface (Daily, reading result, Ask) carries a small,
   consistent Tarot upsell.

## Non-goals

- Online payment, deposits, or subscriptions (pay at the session).
- Admin dashboard. Operators read bookings from D1 directly.
- Live chat, video, or scheduling against real calendars.
- Notifications (SMS/email). Confirmation is manual by phone.

## Data

### New table `tarot_bookings` (migration `0002`)

| column | type | notes |
| --- | --- | --- |
| id | text pk | `bkg_…` via `newId("bkg")` |
| user_id | text nullable | FK profiles.id, on delete set null; null for guests |
| specialist_id | text | FK tarot_specialists.id |
| name | text | 2–80 chars |
| phone | text | 7–20 chars, digits/`+`/spaces; stored trimmed |
| contact_channel | enum | `phone` \| `viber` \| `telegram` \| `messenger` |
| preferred_date | text | ISO date, today..+60 days in Asia/Yangon |
| preferred_time | enum | `morning` \| `afternoon` \| `evening` |
| topic | enum | `love` \| `career` \| `direction` \| `other` |
| note | text nullable | ≤500 chars |
| status | enum | `requested` \| `confirmed` \| `completed` \| `cancelled`, default `requested` |
| created_at / updated_at | text | as other tables |

Indexes: `(specialist_id, created_at)`, `(user_id, created_at)`.

### `tarot_specialists` additions

`location` text not null default `''`, `session_minutes` integer not null default 30.
Demo specialists (`lib/content/demo.ts`) gain the same fields. `availability`
copy changes from "မကြာမီ ရနိုင်မည်" to real slots, e.g. "စနေ · တနင်္ဂနွေ".

### Repositories

- `db/repositories/bookings.ts`: `createBooking`, `getBooking(id)`,
  `countRecentBookings(key, sinceIso)` where key is userId or a hashed IP.
- Specialists repository unchanged except the new columns map through.

## Quota

`lib/readings/quota.ts` (pure, unit-tested):

```ts
dailyQuota(readings: {createdAt: string; status: string}[], now: Date,
           timezone = "Asia/Yangon", limit = 3)
  → { used, remaining, limit, resetsAt: string /* ISO of next local midnight */ }
```

- Counts readings whose `createdAt` lands on the same local calendar day as
  `now` in `timezone`, excluding `status === "failed"`.
- `POST /api/readings` replaces the 5-per-10-minute check with the quota. On
  exhaustion it returns 429 `{ error: "quota_exhausted", resetsAt }`.
- `/ask` renders a quota pill `ယနေ့ ကျန် ၂ / ၃` (Burmese digits via
  `toBurmeseDigits`). When `remaining === 0` the composer is replaced by an
  upsell card (see below). Guests see the composer plus a line "ဝင်ရောက်ပြီး
  တစ်နေ့ ၃ ကြိမ် အခမဲ့ မေးနိုင်ပါသည်".

## Booking funnel

### `/tarot` (sales page)

Sections top to bottom:

1. Hero: eyebrow `TAROT · လူချင်းတွေ့ ဆွေးနွေးမှု`, title
   `Tarot ပညာရှင်နှင့် လူချင်းတွေ့ ဆွေးနွေးပါ`, lede about a 30-minute in-person
   session in Burmese, primary CTA scrolls to `#consultants`.
2. "ဘယ်လိုအလုပ်လုပ်သလဲ" three steps: choose reader → request date/time → we
   call to confirm.
3. Category filter + specialist cards (existing `ConsultantDirectory`). Each
   card: name, specialty, experience, location, rate, availability, and a
   primary `ရက်ချိန်းယူရန်` link to `/tarot/[id]#booking`. No "Preview" copy.
4. Trust strip: pay at session, private, cancel free up to 24h before.

### `/tarot/[id]`

Profile hero (existing) + facts (adds location, session length) + `BookingForm`
(client component, `id="booking"`). Fields: name (prefilled with display name
when signed in), phone, contact channel, preferred date (min today, max +60
days, Yangon), preferred time, topic, note. Submit → `POST /api/bookings`.
On 201 → `window.location.assign("/tarot/bookings/<id>")`.

### `POST /api/bookings`

- Body validated by `bookingRequestSchema` (Zod, Burmese messages).
- 404 if specialist id is neither in DB nor in demo list.
- Rate limit: 3 bookings per hour per user id, or per hashed IP
  (`cf-connecting-ip` sha-256 hex, first 16 chars) for guests → 429.
- Persists with `userId` when signed in. Returns `{ id }`.
- 503 when the DB is unavailable; the form shows a retry message plus
  "ဖုန်းဖြင့် ဆက်သွယ်ရန် <TAROT_CONTACT_PHONE>" when that env var is set.

### `/tarot/bookings/[id]`

Confirmation page: reader name, requested date/time, topic, "၂၄ နာရီအတွင်း
ဖုန်းဆက်၍ အတည်ပြုပေးပါမည်" and the payment/cancellation policy. Accessible to
whoever has the id (ids are unguessable); no PII beyond the name the user typed
is displayed except the last 3 digits of the phone.

### `TarotUpsell` component

`components/suriya/tarot-upsell.tsx`, props `{ variant: "quota" | "inline" }`.
Inline variant: compact gold-tinted card with one sentence and a link to
`/tarot`. Placed at the bottom of `/daily`, `/readings/[id]`, and `/ask`.
Quota variant: replaces the composer; headline `ယနေ့ အခမဲ့မေးခွန်း ကုန်သွားပါပြီ`,
reset time, and the booking CTA.

### Navigation

- `topNavigationLinks`: `/tarot` label → `Tarot ဆွေးနွေးမှု`.
- `navigationItems` (bottom nav): `/chart` slot becomes `/tarot` (label
  `Tarot`, icon `tarot` → lucide `Sparkles`). `/chart` remains linked from Home
  route cards, Daily, and the identity rail.
- Home `RouteCards`: chart card copy replaced by a Tarot card
  (`လူချင်းတွေ့ Tarot ဆွေးနွေးမှု ရက်ချိန်းယူရန်`), chart stays as the third card.

## Errors

| case | behaviour |
| --- | --- |
| quota exhausted | 429 `quota_exhausted`; Ask shows quota upsell |
| booking validation | 400 with first Zod message; shown under the form |
| unknown specialist | 404; form message "ပညာရှင်ကို ရှာမတွေ့ပါ" |
| booking rate limit | 429; message asks to try again later |
| DB down | 503; retry message + optional phone line |

## Testing

Unit (vitest): `tests/quota.test.ts` (midnight Yangon boundaries, failed
excluded, limit, resetsAt), `tests/booking-schema.test.ts`,
`tests/navigation.test.ts` updates, `tests/consultant-filter.test.ts` still
green, `tests/burmese-digits.test.ts` if a helper is added.

Rendered HTML (`tests/rendered-html.test.mjs`): `/tarot` contains
`ရက်ချိန်းယူရန်` and no `Preview`; `/tarot/thiri` contains `id="booking"`;
`/ask` guest state contains the quota hint; `/daily` contains the upsell link
to `/tarot`; `/tarot/bookings/unknown` → 404.

Playwright (scratchpad `audit.py`) at 390px and 1280px for `/tarot`,
`/tarot/thiri`, `/ask`: no console errors, no horizontal overflow, Burmese text
≥12px, form controls labelled.

Gates: `npm run test:unit`, `npm run lint`, `npm run build`,
`node --test tests/rendered-html.test.mjs`.

## Out of scope for this spec

LLM period readings, admin UI, payments, notifications, the visual polish pass.
