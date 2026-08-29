# Tarot Booking Funnel and Question Quota Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Turn `/tarot` into a working in-person booking funnel, cap free astrology questions at 3 per Yangon day, and place Tarot upsells on Daily, Ask, and reading pages.

**Architecture:** A new `tarot_bookings` D1 table behind a Drizzle repository and a Zod-validated `POST /api/bookings` route; a pure `dailyQuota()` helper drives both the API limit and the Ask page state; a shared `TarotUpsell` component is dropped onto engagement surfaces. All copy is Burmese; server components fetch, client components only handle forms.

**Tech Stack:** vinext (Next-style app router on Cloudflare Workers), React 19, TypeScript 5.9, Zod 4, Drizzle ORM + D1 (SQLite), Vitest 4, node:test rendered-HTML checks, lucide-react icons, custom CSS in `app/globals.css`.

**Spec:** `docs/superpowers/specs/2026-08-30-tarot-funnel-quota-design.md`

## Global Constraints

- All user-facing text is Burmese; English only for eyebrows/technical terms already used in the app (e.g. `TAROT`).
- Burmese text never below `.75rem` (12px). Tap targets ≥44px.
- Navigation uses plain `<a href>` (never `next/link`) — `tests/navigation.test.ts` enforces this.
- Quota: 3 per Asia/Yangon calendar day; failed readings do not count.
- Booking date window: today .. today+60 days in Asia/Yangon.
- Booking rate limit: 3 per hour per user id, or per hashed `cf-connecting-ip` for guests.
- No online payment, no admin UI, no notifications.
- Do not touch untracked `untitled.pen`, `zartar-home-desktop.png`, `zartar-home-mobile.png`.
- Gates before finishing: `npm run test:unit`, `npm run lint`, `npm run build`, `node --test tests/rendered-html.test.mjs`.

---

### Task 1: Quota helper + Burmese digits

**Files:**
- Create: `lib/readings/quota.ts`, `lib/content/burmese-digits.ts`
- Test: `tests/quota.test.ts`, `tests/burmese-digits.test.ts`

**Interfaces:**
- Consumes: `localDateInTimezone(instant: Date, timezone: string): string` from `lib/astrology/time.ts`.
- Produces: `dailyQuota(readings, now, timezone?, limit?) => { used, remaining, limit, resetsAt }`, `QUOTA_LIMIT = 3`, `toBurmeseDigits(value: number | string): string`.

- [ ] **Step 1: Write failing tests**

```ts
// tests/quota.test.ts
import { describe, expect, it } from "vitest";
import { dailyQuota, QUOTA_LIMIT } from "@/lib/readings/quota";

const at = (iso: string, status = "complete") => ({ createdAt: iso, status });

describe("dailyQuota", () => {
  it("counts only readings on the same Yangon calendar day", () => {
    const now = new Date("2026-08-30T10:00:00Z"); // 16:30 Yangon
    const readings = [
      at("2026-08-29T17:29:00Z"), // 23:59 Aug 29 Yangon → previous day
      at("2026-08-29T17:31:00Z"), // 00:01 Aug 30 Yangon → today
      at("2026-08-30T09:00:00Z"), // today
    ];
    const quota = dailyQuota(readings, now);
    expect(quota.used).toBe(2);
    expect(quota.remaining).toBe(1);
    expect(quota.limit).toBe(QUOTA_LIMIT);
  });

  it("ignores failed readings and never goes negative", () => {
    const now = new Date("2026-08-30T10:00:00Z");
    const readings = [
      at("2026-08-30T01:00:00Z"), at("2026-08-30T02:00:00Z"),
      at("2026-08-30T03:00:00Z"), at("2026-08-30T04:00:00Z"),
      at("2026-08-30T05:00:00Z", "failed"),
    ];
    const quota = dailyQuota(readings, now);
    expect(quota.used).toBe(4);
    expect(quota.remaining).toBe(0);
  });

  it("resets at the next local midnight", () => {
    const quota = dailyQuota([], new Date("2026-08-30T10:00:00Z"));
    expect(quota.resetsAt).toBe("2026-08-30T17:30:00.000Z");
  });
});
```

