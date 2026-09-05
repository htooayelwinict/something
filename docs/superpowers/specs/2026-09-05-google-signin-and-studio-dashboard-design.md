# Google Sign-in and Studio Dashboard Design

Date: 2026-09-05
Status: Approved in chat

## Problem

Suriya sells in-person Tarot sessions, but the people who run that business have
no tools inside the product:

- The site editor cannot change a reader's profile (rate, availability, tags,
  bio) without a code change; the directory is seeded by a migration.
- A Tarot reader has no way to see who booked them. Operators read `tarot_bookings`
  straight from D1 (a non-goal accepted in the funnel spec).
- The only sign-in is "Sign in with ChatGPT" (platform headers). Readers and most
  Myanmar customers do not have ChatGPT accounts, and there is no notion of roles.

## Decision

1. **Google is the single sign-in for everyone** — customers, readers, and the
   editor. ChatGPT sign-in is removed. Existing ChatGPT profiles are adopted on
   the first Google sign-in with the same verified email.
2. **A Studio dashboard at `/studio`** with two roles resolved from the verified
   email: the *editor* (emails in `SITE_ADMIN_EMAILS`) manages every reader
   profile and sees every booking; a *teller* (a reader whose profile carries
   their `login_email`) edits their own profile and works their own bookings.

The work ships in two phases, each with its own plan, verification, and merge:

- **Phase A — Google sign-in** (identity, sessions, login UI, legacy adoption).
- **Phase B — Studio** (roles, schema, repositories, pages, APIs, public-page
  additions).

## Non-goals

- Account merging beyond legacy ChatGPT adoption by email.
- Photo uploads (no R2 bucket is bound; a photo is an external https URL).
- Notifications to readers (email/SMS/Telegram), calendar or slot management,
  online payment.
- Editor management UI for the admin list itself (it stays in an env var so it
  cannot be escalated from the dashboard).
- Session revocation lists or secret rotation.

---

## Phase A — Google sign-in

### Identity model

`profiles` keeps `id` as the identity key that every other table references, so
readings, quota, birth details, and bookings need no changes.

Migration `0004` adds to `profiles`:

| column | type | notes |
| --- | --- | --- |
| auth_provider | text not null default `'chatgpt'` | enum `chatgpt` \| `google` |
| auth_subject | text | Google `sub`; backfilled to `id` for existing rows |

Backfill (hand-written in the migration after the generated DDL):
`UPDATE profiles SET auth_subject = id WHERE auth_subject IS NULL;`

Indexes: unique `profiles_auth_idx (auth_provider, auth_subject)`, plain
`profiles_email_idx (email)`. `db/initialize.ts` gains the same `CREATE … IF NOT
EXISTS` lines. `lib/ids.ts` allows the new prefix `usr` for Google-created rows.

### Resolving the profile on sign-in

`db/repositories/profiles.ts` gains `findOrCreateGoogleProfile({ sub, email,
name })`, driven by a pure, unit-tested decision function
`resolveGoogleProfile({ bySubject, legacyByEmail, sub, email, name })` in
`lib/auth/profile-resolution.ts`:

1. A row with `(google, sub)` exists → update `display_name`/`email`, return it.
2. Else a row with `auth_provider = 'chatgpt'` and `lower(email) = lower(<email>)`
   exists → **adopt**: set `auth_provider = 'google'`, `auth_subject = sub`,
   update `display_name`; the id is preserved so birth details and readings
   carry over.
3. Else insert `{ id: newId("usr"), auth_provider: 'google', auth_subject: sub,
   display_name: name ?? email, email }`.

`upsertProfile(user)` keeps its shape (used on write paths to guarantee the row
exists) and only touches `display_name`/`email`/`updated_at` on conflict.

### Session cookie

`lib/auth/session.ts` (pure, Web Crypto only):