```ts
// tests/burmese-digits.test.ts
import { expect, it } from "vitest";
import { toBurmeseDigits } from "@/lib/content/burmese-digits";

it("converts ASCII digits to Burmese digits", () => {
  expect(toBurmeseDigits(2)).toBe("၂");
  expect(toBurmeseDigits("2 / 3")).toBe("၂ / ၃");
  expect(toBurmeseDigits("2026-08-30")).toBe("၂၀၂၆-၀၈-၃၀");
});
```

- [ ] **Step 2: Run tests, expect failure** — `npx vitest run tests/quota.test.ts tests/burmese-digits.test.ts` → "Failed to resolve import".

- [ ] **Step 3: Implement**

```ts
// lib/content/burmese-digits.ts
const digits = ["၀", "၁", "၂", "၃", "၄", "၅", "၆", "၇", "၈", "၉"];
export function toBurmeseDigits(value: number | string): string {
  return String(value).replace(/\d/g, (d) => digits[Number(d)]);
}
```

```ts
// lib/readings/quota.ts
import { localDateInTimezone, localDateTimeToUtc } from "@/lib/astrology/time";

export const QUOTA_LIMIT = 3;
export const QUOTA_TIMEZONE = "Asia/Yangon";

export type QuotaReading = { createdAt: string; status: string };
export type DailyQuota = { used: number; remaining: number; limit: number; resetsAt: string };

function nextLocalMidnight(now: Date, timezone: string): Date {
  const today = localDateInTimezone(now, timezone);
  const noon = new Date(`${today}T12:00:00.000Z`);
  noon.setUTCDate(noon.getUTCDate() + 1);
  return localDateTimeToUtc(noon.toISOString().slice(0, 10), "00:00", timezone);
}

export function dailyQuota(readings: QuotaReading[], now: Date, timezone = QUOTA_TIMEZONE, limit = QUOTA_LIMIT): DailyQuota {
  const today = localDateInTimezone(now, timezone);
  const used = readings.filter((r) => r.status !== "failed" && localDateInTimezone(new Date(r.createdAt), timezone) === today).length;
  return { used, remaining: Math.max(0, limit - used), limit, resetsAt: nextLocalMidnight(now, timezone).toISOString() };
}
```

Check `localDateTimeToUtc(localDate, localTime, timezone)` in `lib/astrology/time.ts:24` accepts `"HH:MM"`; if it expects `"HH:MM:SS"` adjust to `"00:00:00"`.

- [ ] **Step 4: Run tests, expect pass.**
- [ ] **Step 5: Commit** — `git add lib/readings/quota.ts lib/content/burmese-digits.ts tests/quota.test.ts tests/burmese-digits.test.ts && git commit -m "feat: add daily question quota helper"`

---

### Task 2: Wire quota into `POST /api/readings`

**Files:**
- Modify: `app/api/readings/route.ts:22-26`

**Interfaces:**
- Consumes: `dailyQuota` from Task 1, `listReadings(userId)`.
- Produces: 429 body `{ error: "quota_exhausted", resetsAt }`.

- [ ] **Step 1:** Replace the 10-minute window block with:

```ts
const recent = await listReadings(user.userId);
const quota = dailyQuota(recent, new Date());
if (quota.remaining === 0) {
  return Response.json({ error: "quota_exhausted", resetsAt: quota.resetsAt }, { status: 429 });
}
```

Import `dailyQuota` from `@/lib/readings/quota`. Note: `listReadings` is limited to 40 rows ordered desc — enough for a daily window.

- [ ] **Step 2:** Update `components/suriya/question-composer.tsx` submit: if `response.status === 429` → `window.location.assign("/ask")` (page re-renders in quota state). Keep other branches.
- [ ] **Step 3:** `npm run lint` passes. Commit: `git commit -am "feat: enforce three free questions per day"`.

---

### Task 3: Bookings schema, migration, repository, request schema

**Files:**
- Modify: `db/schema.ts` (add columns + table), `lib/ids.ts` (allow `bkg`), `lib/content/demo.ts` (specialist fields)
- Create: `drizzle/0002_tarot_bookings.sql` + journal entry (run `npm run db:generate` — it writes the SQL and `drizzle/meta`; rename tag if desired, keep journal consistent), `db/repositories/bookings.ts`, `lib/schemas/booking.ts`
- Test: `tests/booking-schema.test.ts`, `tests/ids.test.ts` (extend)

**Interfaces:**
- Produces:
  - `bookingRequestSchema` (Zod) with `{ specialistId, name, phone, contactChannel, preferredDate, preferredTime, topic, note? }` and type `BookingRequestInput`.
  - `bookingDateBounds(now: Date, timezone = "Asia/Yangon") => { min: string; max: string }`.
  - `createBooking(input: BookingInsert)`, `getBooking(id)`, `countRecentBookings(key: { userId?: string; ipHash?: string }, sinceIso: string)`.
  - `TarotSpecialist` gains `location: string; sessionMinutes: number`.

- [ ] **Step 1: Failing schema test**

```ts
// tests/booking-schema.test.ts
import { describe, expect, it } from "vitest";
import { bookingDateBounds, bookingRequestSchema } from "@/lib/schemas/booking";

const valid = {
  specialistId: "thiri", name: "မမ", phone: "+95 9 123 456 789", contactChannel: "viber",
  preferredDate: "2026-09-05", preferredTime: "evening", topic: "love", note: "",
};

describe("bookingRequestSchema", () => {
  it("accepts a valid request and trims", () => {
    const parsed = bookingRequestSchema.parse({ ...valid, name: "  မမ  " });
    expect(parsed.name).toBe("မမ");
    expect(parsed.note).toBeUndefined();
  });
  it("rejects a bad phone with a Burmese message", () => {
    const result = bookingRequestSchema.safeParse({ ...valid, phone: "abc" });
    expect(result.success).toBe(false);
    expect(result.error?.issues[0]?.message).toMatch(/ဖုန်း/);
  });
  it("rejects unknown enums", () => {
    expect(bookingRequestSchema.safeParse({ ...valid, topic: "money" }).success).toBe(false);
  });
});

it("bookingDateBounds spans today to +60 days in Yangon", () => {
  const bounds = bookingDateBounds(new Date("2026-08-30T18:00:00Z"));
  expect(bounds.min).toBe("2026-08-31");
  expect(bounds.max).toBe("2026-10-30");
});
```

- [ ] **Step 2: Run → fails.**
- [ ] **Step 3: Implement schema**

```ts
// lib/schemas/booking.ts
import { z } from "zod";
import { localDateInTimezone } from "@/lib/astrology/time";

export const contactChannelSchema = z.enum(["phone", "viber", "telegram", "messenger"]);
export const preferredTimeSchema = z.enum(["morning", "afternoon", "evening"]);
export const bookingTopicSchema = z.enum(["love", "career", "direction", "other"]);

const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "ရက်စွဲ မမှန်ပါ");

export const bookingRequestSchema = z.object({
  specialistId: z.string().trim().min(1).max(60),
  name: z.string().trim().min(2, "အမည်ကို ရေးပါ").max(80, "အမည် ရှည်လွန်းပါသည်"),
  phone: z.string().trim().regex(/^\+?[\d\s-]{7,20}$/, "ဖုန်းနံပါတ် မမှန်ပါ"),
  contactChannel: contactChannelSchema,
  preferredDate: isoDate,
  preferredTime: preferredTimeSchema,
  topic: bookingTopicSchema,
  note: z.string().trim().max(500, "မှတ်ချက် စာလုံး ၅၀၀ မကျော်ရပါ").optional().transform((v) => (v ? v : undefined)),
});
export type BookingRequestInput = z.infer<typeof bookingRequestSchema>;

function addDays(localDate: string, days: number) {
  const d = new Date(`${localDate}T12:00:00.000Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}