- Cookie `suriya_session`, value `<base64url(payload)>.<base64url(hmac)>` where
  the HMAC is SHA-256 over the encoded payload keyed by `SESSION_SECRET`.
- Payload `{ v: 1, uid, email, name, iat, exp }`; lifetime 30 days, fixed.
- Attributes: `Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=2592000`.
- `verifySessionCookie(value, secret, now)` returns the payload or `null` on
  bad format, bad signature (`crypto.subtle.verify`, constant time), or expiry.
- `parseCookies(header)` is a small local parser; `next/headers` `cookies()` is
  not relied on.

A second short-lived cookie `suriya_oauth` (`Max-Age=600`, same attributes)
carries the signed `{ state, verifier, returnTo, exp }` between start and
callback.

### Google OAuth flow

`lib/auth/google.ts` (pure builders and validators, fetch injected):

- `googleConfig()` reads `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`,
  `SESSION_SECRET`; any missing → `null` (sign-in disabled).
- `redirectUri(requestUrl)` = `GOOGLE_REDIRECT_URI` if set, else
  `new URL("/auth/google/callback", requestUrl)`.
- `authorizeUrl({ clientId, redirectUri, state, codeChallenge })` →
  `https://accounts.google.com/o/oauth2/v2/auth` with `response_type=code`,
  `scope=openid email profile`, `code_challenge_method=S256`,
  `prompt=select_account`, `access_type=online`.
- `pkce()` → `{ verifier, challenge }` (43-char verifier, S256 challenge).
- `exchangeCode({ code, verifier, redirectUri, clientId, clientSecret }, fetch)`
  → POST `https://oauth2.googleapis.com/token` (form-encoded) → `{ id_token }`.
- `validateIdTokenClaims(idToken, { clientId, now })` decodes the JWT payload
  and requires `iss ∈ {https://accounts.google.com, accounts.google.com}`,
  `aud === clientId`, `exp * 1000 > now`, `email_verified === true`, non-empty
  `sub` and `email`. Returns `{ sub, email, name }`. The signature is not
  verified: the token is received directly from Google's token endpoint over
  TLS in a server-side exchange, which Google documents as sufficient.

Routes (all `dynamic = "force-dynamic"`, responses `cache-control: no-store`):

| route | behaviour |
| --- | --- |
| `GET /auth/google/start?return_to=` | unconfigured → 302 `/login?error=unconfigured`. Else create state + PKCE, set `suriya_oauth`, 302 to Google. |
| `GET /auth/google/callback?code&state` | `error`/missing params/cookie mismatch → 302 `/login?error=google`. Else exchange, validate, `findOrCreateGoogleProfile`, set `suriya_session`, clear `suriya_oauth`, 302 to the validated `returnTo`. Exchange/validation failure → 302 `/login?error=google`. DB failure → 302 `/login?error=service`. |
| `GET /auth/signout?return_to=` | clear `suriya_session`, 302 to the validated path (default `/`). |

Redirects are built with `new Response(null, { status: 302, headers })` so
`set-cookie` can accompany them.

### Current user module

`lib/auth/current-user.ts` replaces `app/chatgpt-auth.ts` (deleted):