export function bookingDateBounds(now = new Date(), timezone = "Asia/Yangon") {
  const min = localDateInTimezone(now, timezone);
  return { min, max: addDays(min, 60) };
}
export function isBookingDateInRange(date: string, now = new Date(), timezone = "Asia/Yangon") {
  const { min, max } = bookingDateBounds(now, timezone);
  return date >= min && date <= max;
}
```

- [ ] **Step 4: Schema + ids + demo**

`db/schema.ts` — add to `tarotSpecialists`: `location: text("location").notNull().default("")`, `sessionMinutes: integer("session_minutes").notNull().default(30)`. Add:

```ts
export const tarotBookings = sqliteTable("tarot_bookings", {
  id: text("id").primaryKey(),
  userId: text("user_id").references(() => profiles.id, { onDelete: "set null" }),
  ipHash: text("ip_hash"),
  specialistId: text("specialist_id").notNull(),
  name: text("name").notNull(),
  phone: text("phone").notNull(),
  contactChannel: text("contact_channel", { enum: ["phone", "viber", "telegram", "messenger"] }).notNull(),
  preferredDate: text("preferred_date").notNull(),
  preferredTime: text("preferred_time", { enum: ["morning", "afternoon", "evening"] }).notNull(),
  topic: text("topic", { enum: ["love", "career", "direction", "other"] }).notNull(),
  note: text("note"),
  status: text("status", { enum: ["requested", "confirmed", "completed", "cancelled"] }).notNull().default("requested"),
  ...timestamps,
}, (table) => [
  index("tarot_bookings_specialist_idx").on(table.specialistId, table.createdAt),
  index("tarot_bookings_user_idx").on(table.userId, table.createdAt),
  index("tarot_bookings_ip_idx").on(table.ipHash, table.createdAt),
]);
export type TarotBookingRow = typeof tarotBookings.$inferSelect;
```

`specialistId` is not a FK so demo specialists (not in DB) can be booked.

`lib/ids.ts`: add `"bkg"` to the prefix set and union. Extend `tests/ids.test.ts` with `expect(newId("bkg")).toMatch(/^bkg_/)`.

`lib/content/demo.ts`: add `location` (e.g. `"ရန်ကုန် · ကမာရွတ်"`, `"ရန်ကုန် · လှိုင်"`) and `sessionMinutes: 30` to both demo specialists; change `availability` to `"စနေ · တနင်္ဂနွေ"` and `"အင်္ဂါ · ကြာသပတေး · စနေ"`; `rate` to `"၃၀ မိနစ် · ၂၅,၀၀၀ ကျပ်"` / `"၃၀ မိနစ် · ၃၀,၀၀၀ ကျပ်"`.

Run `npm run db:generate` to create the migration; verify the SQL adds two columns and the table, and add the three `CREATE INDEX IF NOT EXISTS` to `db/initialize.ts`.

- [ ] **Step 5: Repository**

```ts
// db/repositories/bookings.ts
import { and, eq, gte, sql } from "drizzle-orm";
import { getDb } from "@/db";
import { tarotBookings } from "@/db/schema";
import { newId } from "@/lib/ids";

export type BookingInsert = Omit<typeof tarotBookings.$inferInsert, "id" | "createdAt" | "updatedAt" | "status">;

export async function createBooking(input: BookingInsert) {
  const db = await getDb();
  const [row] = await db.insert(tarotBookings).values({ id: newId("bkg"), ...input }).returning();
  return row;
}

export async function getBooking(id: string) {
  const db = await getDb();
  return db.query.tarotBookings.findFirst({ where: eq(tarotBookings.id, id) });
}

export async function countRecentBookings(key: { userId?: string; ipHash?: string }, sinceIso: string) {
  const db = await getDb();
  const column = key.userId ? eq(tarotBookings.userId, key.userId) : eq(tarotBookings.ipHash, key.ipHash ?? "");
  const [row] = await db.select({ count: sql<number>`count(*)` }).from(tarotBookings)
    .where(and(column, gte(tarotBookings.createdAt, sinceIso)));
  return Number(row?.count ?? 0);
}
```

- [ ] **Step 6:** `npm run test:unit`, `npm run lint`. Commit: `git add -A db drizzle lib/ids.ts lib/schemas/booking.ts lib/content/demo.ts tests && git commit -m "feat: add tarot booking storage and schema"` (never `git add .` — untracked user files).

---

### Task 4: `POST /api/bookings`

**Files:**
- Create: `app/api/bookings/route.ts`
- Modify: `lib/content/demo.ts` — export `findDemoSpecialist(id)`.

**Interfaces:**
- Consumes: `bookingRequestSchema`, `isBookingDateInRange`, `createBooking`, `countRecentBookings`, `getSpecialist`, `getChatGPTUser`.
- Produces: `201 { id }`, `400 { error }`, `404 { error: "specialist_not_found" }`, `429 { error: "too_many_bookings" }`, `503 { error: "booking_service_unavailable" }`.

- [ ] **Step 1:** Implement

```ts
import { getChatGPTUser } from "@/app/chatgpt-auth";
import { countRecentBookings, createBooking } from "@/db/repositories/bookings";
import { getSpecialist } from "@/db/repositories/specialists";
import { demoSpecialists } from "@/lib/content/demo";
import { bookingRequestSchema, isBookingDateInRange } from "@/lib/schemas/booking";

export const dynamic = "force-dynamic";

async function hashIp(ip: string) {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(ip));
  return Array.from(new Uint8Array(digest)).map((b) => b.toString(16).padStart(2, "0")).join("").slice(0, 16);
}