```ts
export type AppUser = { userId: string; displayName: string; email: string; fullName: string | null };
export async function getCurrentUser(): Promise<AppUser | null>;  // session cookie only
export async function requireUser(returnTo: string): Promise<AppUser>; // redirect(loginPath(returnTo))
export function loginPath(returnTo: string): string;   // `/login?return_to=…`
export function signOutPath(returnTo = "/"): string;   // `/auth/signout?return_to=…`
export function safeRelativeReturnPath(value: string): string; // rejects non-relative, `//`, and `/auth/*`
```

`AppUser` keeps the `ChatGPTUser` field names so the sixteen call sites
(`app/api/**`, `app/profile`, `app/readings/**`, `app/onboarding`,
`app/tarot/[id]`, `lib/services/daily.ts`, `lib/services/period-reading.ts`,
`components/suriya/period-page.tsx`, `db/repositories/profiles.ts`,
`tests/daily-service.test.ts` mock path) change only their import and function
names.

### UI

- `/login`: one primary button `Google ဖြင့် အကောင့်ဖွင့်/ဝင်ရောက်မည်` →
  `/auth/google/start?return_to=…`. Privacy note becomes "Google ၏ လုံခြုံသော
  အကောင့်ဝင်ခြင်းကို အသုံးပြုပါတယ်။ သင့်စကားဝှက်ကို သုရိယက မမြင်ရ၊ မသိမ်းဆည်းပါ။".
  `?error=` renders one Burmese line: `unconfigured` → "ဝင်ရောက်ခြင်းကို ခဏ
  ရပ်ထားပါသည်။ နောက်မှ ပြန်စမ်းပါ။", `google` → "Google ဖြင့် ဝင်ရောက်ခြင်း
  မအောင်မြင်ပါ။ ပြန်စမ်းကြည့်ပါ။", `service` → "ဝန်ဆောင်မှု ခေတ္တမရနိုင်ပါ။".
- Every other sign-in CTA label `အကောင့်ဖွင့်/ဝင်ရောက်မည် (ChatGPT)` becomes
  `အကောင့်ဖွင့်/ဝင်ရောက်မည် (Google)` and links to `loginPath(<current path>)`.
- `/profile` account row: `အကောင့်ပိုင်ရှင် — {displayName} · {email}` and the
  sign-out link uses `signOutPath("/")`. Staff additionally see a `Studio`
  button (Phase B).
- `README.md`: sign-in section rewritten; env table gains the four variables.
- `.env.example` gains `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`,
  `GOOGLE_REDIRECT_URI` (optional), `SESSION_SECRET`, `SITE_ADMIN_EMAILS`.

### Configuration and rollout

Sign-in is disabled (friendly `unconfigured` notice) until the Sites environment
has `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, and `SESSION_SECRET`. The
publish checkpoint for Phase A must state that the deploy is blocked on:

1. A Google Cloud OAuth *Web application* client with authorized redirect URIs
   `https://suriya-myanmar.htoo368095.chatgpt.site/auth/google/callback` and
   `http://localhost:3000/auth/google/callback`.
2. The consent screen published (scopes `openid`, `email`, `profile` only, so no
   Google review). Domain verification, if Google asks, is an HTML file the
   editor downloads from Search Console and drops into `public/`.
3. The three secrets plus `SITE_ADMIN_EMAILS` set on the site.

### Security notes

- `state` and PKCE prevent CSRF/code injection on the callback.
- `return_to` is validated the same way as today and additionally rejects
  `/auth/*`.
- Session and OAuth cookies are `HttpOnly; Secure; SameSite=Lax`; the payload
  carries identity only — never a role.
- `SESSION_SECRET` and `GOOGLE_CLIENT_SECRET` are read server-side only.

---

## Phase B — Studio

### Roles

`lib/auth/staff.ts`:

```ts
export type Staff = { role: "editor"; user: AppUser } | { role: "teller"; user: AppUser; specialistId: string };
export function parseAdminEmails(value: string | undefined): Set<string>;  // comma-separated, trimmed, lower-cased
export function resolveStaff(user: AppUser | null, adminEmails: Set<string>, tellerBySpecialist: TarotSpecialistRow | null): Staff | null;
export async function getStaff(): Promise<Staff | null>;   // getCurrentUser + SITE_ADMIN_EMAILS + findSpecialistByLoginEmail
export async function requireStaff(returnTo: string): Promise<Staff | "forbidden">; // signed out → redirect(loginPath)
```

Resolution order: editor first, then teller (a reader listed as admin is an
editor). A teller whose profile is inactive still resolves (they may need to
finish bookings), but inactive readers are hidden from the public site.

Roles are resolved on every request; nothing role-related is stored in the
cookie, so clearing or changing a `login_email` revokes access immediately.

### Data

Migration `0005`:

`tarot_specialists`

| column | type | notes |
| --- | --- | --- |
| login_email | text | nullable; unique index `tarot_specialists_login_email_idx`; stored lower-cased |
| bio | text not null default `''` | ≤ 600 chars, shown on `/tarot/[id]` when non-empty |
| photo_url | text | nullable https URL ≤ 500 chars |
| is_active | integer not null default 1 | inactive readers are hidden publicly and not bookable |

`tarot_bookings`

| column | type | notes |
| --- | --- | --- |
| staff_note | text | nullable, ≤ 500 chars, staff-only |

`db/initialize.ts` gains the unique index line.

### Repositories

`db/repositories/specialists.ts`

- `listSpecialists({ includeInactive = false })`, `getSpecialist(id, { includeInactive = false })`
  — public callers keep the defaults; Studio passes `true`.
- `findSpecialistByLoginEmail(email)` (lower-cased compare).
- `createSpecialist(input)`; `updateSpecialist(id, patch)` returning the row.

`db/repositories/bookings.ts`

- `type BookingScope = { kind: "all" } | { kind: "specialist"; specialistId: string }`.
- `listBookingsForStaff(scope, { status?, specialistId?, limit = 200 })` ordered by
  `preferred_date` asc then `created_at` desc.
- `getBookingForStaff(id, scope)`, `updateBookingForStaff(id, scope, { status?, staffNote? })`,
  `countBookingsByStatus(scope)` → `Record<status, number>`.
- Every scoped query repeats `specialist_id = ?` in the SQL predicate — the same
  rule the user-owned readings repositories follow. Pages never filter in JS.

### Schemas (`lib/schemas/teller.ts`, `lib/schemas/staff-booking.ts`)

`tellerProfileSchema` (fields a teller may edit): `name` 2–80, `initials` 1–3,
`specialty` ≤ 80, `experience` ≤ 60, `displayRate` ≤ 60, `availabilityLabel`
≤ 80, `tags` 1–6 items ≤ 24 chars (submitted as comma/`၊`-separated text and
split), `location` ≤ 80, `sessionMinutes` int 15–180, `bio` ≤ 600, `photoUrl`
empty or `https://` ≤ 500.

`tellerEditorSchema` = profile fields + `loginEmail` (empty or email, lower-cased),
`isActive` boolean, `sortOrder` int 0–999.

`tellerCreateSchema` = editor schema + `id` matching `^[a-z0-9][a-z0-9-]{1,39}$`.

`bookingStaffPatchSchema` = `{ status?: requested|confirmed|completed|cancelled,
staffNote?: ≤ 500 }` with at least one key. Any status may be set by either
role; the UI offers the sensible next steps.

All messages are Burmese, following `lib/schemas/booking.ts`.

### Routes

Pages (`app/studio/**`, all `dynamic = "force-dynamic"`, metadata
`robots: { index: false, follow: false }`, every page calls `requireStaff`
and renders `<StudioNoAccess />` for `"forbidden"`):

| page | editor | teller |
| --- | --- | --- |
| `/studio` | stat tiles (requested / confirmed / completed this month), next 10 upcoming bookings, reader list summary | same tiles and upcoming list scoped to self, link to own profile |
| `/studio/tellers` | table of all readers (name, active, login email, sort) + "ပညာရှင် အသစ်" | redirect to `/studio/tellers/<own id>` |
| `/studio/tellers/new` | create form | forbidden |
| `/studio/tellers/[id]` | full edit form | own id only; editor-only fields omitted |
| `/studio/bookings?status=&teller=` | filterable table | own bookings, status filter only |
| `/studio/bookings/[id]` | full detail | own booking only |

Booking detail shows: customer name, phone as a `tel:` link (unmasked),
contact channel, preferred date (Burmese weekday) and time band, topic,
customer note, created time, current status, status buttons, and the staff
note form.

APIs (`app/api/studio/**`, JSON, `cache-control: private, no-store`):

| route | rule |
| --- | --- |
| `POST /api/studio/tellers` | editor only; `tellerCreateSchema`; 409 if id exists |
| `PUT /api/studio/tellers/[id]` | editor: `tellerEditorSchema`; teller: own id + `tellerProfileSchema` (extra keys rejected by strict parsing) |
| `PATCH /api/studio/bookings/[id]` | editor any; teller own; `bookingStaffPatchSchema` |

Status codes: 401 signed out, 403 not staff / wrong teller / CSRF check failed,
400 validation (first Burmese message), 404 unknown row, 503 DB unavailable.

CSRF: mutations require `sec-fetch-site` ∈ {`same-origin`, `none`} or an
`origin` header equal to the request origin (`lib/auth/csrf.ts`, pure,
unit-tested). Combined with `SameSite=Lax` cookies and JSON bodies this blocks
cross-site posts.

### Components

`components/studio/`

- `studio-shell.tsx` — compact shell: `StarField`, a top bar with the brand, a
  `Studio` word-mark, role badge (`တည်းဖြတ်သူ` / `ပညာရှင်`), links (ခြုံငုံ ·
  ရက်ချိန်းများ · ပညာရှင်များ), sign-out; no bottom nav or footer.
- `studio-no-access.tsx` — Burmese "ဤစာမျက်နှာကို ဝင်ရောက်ခွင့် မရှိပါ" with a
  switch-account link (`signOutPath("/login?return_to=/studio")`).
- `teller-form.tsx` (client) — controlled form; `mode: "create" | "editor" | "self"`
  decides which fields render; submits to the API; shows `form-message`/`form-error`.
- `booking-status-form.tsx` (client) — status buttons + staff note textarea →
  `PATCH`; reloads on success.
- `booking-table.tsx` — server table inside `.table-scroll`; rows link to the
  detail page; status rendered as `.status-badge[data-status]`.
- `stat-tiles.tsx` — three tiles with Burmese digits.

Copy lives in `lib/content/studio-copy.ts` (status labels: requested
`တောင်းဆိုထား`, confirmed `အတည်ပြုပြီး`, completed `ပြီးဆုံး`, cancelled
`ပယ်ဖျက်ထား`; field labels; error messages).

CSS additions in `app/globals.css` under a `/* Studio */` block: `.studio-shell`,
`.studio-bar`, `.studio-nav`, `.role-badge`, `.stat-tiles`, `.data-table`,
`.status-badge`, `.studio-filters`, all built from the Night Observatory tokens;
inputs reuse `.text-field`, `.field-group`, `.form-grid`.

### Public-page additions

- `TarotSpecialist` (`lib/content/demo.ts`) gains `bio` and `photoUrl`;
  `specialistFromRow` maps them; demo readers get `bio: ""`, `photoUrl: null`.
- `TarotSpecialistCard` and `/tarot/[id]` render `<img className="specialist-photo"
  loading="lazy" referrerPolicy="no-referrer" alt="">` when `photoUrl` is set,
  otherwise the monogram. The profile page shows `bio` in place of the generic
  sentence when non-empty.
- `/tarot`, `/tarot/[id]`, `sitemap.ts`, `POST /api/bookings` use active readers
  only (repository defaults). The demo fallback for environments without a
  database is unchanged.
- `/profile` shows a `Studio သို့ သွားရန်` button when `getStaff()` resolves.
- `app/robots.ts` disallows `/studio` and `/auth/`.

### Local verification

The Playwright audit needs signed-in Studio pages. `audit.py` mints a
`suriya_session` cookie with the dev `SESSION_SECRET` for an email listed in the
dev `SITE_ADMIN_EMAILS`, and a second cookie for `thiri`'s `login_email`. Local
D1 is bootstrapped by applying `drizzle/*.sql` to the Miniflare database with
`wrangler d1 execute --local` from a scratchpad config; if that proves
impossible, the pages must render their "ဒေတာဘေ့စ် မရနိုင်ပါ" state and the
audit runs against that.

---

## Testing

### Phase A

Unit (vitest): `tests/auth-session.test.ts` (round trip, tampered payload,
tampered signature, expired, malformed, cookie parsing, `Set-Cookie`
serialisation), `tests/auth-google.test.ts` (authorize URL parameters, PKCE
S256 known vector, `validateIdTokenClaims` accept/reject per claim,
`exchangeCode` with an injected fetch), `tests/return-path.test.ts`,
`tests/profile-resolution.test.ts` (update / adopt / create), updated
`tests/daily-service.test.ts`.

Rendered HTML: `/login` has the Google button href; `/auth/google/start` → 302
`/login?error=unconfigured` with `no-store`; `/auth/google/callback` without
state → 302 `/login?error=google`; `/onboarding` → 302
`/login?return_to=%2Fonboarding`; `/auth/signout` → 302 `/` with an expiring
`suriya_session` cookie; `/profile` and `/readings` guest CTAs say `(Google)`;
no `signin-with-chatgpt` anywhere.

Playwright audit: `/login` at 390 and 1280.

### Phase B

Unit: `tests/staff-role.test.ts` (admin parsing, editor precedence, teller
match, case-insensitivity, none), `tests/teller-schema.test.ts` (tag splitting,
slug, photo URL, strict self schema), `tests/staff-booking-schema.test.ts`,
`tests/csrf.test.ts`, `tests/studio-copy.test.ts`, `tests/consultant-filter.test.ts`
still green.

Rendered HTML: `/studio` and `/studio/bookings` → 302 to `/login?return_to=…`;
`PATCH /api/studio/bookings/x` → 401; `/tarot` unchanged for guests; `/tarot/thiri`
renders without a photo.

Playwright audit with minted cookies at 390 and 1280: `/studio`,
`/studio/tellers`, `/studio/tellers/thiri`, `/studio/bookings`, and a booking
detail when local D1 has rows — no console errors, no overflow, Burmese ≥ 12px,
inputs labelled, contrast ≥ 4.5:1.

Gates for both phases: `npm run lint`, `npm run test:unit`, `npm run build`,
`node --test tests/rendered-html.test.mjs`.

## Files

Phase A: `lib/auth/{session,google,current-user,profile-resolution}.ts`,
`app/auth/google/{start,callback}/route.ts`, `app/auth/signout/route.ts`,
`app/login/page.tsx`, `app/profile/page.tsx`, `app/readings/**`, `app/onboarding/page.tsx`,
`app/tarot/[id]/page.tsx`, `app/api/**` call sites, `lib/services/{daily,period-reading}.ts`,
`components/suriya/period-page.tsx`, `db/schema.ts`, `db/initialize.ts`,
`db/repositories/profiles.ts`, `lib/ids.ts`, `drizzle/0004_*.sql`, `.env.example`,
`README.md`, tests. Deleted: `app/chatgpt-auth.ts`.

Phase B: `lib/auth/{staff,csrf}.ts`, `lib/schemas/{teller,staff-booking}.ts`,
`lib/content/studio-copy.ts`, `db/schema.ts`, `db/initialize.ts`,
`db/repositories/{specialists,bookings}.ts`, `drizzle/0005_*.sql`,
`app/studio/**`, `app/api/studio/**`, `components/studio/*`,
`components/suriya/tarot-specialist-card.tsx`, `app/tarot/[id]/page.tsx`,
`app/profile/page.tsx`, `app/robots.ts`, `app/sitemap.ts`, `lib/content/demo.ts`,
`app/globals.css`, tests, `scratchpad/audit.py`.