export async function POST(request: Request) {
  const parsed = bookingRequestSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: parsed.error.issues[0]?.message ?? "invalid_booking" }, { status: 400 });
  const input = parsed.data;
  if (!isBookingDateInRange(input.preferredDate)) return Response.json({ error: "ရက်စွဲသည် ယနေ့မှ ရက် ၆၀ အတွင်း ဖြစ်ရပါမည်" }, { status: 400 });
  const known = demoSpecialists.some((s) => s.id === input.specialistId) || Boolean(await getSpecialist(input.specialistId).catch(() => null));
  if (!known) return Response.json({ error: "specialist_not_found" }, { status: 404 });
  const user = await getChatGPTUser();
  const ipHash = user ? null : await hashIp(request.headers.get("cf-connecting-ip") ?? "unknown");
  try {
    const since = new Date(Date.now() - 60 * 60_000).toISOString();
    const recent = await countRecentBookings(user ? { userId: user.userId } : { ipHash: ipHash ?? undefined }, since);
    if (recent >= 3) return Response.json({ error: "too_many_bookings" }, { status: 429 });
    const booking = await createBooking({ ...input, note: input.note ?? null, userId: user?.userId ?? null, ipHash });
    return Response.json({ id: booking.id }, { status: 201, headers: { "cache-control": "private, no-store" } });
  } catch {
    return Response.json({ error: "booking_service_unavailable" }, { status: 503 });
  }
}
```

Watch: `createdAt` default is `CURRENT_TIMESTAMP` (`YYYY-MM-DD HH:MM:SS`, no `T`); compare using the same format: `since = new Date(...).toISOString().slice(0, 19).replace("T", " ")`. Check how `readings.createdAt` is stored (`listReadings` output) and match it; if readings are ISO with `T`, D1 default gives the space form — use the space form for the comparison.

- [ ] **Step 2:** `npm run lint`. Commit `feat: add booking request endpoint`.

---

### Task 5: Booking form, specialist page, confirmation page

**Files:**
- Create: `components/suriya/booking-form.tsx` (client), `app/tarot/bookings/[id]/page.tsx`, `lib/content/booking-copy.ts`
- Modify: `app/tarot/[id]/page.tsx`, `app/globals.css`
- Test: `tests/booking-copy.test.ts`

**Interfaces:**
- Produces: `BookingForm({ specialistId, specialistName, defaultName, timezone })`, `bookingLabels` maps for `contactChannel`/`preferredTime`/`topic` → Burmese, `maskPhone(phone)` → `"•••• 789"`.

- [ ] **Step 1: Failing copy test**

```ts
import { expect, it } from "vitest";
import { bookingLabels, maskPhone } from "@/lib/content/booking-copy";
it("labels enums in Burmese", () => {
  expect(bookingLabels.preferredTime.morning).toMatch(/နံနက်/);
  expect(bookingLabels.topic.love).toBe("ချစ်ရေး");
});
it("masks all but the last three digits", () => {
  expect(maskPhone("+95 9 123 456 789")).toBe("•••• 789");
});
```

- [ ] **Step 2:** Implement `lib/content/booking-copy.ts`:

```ts
export const bookingLabels = {
  contactChannel: { phone: "ဖုန်းခေါ်ဆိုမှု", viber: "Viber", telegram: "Telegram", messenger: "Messenger" },
  preferredTime: { morning: "နံနက် (၉–၁၂)", afternoon: "နေ့လယ် (၁–၄)", evening: "ညနေ (၅–၈)" },
  topic: { love: "ချစ်ရေး", career: "အလုပ်အကိုင်", direction: "ဘဝလမ်းကြောင်း", other: "အခြား" },
} as const;
export function maskPhone(phone: string) {
  const digits = phone.replace(/\D/g, "");
  return `•••• ${digits.slice(-3)}`;
}
```

- [ ] **Step 3:** `BookingForm` — controlled form, fields per spec, `id="booking"` on wrapping `<section>`, uses `bookingDateBounds(new Date(), timezone)` for `min/max`, submit to `/api/bookings`, statuses: pending text `ရက်ချိန်း တောင်းဆိုနေပါတယ်…`, error mapping: `specialist_not_found` → `ပညာရှင်ကို ရှာမတွေ့ပါ`, `too_many_bookings` → `တောင်းဆိုမှု များလွန်းနေပါတယ်။ ခဏနားပြီး ပြန်စမ်းပါ။`, `booking_service_unavailable` → `လောလောဆယ် မသိမ်းနိုင်သေးပါ။ ပြန်စမ်းပါ။` + phone line when `contactPhone` prop set (page reads `process.env.TAROT_CONTACT_PHONE`), other → the server message. On 201 → `window.location.assign(`/tarot/bookings/${id}`)`. Labels via `<label htmlFor>`; every input has an id prefixed `booking-`.
- [ ] **Step 4:** `/tarot/[id]/page.tsx` — remove "Preview"/disabled button; `toView` maps `location`, `sessionMinutes`; facts list adds location (`MapPin`) and `{sessionMinutes} မိနစ်`; replace `<aside className="consultant-preview-action">` with `<BookingForm …/>` inside `<section className="booking-card surface" id="booking">`. Fetch `getChatGPTUser()` for `defaultName`.
- [ ] **Step 5:** `/tarot/bookings/[id]/page.tsx` — `getBooking(id)` (catch → null) → `notFound()`; resolve specialist name via `getSpecialist` or demo; render `page-heading` "ရက်ချိန်း တောင်းဆိုမှု လက်ခံရရှိပါပြီ", a `dl` with reader, date (`toBurmeseDigits`), time label, topic label, contact `bookingLabels.contactChannel` + `maskPhone`, then policy card: "၂၄ နာရီအတွင်း ဖုန်းဆက်၍ အတည်ပြုပေးပါမည်။ ငွေကို ဆွေးနွေးချိန်တွင် ပေးချေပါ။ ၂၄ နာရီ ကြိုတင်၍ အခမဲ့ ပယ်ဖျက်နိုင်ပါသည်။" and links `/daily`, `/tarot`. `export const dynamic = "force-dynamic"`.
- [ ] **Step 6:** CSS: `.booking-card` (grid gap 14px, padding 18px, gold tint `#efe1c6` border-left like `.consultant-intro`), `.booking-grid` two columns ≥720px, `.booking-summary dl` rows, `.booking-policy`. Reuse `.text-field`, `.select-field`, `.text-area`, `.field-group`, `.field-label`, `.primary-button`, `.form-message`.
- [ ] **Step 7:** `npm run test:unit && npm run lint`. Commit `feat: add tarot booking form and confirmation`.

---

### Task 6: `/tarot` sales page + specialist cards

**Files:**
- Modify: `app/tarot/page.tsx`, `components/suriya/tarot-specialist-card.tsx`, `components/suriya/consultant-directory.tsx` (no logic change; card only), `app/globals.css`
- Test: `tests/rendered-html.test.mjs` (extend in Task 8)

- [ ] **Step 1:** Card: show `location` and `availability` chips, `rate`, primary `<a className="primary-button specialist-link" href={`/tarot/${id}#booking`}>ရက်ချိန်းယူရန်</a>` and secondary text link `Profile`. Remove `Preview ·` and `preview-note`.
- [ ] **Step 2:** Page: hero (`tarot-hero`, plum background like `.consultant-profile-hero`, eyebrow `TAROT · လူချင်းတွေ့ ဆွေးနွေးမှု`, h1 `Tarot ပညာရှင်နှင့် လူချင်းတွေ့ ဆွေးနွေးပါ`, lede, CTA `href="#consultants"` `ပညာရှင် ရွေးရန်`), `tarot-steps` ordered list of three `<li>` (ရွေးချယ် → ရက်ချိန်းတောင်း → ဖုန်းဖြင့် အတည်ပြု), directory, `tarot-trust` list (ဆွေးနွေးချိန်တွင် ပေးချေ / ကိုယ်ရေးလုံခြုံ / ၂၄ နာရီကြို အခမဲ့ပယ်ဖျက်). Remove `consultant-intro` preview block. Map `location`/`sessionMinutes` in `rows.map`.
- [ ] **Step 3:** CSS for `.tarot-hero`, `.tarot-steps` (3 cols ≥720), `.tarot-trust`, `.specialist-chips`. Keep Burmese ≥ .75rem.
- [ ] **Step 4:** `npm run lint`. Commit `feat: turn tarot directory into booking funnel`.

---

### Task 7: Upsell component, Ask quota state, navigation, home card

**Files:**
- Create: `components/suriya/tarot-upsell.tsx`, `components/suriya/quota-pill.tsx`
- Modify: `app/ask/page.tsx`, `app/daily/page.tsx`, `app/readings/[id]/page.tsx`, `lib/content/navigation.ts`, `components/suriya/bottom-nav.tsx`, `components/suriya/route-cards.tsx`, `app/globals.css`
- Test: `tests/navigation.test.ts`

**Interfaces:**
- Produces: `TarotUpsell({ variant: "inline" | "quota", resetsAt?: string })`, `QuotaPill({ used, limit })`.

- [ ] **Step 1: Update navigation test first**

```ts
expect(navigationItems.some((item) => item.href === "/tarot")).toBe(true);
expect(navigationItems.some((item) => item.href === "/chart")).toBe(false);
expect(topNavigationLinks.find((item) => item.href === "/tarot")?.label).toBe("Tarot ဆွေးနွေးမှု");
expect(topNavigationLinks.find((item) => item.href === "/chart")?.label).toBe("မွေးဇာတာ");
```

Run → fails.

- [ ] **Step 2:** `navigation.ts`: bottom item `{ href: "/tarot", label: "Tarot", icon: "tarot" }` replaces chart; top link label `Tarot ဆွေးနွေးမှု`. `bottom-nav.tsx` icons: `tarot: Sparkles`, daily: `SunMedium` (avoid duplicate icons). Home `route-cards.tsx`: insert `{ href: "/tarot", icon: Sparkles, title: "Tarot ဆွေးနွေးမှု", description: "လူချင်းတွေ့ Tarot ဆွေးနွေးမှု ရက်ချိန်းယူရန်", tone: "gold" }` after `/ask`; chart card tone `"paper"` (add `.route-card[data-tone="paper"]{background:var(--cosmic-paper)}`).
- [ ] **Step 3:** `TarotUpsell`: inline → `<aside className="tarot-upsell" data-variant="inline">` with `Sparkles`, one sentence `လူသားအမြင် လိုအပ်ပါသလား။ Tarot ပညာရှင်နှင့် လူချင်းတွေ့ ဆွေးနွေးနိုင်ပါသည်။`, link `/tarot` `ရက်ချိန်းယူရန်`. quota → `<section className="tarot-upsell" data-variant="quota" aria-labelledby="quota-title">` h2 `ယနေ့ အခမဲ့မေးခွန်း ကုန်သွားပါပြီ`, text with reset time formatted `Intl.DateTimeFormat("en-GB",{hour:"2-digit",minute:"2-digit",timeZone:"Asia/Yangon"})` → `မနက်ဖြန် ၀၀:၀၀ တွင် ပြန်စတင်ပါမည်` (digits via `toBurmeseDigits`), primary link `/tarot`.
- [ ] **Step 4:** `QuotaPill`: `<span className="quota-pill">ယနေ့ ကျန် {toBurmeseDigits(limit-used)} / {toBurmeseDigits(limit)}</span>`.
- [ ] **Step 5:** `/ask`: when `daily.user`, compute `quota = dailyQuota(readings, new Date())`; header shows `QuotaPill`; if `quota.remaining === 0` render `<TarotUpsell variant="quota" resetsAt=… />` instead of the composer card; else composer + `<TarotUpsell variant="inline" />` below. Guests: composer, hint `<p className="field-meta">ဝင်ရောက်ပြီး တစ်နေ့ ၃ ကြိမ် အခမဲ့ မေးနိုင်ပါသည်</p>`, inline upsell. `/daily`: `<TarotUpsell variant="inline" />` before `MethodFootnote`. `/readings/[id]`: after `ReadingFeedback`.
- [ ] **Step 6:** CSS `.tarot-upsell` (gold tint, grid auto 1fr auto on ≥720, 44px link), `.quota-pill` (plum outline pill, .75rem).
- [ ] **Step 7:** `npm run test:unit && npm run lint`. Commit `feat: add tarot upsells and quota state`.

---

### Task 8: Rendered-HTML tests, build, Playwright audit, self-review

**Files:**
- Modify: `tests/rendered-html.test.mjs`
- Scratchpad: reuse `audit.py`

- [ ] **Step 1:** Add tests:

```js
test("tarot funnel renders booking calls to action", async () => {
  const html = await (await render("/tarot")).text();
  assert.match(html, /ရက်ချိန်းယူရန်/);
  assert.match(html, /href=["']\/tarot\/thiri#booking["']/);
  assert.doesNotMatch(html, /Preview|PREVIEW/);
});
test("specialist page renders the booking form", async () => {
  const html = await (await render("/tarot/thiri")).text();
  assert.match(html, /id=["']booking["']/);
  assert.match(html, /id=["']booking-phone["']/);
  assert.doesNotMatch(html, /booking မဖွင့်ရသေးပါ/);
});
test("ask, daily and home carry the tarot upsell", async () => {
  for (const path of ["/ask", "/daily"]) {
    const html = await (await render(path)).text();
    assert.match(html, /tarot-upsell/, path);
  }
  const home = await (await render("/")).text();
  assert.match(home, /href=["']\/tarot["']/);
});
test("unknown booking is a 404", async () => {
  assert.equal((await render("/tarot/bookings/bkg_missing")).status, 404);
});
```

Update the home test: `/daily → /ask → /tarot → /chart` order, and the existing check for `နည်းလမ်းများ` becomes `Tarot ဆွေးနွေးမှု`.

- [ ] **Step 2:** `npm run build && node --test tests/rendered-html.test.mjs` → all pass. Note `/tarot/bookings/[id]` hits the DB; in tests the DB is absent → `getBooking` throws → catch → 404 (verify this path).
- [ ] **Step 3:** `npm run start` (port 3000), run `audit.py` for `/tarot`, `/tarot/thiri`, `/ask` at 390/1280: 0 console errors, 0 overflow, Burmese ≥12px, every input labelled. Fix findings. `pkill -f "vinext start"`.
- [ ] **Step 4:** Self-review diff (`git diff main~N`) against spec: quota values, copy Burmese, no `next/link`, no leftover "Preview". Fix inline.
- [ ] **Step 5:** Final gates: `npm run test:unit && npm run lint && npm run build && node --test tests/rendered-html.test.mjs`. Commit `test: cover tarot funnel and quota rendering`.
