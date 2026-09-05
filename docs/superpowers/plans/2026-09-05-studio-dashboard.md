# Studio Dashboard (Phase B) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship `/studio`, where the site editor manages every Tarot reader profile and sees every booking, and each reader (teller) edits their own profile and works their own bookings with full customer contact details.

**Architecture:** Roles are resolved on every request from the signed-in Google email (`SITE_ADMIN_EMAILS` → editor, `tarot_specialists.login_email` → teller) by a small pure layer in `lib/auth/staff.ts`. Server-rendered pages under `app/studio/**` and JSON mutation routes under `app/api/studio/**` share one authorisation helper; every teller-scoped query repeats the teller's `specialist_id` in the SQL predicate. Migration `0005` adds the profile fields (`login_email`, `bio`, `photo_url`, `is_active`) and `staff_note`.

**Tech Stack:** vinext 1.0.0-beta.2, React 19, TypeScript 5.9, Drizzle + D1, Zod 4, Vitest 4, node:test rendered suite, Python Playwright audit, wrangler `d1 execute --local` for the dev database.

**Spec:** `docs/superpowers/specs/2026-09-05-google-signin-and-studio-dashboard-design.md` (Phase B section)

## Global Constraints

- All user-facing copy is Burmese; technical labels (Studio, Gmail, ID, https) stay Latin.
- Roles are never stored in the cookie; `requireStaff`/`staffForUser` run on every page and API request.
- Teller-scoped repository calls always include `specialist_id = ?` in the SQL predicate; pages never narrow scope in JavaScript.
- Studio pages: `dynamic = "force-dynamic"`, `robots: { index: false, follow: false }`; Studio APIs: `cache-control: private, no-store`.
- Mutations require a same-origin request (`sec-fetch-site` ∈ {`same-origin`, `none`} or matching `origin`).
- Public pages list only active readers; the booking API rejects inactive readers with 404.
- Do not touch `untitled.pen`, `zartar-home-desktop.png`, `zartar-home-mobile.png`. Never read `.env` or `.wrangler` file contents (running `wrangler d1 execute` against the local state is fine).
- Do not push or deploy. Work on `feat/google-signin-studio`; merge to `main` locally at the end.
- Commit trailer on every commit:
  `Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>` and
  `Claude-Session: https://claude.ai/code/session_015qi697RAwcuBTPXMQAwuii`.
- Gates before merge: `npm run lint`, `npm run test:unit`, `npm run build`, `node --test tests/rendered-html.test.mjs`.

**Deviations from the spec (settled here):** `requireStaff` returns `Staff | { role: "none"; user }` (the no-access page needs the email); the switch-account link is `signOutPath("/studio")` (sign-out lands on `/studio`, which redirects to `/login?return_to=%2Fstudio`); shared API plumbing lives in `lib/studio/api.ts`.

## File Structure

| file | responsibility |
| --- | --- |
| `db/schema.ts`, `drizzle/0005_*.sql`, `db/initialize.ts` | new columns and the login-email unique index |
| `db/repositories/specialists.ts` | active/inactive listing, login-email lookup, create, update |
| `db/repositories/bookings.ts` | staff-scoped list/get/update/count |
| `lib/auth/staff.ts` | `Staff`, `parseAdminEmails`, `resolveStaff`, `staffForUser`, `getStaff`, `requireStaff`, `bookingScope` |
| `lib/auth/csrf.ts` | `isSameOriginRequest` |
| `lib/schemas/teller.ts`, `lib/schemas/staff-booking.ts` | Zod schemas with Burmese messages |
| `lib/content/studio-copy.ts` | labels, nav, messages |
| `lib/studio/api.ts` | `authorizeStudioRequest`, `jsonError`, `firstIssueMessage`, `isUniqueViolation` |
| `components/studio/*` | `StudioShell`, `StudioNoAccess`, `StatTiles`, `BookingTable`, `TellerForm` (client), `BookingStatusForm` (client) |
| `app/studio/**` | overview, tellers list/new/edit, bookings list/detail |
| `app/api/studio/**` | `POST tellers`, `PUT tellers/[id]`, `PATCH bookings/[id]` |
| `lib/content/demo.ts`, `components/suriya/tarot-specialist-card.tsx`, `app/tarot/[id]/page.tsx`, `app/profile/page.tsx`, `app/robots.ts` | public-side additions |
| `app/globals.css` | `/* Studio */` block |
| tests | unit + rendered coverage |

---

### Task 1: Schema, migration 0005, repositories

**Files:**
- Modify: `db/schema.ts:53-87`, `db/initialize.ts`, `db/repositories/specialists.ts`, `db/repositories/bookings.ts`
- Create (generated): `drizzle/0005_<slug>.sql`, `drizzle/meta/0005_snapshot.json`, journal entry

**Interfaces:**
- Produces:
  - `tarotSpecialists` columns `loginEmail`, `bio`, `photoUrl`, `isActive`; `tarotBookings.staffNote`
  - `listSpecialists({ includeInactive? })`, `getSpecialist(id, { includeInactive? })`, `findSpecialistByLoginEmail(email)`, `createSpecialist(input: SpecialistInsert)`, `updateSpecialist(id, patch: SpecialistPatch)` (returns row or `null`)
  - `BookingStatus`, `BookingScope`, `BookingFilters`, `listBookingsForStaff(scope, filters?)`, `getBookingForStaff(id, scope)`, `updateBookingForStaff(id, scope, patch)` (row or `null`), `countBookingsByStatus(scope)`

- [ ] **Step 1: Extend the schema**

In `db/schema.ts`, replace the `tarotSpecialists` table definition with:

```ts
export const tarotSpecialists = sqliteTable("tarot_specialists", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  initials: text("initials").notNull(),
  specialty: text("specialty").notNull(),
  experience: text("experience").notNull(),
  displayRate: text("display_rate").notNull(),
  availabilityLabel: text("availability_label").notNull(),
  tags: text("tags", { mode: "json" }).$type<string[]>().notNull(),
  location: text("location").notNull().default(""),
  sessionMinutes: integer("session_minutes").notNull().default(30),
  sortOrder: integer("sort_order").notNull().default(0),
  loginEmail: text("login_email"),
  bio: text("bio").notNull().default(""),
  photoUrl: text("photo_url"),
  isActive: integer("is_active", { mode: "boolean" }).notNull().default(true),
  ...timestamps,
}, (table) => [
  index("tarot_specialists_sort_idx").on(table.sortOrder),
  uniqueIndex("tarot_specialists_login_email_idx").on(table.loginEmail),
]);
```

and add to `tarotBookings` after `status`:

```ts
  staffNote: text("staff_note"),
```

- [ ] **Step 2: Generate the migration**

Run: `npm run db:generate`
Expected: `drizzle/0005_<slug>.sql` with four `ALTER TABLE \`tarot_specialists\` ADD …`, one `ALTER TABLE \`tarot_bookings\` ADD \`staff_note\` text`, and `CREATE UNIQUE INDEX \`tarot_specialists_login_email_idx\` …`. Answer "new column" if drizzle-kit asks.

Add to `db/initialize.ts` before `PRAGMA optimize`:

```ts
    db.prepare("CREATE UNIQUE INDEX IF NOT EXISTS tarot_specialists_login_email_idx ON tarot_specialists(login_email)"),
```

- [ ] **Step 3: Rewrite `db/repositories/specialists.ts`**

```ts
import { and, asc, eq } from "drizzle-orm";
import { getDb } from "@/db";
import { tarotSpecialists } from "@/db/schema";

type Options = { includeInactive?: boolean };

export type SpecialistInsert = Omit<typeof tarotSpecialists.$inferInsert, "createdAt" | "updatedAt">;
export type SpecialistPatch = Partial<Omit<SpecialistInsert, "id">>;

export async function listSpecialists({ includeInactive = false }: Options = {}) {
  const db = await getDb();
  return db.select().from(tarotSpecialists)
    .where(includeInactive ? undefined : eq(tarotSpecialists.isActive, true))
    .orderBy(asc(tarotSpecialists.sortOrder), asc(tarotSpecialists.name));
}

export async function getSpecialist(id: string, { includeInactive = false }: Options = {}) {
  const db = await getDb();
  return db.query.tarotSpecialists.findFirst({
    where: includeInactive ? eq(tarotSpecialists.id, id) : and(eq(tarotSpecialists.id, id), eq(tarotSpecialists.isActive, true)),
  });
}

export async function findSpecialistByLoginEmail(email: string) {
  const db = await getDb();
  return db.query.tarotSpecialists.findFirst({ where: eq(tarotSpecialists.loginEmail, email.trim().toLowerCase()) });
}

export async function createSpecialist(input: SpecialistInsert) {
  const db = await getDb();
  const now = new Date().toISOString();
  const [row] = await db.insert(tarotSpecialists).values({ ...input, createdAt: now, updatedAt: now }).returning();
  return row;
}

export async function updateSpecialist(id: string, patch: SpecialistPatch) {
  const db = await getDb();
  const [row] = await db.update(tarotSpecialists).set({ ...patch, updatedAt: new Date().toISOString() })
    .where(eq(tarotSpecialists.id, id)).returning();
  return row ?? null;
}
```

- [ ] **Step 4: Add the staff-scoped booking queries**

Replace the import line of `db/repositories/bookings.ts` with
`import { and, asc, desc, eq, gte, inArray, sql } from "drizzle-orm";` and append:

```ts
export type BookingStatus = (typeof tarotBookings.$inferSelect)["status"];
export type BookingScope = { kind: "all" } | { kind: "specialist"; specialistId: string };
export type BookingFilters = { statuses?: BookingStatus[]; specialistId?: string; fromDate?: string; limit?: number };

function scopePredicate(scope: BookingScope) {
  return scope.kind === "specialist" ? eq(tarotBookings.specialistId, scope.specialistId) : undefined;
}

export async function listBookingsForStaff(scope: BookingScope, filters: BookingFilters = {}) {
  const db = await getDb();
  return db.select().from(tarotBookings)
    .where(and(
      scopePredicate(scope),
      filters.statuses && filters.statuses.length > 0 ? inArray(tarotBookings.status, filters.statuses) : undefined,
      scope.kind === "all" && filters.specialistId ? eq(tarotBookings.specialistId, filters.specialistId) : undefined,
      filters.fromDate ? gte(tarotBookings.preferredDate, filters.fromDate) : undefined,
    ))
    .orderBy(asc(tarotBookings.preferredDate), desc(tarotBookings.createdAt))
    .limit(filters.limit ?? 200);
}

export async function getBookingForStaff(id: string, scope: BookingScope) {
  const db = await getDb();
  return db.query.tarotBookings.findFirst({ where: and(eq(tarotBookings.id, id), scopePredicate(scope)) });
}

export async function updateBookingForStaff(id: string, scope: BookingScope, patch: { status?: BookingStatus; staffNote?: string | null }) {
  const db = await getDb();
  const [row] = await db.update(tarotBookings).set({ ...patch, updatedAt: new Date().toISOString() })
    .where(and(eq(tarotBookings.id, id), scopePredicate(scope))).returning();
  return row ?? null;
}

export async function countBookingsByStatus(scope: BookingScope): Promise<Record<BookingStatus, number>> {
  const db = await getDb();
  const rows = await db.select({ status: tarotBookings.status, count: sql<number>`count(*)` }).from(tarotBookings)
    .where(scopePredicate(scope)).groupBy(tarotBookings.status);
  const counts: Record<BookingStatus, number> = { requested: 0, confirmed: 0, completed: 0, cancelled: 0 };
  for (const row of rows) counts[row.status] = Number(row.count);
  return counts;
}
```

- [ ] **Step 5: Type-check and run the existing suites**

Run: `npx tsc --noEmit 2>&1 | grep -v "cloudflare:workers\|D1Database\|Fetcher\|tests/openrouter.test.ts"; npx vitest run`
Expected: no new type errors; unit suite green (the `daily-score` band test may time out under load — re-run alone).

- [ ] **Step 6: Commit**

```bash
git add db drizzle
git commit -m "feat(studio): reader profile fields, staff note, and staff-scoped repositories

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_015qi697RAwcuBTPXMQAwuii"
```

---

### Task 2: Roles and CSRF (`lib/auth/staff.ts`, `lib/auth/csrf.ts`)

**Files:**
- Create: `lib/auth/staff.ts`, `lib/auth/csrf.ts`
- Test: `tests/staff-role.test.ts`, `tests/csrf.test.ts`

**Interfaces:**
- Consumes: `getCurrentUser`, `AppUser` (`@/lib/auth/current-user`), `loginPath`, `findSpecialistByLoginEmail`.
- Produces:
  - `type Staff = { role: "editor"; user: AppUser } | { role: "teller"; user: AppUser; specialistId: string }`
  - `parseAdminEmails(value): Set<string>`, `resolveStaff(user, adminEmails, specialistId): Staff | null`
  - `staffForUser(user): Promise<Staff | null>`, `getStaff(): Promise<Staff | null>`
  - `requireStaff(returnTo): Promise<Staff | { role: "none"; user: AppUser }>` (redirects guests)
  - `bookingScope(staff): BookingScope`
  - `isSameOriginRequest(headers: Headers, requestUrl: string): boolean`

- [ ] **Step 1: Write the failing tests**

```ts
// tests/staff-role.test.ts
import { describe, expect, it } from "vitest";
import { bookingScope, parseAdminEmails, resolveStaff } from "@/lib/auth/staff";

const user = { userId: "usr_1", displayName: "Editor", email: "Editor@Example.com", fullName: null };

describe("parseAdminEmails", () => {
  it("splits, trims, lower-cases, and drops blanks", () => {
    expect([...parseAdminEmails(" A@x.com, b@Y.com ,, ")]).toEqual(["a@x.com", "b@y.com"]);
    expect(parseAdminEmails(undefined).size).toBe(0);
  });
});

describe("resolveStaff", () => {
  it("returns null for guests", () => {
    expect(resolveStaff(null, new Set(["editor@example.com"]), "tsp_thiri")).toBeNull();
  });

  it("prefers editor over teller and matches emails case-insensitively", () => {
    expect(resolveStaff(user, new Set(["editor@example.com"]), "tsp_thiri")).toEqual({ role: "editor", user });
  });

  it("resolves a teller from the matched specialist id", () => {
    expect(resolveStaff(user, new Set(), "tsp_thiri")).toEqual({ role: "teller", user, specialistId: "tsp_thiri" });
  });

  it("returns null for signed-in customers", () => {
    expect(resolveStaff(user, new Set(["someone@else.com"]), null)).toBeNull();
  });
});

describe("bookingScope", () => {
  it("gives editors everything and tellers their own id", () => {
    expect(bookingScope({ role: "editor", user })).toEqual({ kind: "all" });
    expect(bookingScope({ role: "teller", user, specialistId: "tsp_thiri" })).toEqual({ kind: "specialist", specialistId: "tsp_thiri" });
  });
});
```

```ts
// tests/csrf.test.ts
import { describe, expect, it } from "vitest";
import { isSameOriginRequest } from "@/lib/auth/csrf";

const url = "https://suriya.example/api/studio/bookings/x";

describe("isSameOriginRequest", () => {
  it("trusts sec-fetch-site same-origin and none", () => {
    expect(isSameOriginRequest(new Headers({ "sec-fetch-site": "same-origin" }), url)).toBe(true);
    expect(isSameOriginRequest(new Headers({ "sec-fetch-site": "none" }), url)).toBe(true);
    expect(isSameOriginRequest(new Headers({ "sec-fetch-site": "cross-site", origin: "https://suriya.example" }), url)).toBe(false);
  });

  it("falls back to a matching origin header", () => {
    expect(isSameOriginRequest(new Headers({ origin: "https://suriya.example" }), url)).toBe(true);
    expect(isSameOriginRequest(new Headers({ origin: "https://evil.example" }), url)).toBe(false);
    expect(isSameOriginRequest(new Headers({ origin: "not a url" }), url)).toBe(false);
  });

  it("rejects requests with neither header", () => {
    expect(isSameOriginRequest(new Headers(), url)).toBe(false);
  });
});
```

- [ ] **Step 2: Run them to verify they fail**

Run: `npx vitest run tests/staff-role.test.ts tests/csrf.test.ts`
Expected: FAIL — modules not found.

- [ ] **Step 3: Implement**

`lib/auth/staff.ts`:

```ts
import { redirect } from "next/navigation";
import { findSpecialistByLoginEmail } from "@/db/repositories/specialists";
import type { BookingScope } from "@/db/repositories/bookings";
import { getCurrentUser, type AppUser } from "./current-user";
import { loginPath } from "./paths";

export type Staff =
  | { role: "editor"; user: AppUser }
  | { role: "teller"; user: AppUser; specialistId: string };

export function parseAdminEmails(value: string | null | undefined): Set<string> {
  return new Set((value ?? "").split(",").map((item) => item.trim().toLowerCase()).filter(Boolean));
}

export function resolveStaff(user: AppUser | null, adminEmails: Set<string>, specialistId: string | null): Staff | null {
  if (!user) return null;
  if (adminEmails.has(user.email.trim().toLowerCase())) return { role: "editor", user };
  if (specialistId) return { role: "teller", user, specialistId };
  return null;
}

/** Roles are re-derived on every request; nothing role-related is trusted from the cookie. */
export async function staffForUser(user: AppUser): Promise<Staff | null> {
  const admins = parseAdminEmails(process.env.SITE_ADMIN_EMAILS);
  if (admins.has(user.email.trim().toLowerCase())) return { role: "editor", user };
  const specialist = await findSpecialistByLoginEmail(user.email).catch(() => null);
  return resolveStaff(user, admins, specialist?.id ?? null);
}

export async function getStaff(): Promise<Staff | null> {
  const user = await getCurrentUser();
  return user ? staffForUser(user) : null;
}

export async function requireStaff(returnTo: string): Promise<Staff | { role: "none"; user: AppUser }> {
  const user = await getCurrentUser();
  if (!user) redirect(loginPath(returnTo));
  return (await staffForUser(user)) ?? { role: "none", user };
}

export function bookingScope(staff: Staff): BookingScope {
  return staff.role === "editor" ? { kind: "all" } : { kind: "specialist", specialistId: staff.specialistId };
}
```

`lib/auth/csrf.ts`:

```ts
/** Browsers send sec-fetch-site on every fetch; origin is the fallback for older clients. */
export function isSameOriginRequest(headers: Headers, requestUrl: string): boolean {
  const fetchSite = headers.get("sec-fetch-site");
  if (fetchSite) return fetchSite === "same-origin" || fetchSite === "none";
  const origin = headers.get("origin");
  if (!origin) return false;
  try {
    return new URL(origin).origin === new URL(requestUrl).origin;
  } catch {
    return false;
  }
}
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `npx vitest run tests/staff-role.test.ts tests/csrf.test.ts`
Expected: PASS (8 tests).

- [ ] **Step 5: Commit**

```bash
git add lib/auth/staff.ts lib/auth/csrf.ts tests/staff-role.test.ts tests/csrf.test.ts
git commit -m "feat(studio): staff role resolution and same-origin check

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_015qi697RAwcuBTPXMQAwuii"
```

---

### Task 3: Schemas, copy, and API plumbing

**Files:**
- Create: `lib/schemas/teller.ts`, `lib/schemas/staff-booking.ts`, `lib/content/studio-copy.ts`, `lib/studio/api.ts`
- Test: `tests/teller-schema.test.ts`, `tests/staff-booking-schema.test.ts`, `tests/studio-copy.test.ts`

**Interfaces:**
- Produces:
  - `tellerProfileSchema`, `tellerEditorSchema`, `tellerCreateSchema` (strict; `tags` accepts an array or a `,`/`၊`-separated string and outputs `string[]`; `photoUrl` and `loginEmail` output `string | null`)
  - `bookingStatusSchema`, `bookingStaffPatchSchema` (`{ status?, staffNote?: string | null }`, at least one key)
  - `bookingStatusLabels`, `bookingStatusOrder`, `studioRoleLabels`, `studioNav`, `tellerFieldLabels`, `studioMessages`, `studioErrorMessage(code)`
  - `authorizeStudioRequest(request)`, `jsonError(code, status)`, `noStore`, `firstIssueMessage(error)`, `isUniqueViolation(error)`

- [ ] **Step 1: Write the failing tests**

```ts
// tests/teller-schema.test.ts
import { describe, expect, it } from "vitest";
import { tellerCreateSchema, tellerEditorSchema, tellerProfileSchema } from "@/lib/schemas/teller";

const profile = {
  name: "သီရိလမင်း", initials: "TL", specialty: "Tarot & Relationship Guidance", experience: "အတွေ့အကြုံ ၆ နှစ်",
  displayRate: "၃၀ မိနစ် · ၂၅,၀၀၀ ကျပ်", availabilityLabel: "စနေ · တနင်္ဂနွေ", tags: "ချစ်ရေး၊ အလုပ်အကိုင်, စိတ်ခံစားမှု ",
  location: "ရန်ကုန် · ကမာရွတ်", sessionMinutes: 30, bio: "", photoUrl: "",
};

describe("tellerProfileSchema", () => {
  it("splits tags on comma or Burmese comma and normalises empty urls to null", () => {
    const parsed = tellerProfileSchema.parse(profile);
    expect(parsed.tags).toEqual(["ချစ်ရေး", "အလုပ်အကိုင်", "စိတ်ခံစားမှု"]);
    expect(parsed.photoUrl).toBeNull();
    expect(tellerProfileSchema.parse({ ...profile, tags: ["a", "b"], photoUrl: "https://cdn.example/p.jpg" })).toMatchObject({ tags: ["a", "b"], photoUrl: "https://cdn.example/p.jpg" });
  });

  it("rejects non-https photos, bad minutes, too many tags, and editor-only keys", () => {
    expect(tellerProfileSchema.safeParse({ ...profile, photoUrl: "http://x/p.jpg" }).success).toBe(false);
    expect(tellerProfileSchema.safeParse({ ...profile, sessionMinutes: 10 }).success).toBe(false);
    expect(tellerProfileSchema.safeParse({ ...profile, tags: "a,b,c,d,e,f,g" }).success).toBe(false);
    expect(tellerProfileSchema.safeParse({ ...profile, isActive: false }).success).toBe(false);
    expect(tellerProfileSchema.safeParse({ ...profile, loginEmail: "x@y.com" }).success).toBe(false);
  });
});

describe("tellerEditorSchema / tellerCreateSchema", () => {
  it("lower-cases the login email, allows it empty, and validates the slug", () => {
    const editor = tellerEditorSchema.parse({ ...profile, loginEmail: " Thiri@Gmail.com ", isActive: true, sortOrder: 2 });
    expect(editor.loginEmail).toBe("thiri@gmail.com");
    expect(tellerEditorSchema.parse({ ...profile, loginEmail: "", isActive: false, sortOrder: 0 }).loginEmail).toBeNull();
    expect(tellerEditorSchema.safeParse({ ...profile, loginEmail: "nope", isActive: true, sortOrder: 0 }).success).toBe(false);
    expect(tellerCreateSchema.parse({ ...profile, id: "aye-aye-2", loginEmail: "", isActive: true, sortOrder: 0 }).id).toBe("aye-aye-2");
    for (const id of ["Aye", "a", "-aye", "aye aye", "a".repeat(41)]) {
      expect(tellerCreateSchema.safeParse({ ...profile, id, loginEmail: "", isActive: true, sortOrder: 0 }).success, id).toBe(false);
    }
  });
});
```

```ts
// tests/staff-booking-schema.test.ts
import { describe, expect, it } from "vitest";
import { bookingStaffPatchSchema } from "@/lib/schemas/staff-booking";

describe("bookingStaffPatchSchema", () => {
  it("accepts a status, a note, or both, and normalises an empty note to null", () => {
    expect(bookingStaffPatchSchema.parse({ status: "confirmed" })).toEqual({ status: "confirmed" });
    expect(bookingStaffPatchSchema.parse({ staffNote: "  ဖုန်းဆက်ပြီး  " })).toEqual({ staffNote: "ဖုန်းဆက်ပြီး" });
    expect(bookingStaffPatchSchema.parse({ staffNote: "" })).toEqual({ staffNote: null });
  });

  it("rejects empty patches, unknown statuses, long notes, and extra keys", () => {
    expect(bookingStaffPatchSchema.safeParse({}).success).toBe(false);
    expect(bookingStaffPatchSchema.safeParse({ status: "done" }).success).toBe(false);
    expect(bookingStaffPatchSchema.safeParse({ staffNote: "x".repeat(501) }).success).toBe(false);
    expect(bookingStaffPatchSchema.safeParse({ status: "confirmed", phone: "1" }).success).toBe(false);
  });
});
```

```ts
// tests/studio-copy.test.ts
import { describe, expect, it } from "vitest";
import { bookingStatusLabels, bookingStatusOrder, studioErrorMessage, studioMessages } from "@/lib/content/studio-copy";

describe("studio copy", () => {
  it("labels every booking status in Burmese", () => {
    for (const status of bookingStatusOrder) expect(bookingStatusLabels[status]).toMatch(/[က-႟]/);
  });

  it("maps api error codes to Burmese and passes Burmese messages through", () => {
    expect(studioErrorMessage("forbidden")).toBe(studioMessages.forbidden);
    expect(studioErrorMessage("အမည်ကို ရေးပါ")).toBe("အမည်ကို ရေးပါ");
    expect(studioErrorMessage("whatever")).toBe(studioMessages.invalid_input);
    expect(studioErrorMessage(undefined)).toBe(studioMessages.invalid_input);
  });
});
```

- [ ] **Step 2: Run them to verify they fail**

Run: `npx vitest run tests/teller-schema.test.ts tests/staff-booking-schema.test.ts tests/studio-copy.test.ts`
Expected: FAIL — modules not found.

- [ ] **Step 3: Implement the schemas**

`lib/schemas/teller.ts`:

```ts
import { z } from "zod";

const tagList = z.union([z.array(z.string()), z.string()])
  .transform((value) => (Array.isArray(value) ? value : value.split(/[,၊]/)).map((tag) => tag.trim()).filter(Boolean))
  .pipe(z.array(z.string().max(24, "အကြောင်းအရာ ရှည်လွန်းပါသည်")).min(1, "အကြောင်းအရာ တစ်ခုအနည်းဆုံး ထည့်ပါ").max(6, "အကြောင်းအရာ ၆ ခုအထိသာ"));

const httpsUrl = z.string().trim().max(500, "ဓာတ်ပုံလင့်ခ် ရှည်လွန်းပါသည်")
  .refine((value) => value === "" || /^https:\/\/\S+$/.test(value), "ဓာတ်ပုံလင့်ခ်သည် https:// ဖြင့် စရပါမည်")
  .transform((value) => value || null);

const optionalEmail = z.string().trim().toLowerCase().max(120, "အီးမေးလ် ရှည်လွန်းပါသည်")
  .refine((value) => value === "" || z.email().safeParse(value).success, "အီးမေးလ် မမှန်ပါ")
  .transform((value) => value || null);

export const tellerProfileSchema = z.object({
  name: z.string().trim().min(2, "အမည်ကို ရေးပါ").max(80, "အမည် ရှည်လွန်းပါသည်"),
  initials: z.string().trim().min(1, "အတိုကောက် ၁–၃ လုံး ရေးပါ").max(3, "အတိုကောက် ၁–၃ လုံး ရေးပါ"),
  specialty: z.string().trim().min(1, "အထူးပြုကို ရေးပါ").max(80, "အထူးပြု ရှည်လွန်းပါသည်"),
  experience: z.string().trim().min(1, "အတွေ့အကြုံကို ရေးပါ").max(60, "အတွေ့အကြုံ ရှည်လွန်းပါသည်"),
  displayRate: z.string().trim().min(1, "ပြသနှုန်းကို ရေးပါ").max(60, "ပြသနှုန်း ရှည်လွန်းပါသည်"),
  availabilityLabel: z.string().trim().min(1, "ရနိုင်သောရက်များကို ရေးပါ").max(80, "ရနိုင်သောရက် ရှည်လွန်းပါသည်"),
  tags: tagList,
  location: z.string().trim().max(80, "နေရာ ရှည်လွန်းပါသည်"),
  sessionMinutes: z.number().int().min(15, "ကြာချိန် ၁၅–၁၈၀ မိနစ်").max(180, "ကြာချိန် ၁၅–၁၈၀ မိနစ်"),
  bio: z.string().trim().max(600, "မိတ်ဆက် စာလုံး ၆၀၀ မကျော်ရပါ"),
  photoUrl: httpsUrl,
}).strict();

export const tellerEditorSchema = tellerProfileSchema.extend({
  loginEmail: optionalEmail,
  isActive: z.boolean(),
  sortOrder: z.number().int().min(0, "အစီအစဉ် ၀–၉၉၉").max(999, "အစီအစဉ် ၀–၉၉၉"),
}).strict();

export const tellerCreateSchema = tellerEditorSchema.extend({
  id: z.string().trim().regex(/^[a-z0-9][a-z0-9-]{1,39}$/, "ID တွင် စာလုံးသေး a-z၊ ဂဏန်းနှင့် - သာ ပါရပြီး ၂–၄၀ လုံး ဖြစ်ရပါမည်"),
}).strict();

export type TellerProfileInput = z.infer<typeof tellerProfileSchema>;
export type TellerEditorInput = z.infer<typeof tellerEditorSchema>;
export type TellerCreateInput = z.infer<typeof tellerCreateSchema>;
```

`lib/schemas/staff-booking.ts`:

```ts
import { z } from "zod";

export const bookingStatusSchema = z.enum(["requested", "confirmed", "completed", "cancelled"]);

export const bookingStaffPatchSchema = z.object({
  status: bookingStatusSchema.optional(),
  staffNote: z.string().trim().max(500, "မှတ်ချက် စာလုံး ၅၀၀ မကျော်ရပါ").transform((value) => value || null).optional(),
}).strict().refine((value) => value.status !== undefined || value.staffNote !== undefined, { message: "ပြောင်းလဲမှု မရှိပါ" });

export type BookingStaffPatch = z.infer<typeof bookingStaffPatchSchema>;
```

- [ ] **Step 4: Implement the copy and API plumbing**

`lib/content/studio-copy.ts`:

```ts
export const bookingStatusOrder = ["requested", "confirmed", "completed", "cancelled"] as const;
export type StudioBookingStatus = (typeof bookingStatusOrder)[number];

export const bookingStatusLabels: Record<StudioBookingStatus, string> = {
  requested: "တောင်းဆိုထား",
  confirmed: "အတည်ပြုပြီး",
  completed: "ပြီးဆုံး",
  cancelled: "ပယ်ဖျက်ထား",
};

export const studioRoleLabels = { editor: "တည်းဖြတ်သူ", teller: "ပညာရှင်" } as const;

export const studioNav = [
  { href: "/studio", label: "ခြုံငုံ" },
  { href: "/studio/bookings", label: "ရက်ချိန်းများ" },
  { href: "/studio/tellers", label: "ပညာရှင်များ" },
] as const;

export const tellerFieldLabels = {
  id: "ID (URL အတွက်၊ ဥပမာ thiri)",
  name: "အမည်",
  initials: "အတိုကောက် (၁–၃ လုံး)",
  specialty: "အထူးပြု",
  experience: "အတွေ့အကြုံ",
  displayRate: "ပြသနှုန်း",
  availabilityLabel: "ရနိုင်သောရက်များ",
  tags: "အကြောင်းအရာများ (၊ သို့မဟုတ် , ဖြင့် ခွဲပါ)",
  location: "နေရာ",
  sessionMinutes: "ကြာချိန် (မိနစ်)",
  bio: "မိတ်ဆက် (အများမြင်)",
  photoUrl: "ဓာတ်ပုံ လင့်ခ် (https)",
  loginEmail: "ဝင်ရောက်ရန် Gmail",
  isActive: "အများမြင် စာမျက်နှာတွင် ပြသမည်",
  sortOrder: "အစီအစဉ် (နည်းသည်က အရင်)",
} as const;

export const studioMessages = {
  saved: "သိမ်းပြီးပါပြီ။",
  unauthorized: "ဝင်ရောက်ရန် လိုအပ်ပါသည်။",
  forbidden: "ဤလုပ်ဆောင်ချက်ကို ခွင့်မပြုပါ။",
  duplicate: "ဤ ID သို့မဟုတ် Gmail ကို အသုံးပြုပြီး ဖြစ်ပါသည်။",
  not_found: "မတွေ့ပါ။",
  invalid_input: "ဖြည့်ထားသော အချက်အလက်ကို ပြန်စစ်ပါ။",
  service_unavailable: "ဝန်ဆောင်မှု ခေတ္တမရနိုင်ပါ။ ပြန်စမ်းပါ။",
  db_unavailable: "ဒေတာဘေ့စ် ခေတ္တမရနိုင်ပါ။",
  no_access_title: "ဤစာမျက်နှာကို ဝင်ရောက်ခွင့် မရှိပါ",
  no_access_body: "Studio ကို တည်းဖြတ်သူနှင့် စာရင်းသွင်းထားသော Tarot ပညာရှင်များသာ အသုံးပြုနိုင်ပါသည်။ အခြားအကောင့်ဖြင့် ဝင်ရောက်ရန် အောက်တွင် နှိပ်ပါ။",
  empty_bookings: "ရက်ချိန်း မရှိသေးပါ။",
} as const;

export function studioErrorMessage(code: string | undefined): string {
  if (code && code in studioMessages) return studioMessages[code as keyof typeof studioMessages];
  if (code && /[က-႟]/.test(code)) return code;
  return studioMessages.invalid_input;
}
```

`lib/studio/api.ts`:

```ts
import { isSameOriginRequest } from "@/lib/auth/csrf";
import { getCurrentUser } from "@/lib/auth/current-user";
import { staffForUser, type Staff } from "@/lib/auth/staff";

export const noStore = { "cache-control": "private, no-store" };

export function jsonError(error: string, status: number) {
  return Response.json({ error }, { status, headers: noStore });
}

/** Authenticate (401), authorise (403), and same-origin check (403) a Studio mutation. */
export async function authorizeStudioRequest(request: Request): Promise<{ staff: Staff } | { response: Response }> {
  const user = await getCurrentUser();
  if (!user) return { response: jsonError("unauthorized", 401) };
  const staff = await staffForUser(user);
  if (!staff) return { response: jsonError("forbidden", 403) };
  if (!isSameOriginRequest(request.headers, request.url)) return { response: jsonError("forbidden", 403) };
  return { staff };
}

export function firstIssueMessage(error: { issues: Array<{ message: string }> }) {
  const message = error.issues[0]?.message ?? "";
  return /[က-႟]/.test(message) ? message : "invalid_input";
}

export function isUniqueViolation(error: unknown) {
  return error instanceof Error && /UNIQUE constraint failed/i.test(error.message);
}
```

- [ ] **Step 5: Run the tests to verify they pass**

Run: `npx vitest run tests/teller-schema.test.ts tests/staff-booking-schema.test.ts tests/studio-copy.test.ts`
Expected: PASS (7 tests).

- [ ] **Step 6: Commit**

```bash
git add lib/schemas/teller.ts lib/schemas/staff-booking.ts lib/content/studio-copy.ts lib/studio/api.ts tests/teller-schema.test.ts tests/staff-booking-schema.test.ts tests/studio-copy.test.ts
git commit -m "feat(studio): teller and booking schemas, copy, and api plumbing

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_015qi697RAwcuBTPXMQAwuii"
```

---

### Task 4: Public-side additions

**Files:**
- Modify: `lib/content/demo.ts:7-18,40-67`, `components/suriya/tarot-specialist-card.tsx:7-10`, `app/tarot/[id]/page.tsx:26-34`, `app/profile/page.tsx`, `app/robots.ts`
- Test: `tests/rendered-html.test.mjs` (robots assertions)

**Interfaces:**
- Consumes: `getStaff` (Task 2).
- Produces: `TarotSpecialist` gains `bio: string; photoUrl: string | null`.

- [ ] **Step 1: Extend the public specialist type**

In `lib/content/demo.ts`, add to `TarotSpecialist` after `sessionMinutes: number;`:

```ts
  bio: string;
  photoUrl: string | null;
```

Add `bio: "", photoUrl: null,` to both `demoSpecialists` entries (after `sessionMinutes: 30`). Extend `SpecialistRowLike` with `bio: string; photoUrl: string | null;` and map them in `specialistFromRow`:

```ts
    rate: row.displayRate, availability: row.availabilityLabel, tags: row.tags, location: row.location, sessionMinutes: row.sessionMinutes,
    bio: row.bio, photoUrl: row.photoUrl,
```

- [ ] **Step 2: Render the photo and bio on public pages**

`components/suriya/tarot-specialist-card.tsx` — replace the monogram line:

```tsx
        {specialist.photoUrl
          ? <img className="specialist-photo" src={specialist.photoUrl} alt="" loading="lazy" referrerPolicy="no-referrer" />
          : <span className="specialist-monogram" aria-hidden="true">{specialist.initials}</span>}
```

`app/tarot/[id]/page.tsx` — replace the hero monogram the same way with class `consultant-profile-photo`, and replace the about paragraph:

```tsx
            <p>{specialist.bio || `${specialist.experience} ရှိပြီး ${specialist.tags.join("၊ ")} ကိစ္စများကို အဓိကထား ဆွေးနွေးပေးသည်။`}</p>
```

If `npm run lint` reports `@next/next/no-img-element`, prefix each `<img` line with
`{/* eslint-disable-next-line @next/next/no-img-element -- remote photo URL; the image optimizer only serves local assets */}`.

Add to `app/globals.css` (next to `.specialist-monogram`):

```css
.specialist-photo { width: 92px; height: 92px; border: 1px solid rgb(232 200 122 / 34%); border-radius: 50%; object-fit: cover; }
.consultant-profile-photo { width: 72px; height: 72px; border: 1px solid rgb(232 200 122 / 30%); border-radius: 50%; object-fit: cover; }
```

- [ ] **Step 3: Studio entry on the profile page and crawl rules**

`app/profile/page.tsx` — add `import { getStaff } from "@/lib/auth/staff";`, then after `const user = await getCurrentUser();`:

```ts
  const staff = user ? await getStaff().catch(() => null) : null;
```

and change the account row to:

```tsx
          <div className="profile-account-row"><span>အကောင့်ပိုင်ရှင် — {user.displayName} · {user.email}</span><span className="profile-account-actions">{staff && <a className="secondary-button" href="/studio">Studio သို့ သွားရန်</a>}<a className="ghost-button" href={signOutPath("/")}><LogOut size={16} aria-hidden="true" /> ထွက်မည်</a></span></div>
```

with CSS `.profile-account-actions { display: flex; flex-wrap: wrap; gap: 8px; }`.

`app/robots.ts` — disallow list becomes
`["/readings", "/profile", "/onboarding", "/login", "/tarot/bookings/", "/api/", "/studio", "/auth/"]`.

- [ ] **Step 4: Assert the crawl rules in the rendered suite**

In `tests/rendered-html.test.mjs`, after `assert.match(robotsText, /Disallow: \/readings/);` add:

```js
  assert.match(robotsText, /Disallow: \/studio/);
  assert.match(robotsText, /Disallow: \/auth\//);
```

- [ ] **Step 5: Lint, type-check, unit tests**

Run: `npm run lint && npx tsc --noEmit 2>&1 | grep -v "cloudflare:workers\|D1Database\|Fetcher\|tests/openrouter.test.ts"; npx vitest run tests/consultant-filter.test.ts tests/seo.test.ts tests/content.test.ts`
Expected: clean.

- [ ] **Step 6: Commit**

```bash
git add lib/content/demo.ts components/suriya/tarot-specialist-card.tsx "app/tarot/[id]/page.tsx" app/profile/page.tsx app/robots.ts app/globals.css tests/rendered-html.test.mjs
git commit -m "feat(tarot): reader photos and bios, studio entry, crawl rules

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_015qi697RAwcuBTPXMQAwuii"
```

---

### Task 5: Studio shell, overview, reader management

**Files:**
- Create: `components/studio/studio-shell.tsx`, `components/studio/studio-no-access.tsx`, `components/studio/stat-tiles.tsx`, `components/studio/booking-table.tsx`, `components/studio/teller-form.tsx`, `app/studio/page.tsx`, `app/studio/tellers/page.tsx`, `app/studio/tellers/new/page.tsx`, `app/studio/tellers/[id]/page.tsx`, `app/api/studio/tellers/route.ts`, `app/api/studio/tellers/[id]/route.ts`
- Modify: `app/globals.css` (append the Studio block)

**Interfaces:**
- Consumes: Tasks 1–3.
- Produces: `StudioShell({ staff, current, children })`, `StudioNoAccess({ email })`, `StatTiles({ tiles })`, `BookingTable({ bookings, tellerNames, showTeller })`, `TellerForm({ mode, initial })`, `TellerFormValues`, `emptyTeller`, `tellerFormValues(row)`.

- [ ] **Step 1: Shell, no-access, tiles, table**

`components/studio/studio-shell.tsx`:

```tsx
import { Brand } from "@/components/suriya/brand";
import { StarField } from "@/components/suriya/star-field";
import { signOutPath } from "@/lib/auth/paths";
import type { Staff } from "@/lib/auth/staff";
import { studioNav, studioRoleLabels } from "@/lib/content/studio-copy";

export function StudioShell({ staff, current, children }: { staff: Staff; current: string; children: React.ReactNode }) {
  const links = studioNav.map((item) =>
    staff.role === "teller" && item.href === "/studio/tellers"
      ? { href: `/studio/tellers/${staff.specialistId}`, label: "ကျွန်ုပ်၏ Profile" }
      : item,
  );
  return (
    <div className="studio-shell">
      <StarField />
      <header className="studio-bar">
        <Brand />
        <span className="studio-word">Studio</span>
        <span className="role-badge">{studioRoleLabels[staff.role]}</span>
        <nav className="studio-nav" aria-label="Studio လမ်းညွှန်">
          {links.map((item) => <a key={item.href} href={item.href} aria-current={current === item.href ? "page" : undefined}>{item.label}</a>)}
          <a href={signOutPath("/")}>ထွက်မည်</a>
        </nav>
      </header>
      <main className="studio-main" id="main-content">{children}</main>
    </div>
  );
}
```

`components/studio/studio-no-access.tsx`:

```tsx
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
```

`components/studio/stat-tiles.tsx`:

```tsx
import { toBurmeseDigits } from "@/lib/content/burmese-digits";

export function StatTiles({ tiles }: { tiles: Array<{ label: string; value: number }> }) {
  return (
    <ul className="stat-tiles" aria-label="အနှစ်ချုပ်">
      {tiles.map((tile) => <li className="stat-tile" key={tile.label}><strong>{toBurmeseDigits(tile.value)}</strong><span>{tile.label}</span></li>)}
    </ul>
  );
}
```

`components/studio/booking-table.tsx`:

```tsx
import type { TarotBookingRow } from "@/db/schema";
import { bookingLabels, formatBookingDate } from "@/lib/content/booking-copy";
import { bookingStatusLabels, studioMessages } from "@/lib/content/studio-copy";

export function BookingTable({ bookings, tellerNames, showTeller }: { bookings: TarotBookingRow[]; tellerNames: Record<string, string>; showTeller: boolean }) {
  if (bookings.length === 0) return <p className="empty-state">{studioMessages.empty_bookings}</p>;
  return (
    <div className="table-scroll">
      <table className="data-table">
        <thead>
          <tr><th scope="col">ရက်</th><th scope="col">အချိန်ပိုင်း</th><th scope="col">ဖောက်သည်</th>{showTeller && <th scope="col">ပညာရှင်</th>}<th scope="col">အကြောင်းအရာ</th><th scope="col">အခြေအနေ</th></tr>
        </thead>
        <tbody>
          {bookings.map((booking) => (
            <tr key={booking.id}>
              <td><a href={`/studio/bookings/${booking.id}`}>{formatBookingDate(booking.preferredDate)}</a></td>
              <td>{bookingLabels.preferredTime[booking.preferredTime]}</td>
              <td>{booking.name}</td>
              {showTeller && <td>{tellerNames[booking.specialistId] ?? booking.specialistId}</td>}
              <td>{bookingLabels.topic[booking.topic]}</td>
              <td><span className="status-badge" data-status={booking.status}>{bookingStatusLabels[booking.status]}</span></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
```

- [ ] **Step 2: The reader form (client)**

`components/studio/teller-form.tsx`:

```tsx
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
```

- [ ] **Step 3: Pages**

`app/studio/page.tsx`:

```tsx
import type { Metadata } from "next";
import { BookingTable } from "@/components/studio/booking-table";
import { StatTiles } from "@/components/studio/stat-tiles";
import { StudioNoAccess } from "@/components/studio/studio-no-access";
import { StudioShell } from "@/components/studio/studio-shell";
import { countBookingsByStatus, listBookingsForStaff } from "@/db/repositories/bookings";
import { listSpecialists } from "@/db/repositories/specialists";
import { localDateInTimezone } from "@/lib/astrology/time";
import { bookingScope, requireStaff } from "@/lib/auth/staff";
import { bookingStatusLabels, studioMessages } from "@/lib/content/studio-copy";
import { BOOKING_TIMEZONE } from "@/lib/schemas/booking";

export const metadata: Metadata = { title: "Studio", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default async function StudioPage() {
  const staff = await requireStaff("/studio");
  if (staff.role === "none") return <StudioNoAccess email={staff.user.email} />;
  const scope = bookingScope(staff);
  const today = localDateInTimezone(new Date(), BOOKING_TIMEZONE);
  const [counts, upcoming, tellers] = await Promise.all([
    countBookingsByStatus(scope).catch(() => null),
    listBookingsForStaff(scope, { statuses: ["requested", "confirmed"], fromDate: today, limit: 10 }).catch(() => null),
    listSpecialists({ includeInactive: true }).catch(() => []),
  ]);
  const tellerNames = Object.fromEntries(tellers.map((teller) => [teller.id, teller.name]));
  return (
    <StudioShell staff={staff} current="/studio">
      <header className="page-heading">
        <p className="eyebrow">Studio · {staff.role === "editor" ? "တည်းဖြတ်သူ" : tellerNames[staff.specialistId] ?? "ပညာရှင်"}</p>
        <h1 className="page-title">ခြုံငုံကြည့်ရှုမှု</h1>
        <p className="page-lede">{staff.user.email}</p>
      </header>
      {counts
        ? <StatTiles tiles={[{ label: bookingStatusLabels.requested, value: counts.requested }, { label: bookingStatusLabels.confirmed, value: counts.confirmed }, { label: bookingStatusLabels.completed, value: counts.completed }]} />
        : <p className="form-error" role="status">{studioMessages.db_unavailable}</p>}
      <section aria-labelledby="upcoming-title">
        <div className="section-title"><h2 id="upcoming-title">လာမည့် ရက်ချိန်းများ</h2><a className="text-link" href="/studio/bookings">အားလုံး ကြည့်ရန်</a></div>
        {upcoming ? <BookingTable bookings={upcoming} tellerNames={tellerNames} showTeller={staff.role === "editor"} /> : <p className="empty-state">{studioMessages.db_unavailable}</p>}
      </section>
      {staff.role === "editor" ? (
        <section aria-labelledby="tellers-title">
          <div className="section-title"><h2 id="tellers-title">ပညာရှင်များ</h2><a className="text-link" href="/studio/tellers/new">ပညာရှင် အသစ် ထည့်ရန်</a></div>
          <ul className="studio-list">
            {tellers.map((teller) => (
              <li key={teller.id}><a href={`/studio/tellers/${teller.id}`}>{teller.name}</a><span className="status-badge" data-status={teller.isActive ? "confirmed" : "cancelled"}>{teller.isActive ? "ပြသနေ" : "ရပ်ထား"}</span></li>
            ))}
          </ul>
        </section>
      ) : (
        <a className="secondary-button" href={`/studio/tellers/${staff.specialistId}`}>ကျွန်ုပ်၏ Profile ပြင်ဆင်ရန်</a>
      )}
    </StudioShell>
  );
}
```

`app/studio/tellers/page.tsx`:

```tsx
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { StudioNoAccess } from "@/components/studio/studio-no-access";
import { StudioShell } from "@/components/studio/studio-shell";
import { listSpecialists } from "@/db/repositories/specialists";
import { requireStaff } from "@/lib/auth/staff";
import { studioMessages } from "@/lib/content/studio-copy";

export const metadata: Metadata = { title: "Studio · ပညာရှင်များ", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default async function StudioTellersPage() {
  const staff = await requireStaff("/studio/tellers");
  if (staff.role === "none") return <StudioNoAccess email={staff.user.email} />;
  if (staff.role === "teller") redirect(`/studio/tellers/${staff.specialistId}`);
  const tellers = await listSpecialists({ includeInactive: true }).catch(() => null);
  return (
    <StudioShell staff={staff} current="/studio/tellers">
      <header className="page-heading"><p className="eyebrow">Studio · ပညာရှင်များ</p><h1 className="page-title">Tarot ပညာရှင်များ</h1></header>
      <div className="studio-actions"><a className="primary-button" href="/studio/tellers/new">ပညာရှင် အသစ် ထည့်ရန်</a></div>
      {tellers ? (
        <div className="table-scroll">
          <table className="data-table">
            <thead><tr><th scope="col">အမည်</th><th scope="col">ID</th><th scope="col">ပြသမှု</th><th scope="col">ဝင်ရောက်ရန် Gmail</th><th scope="col">အစီအစဉ်</th></tr></thead>
            <tbody>
              {tellers.map((teller) => (
                <tr key={teller.id}>
                  <td><a href={`/studio/tellers/${teller.id}`}>{teller.name}</a></td>
                  <td>{teller.id}</td>
                  <td><span className="status-badge" data-status={teller.isActive ? "confirmed" : "cancelled"}>{teller.isActive ? "ပြသနေ" : "ရပ်ထား"}</span></td>
                  <td>{teller.loginEmail ?? "—"}</td>
                  <td>{teller.sortOrder}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : <p className="empty-state">{studioMessages.db_unavailable}</p>}
    </StudioShell>
  );
}
```

`app/studio/tellers/new/page.tsx`:

```tsx
import type { Metadata } from "next";
import { StudioNoAccess } from "@/components/studio/studio-no-access";
import { StudioShell } from "@/components/studio/studio-shell";
import { emptyTeller, TellerForm } from "@/components/studio/teller-form";
import { requireStaff } from "@/lib/auth/staff";

export const metadata: Metadata = { title: "Studio · ပညာရှင် အသစ်", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default async function NewTellerPage() {
  const staff = await requireStaff("/studio/tellers/new");
  if (staff.role !== "editor") return <StudioNoAccess email={staff.user.email} />;
  return (
    <StudioShell staff={staff} current="/studio/tellers">
      <header className="page-heading"><p className="eyebrow">Studio · ပညာရှင်များ</p><h1 className="page-title">ပညာရှင် အသစ် ထည့်ရန်</h1><p className="page-lede">ID သည် အများမြင် URL (/tarot/ID) ဖြစ်ပြီး နောက်မှ ပြောင်း၍ မရပါ။</p></header>
      <section className="surface form-card"><TellerForm mode="create" initial={emptyTeller} /></section>
    </StudioShell>
  );
}
```

`app/studio/tellers/[id]/page.tsx`:

```tsx
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { StudioNoAccess } from "@/components/studio/studio-no-access";
import { StudioShell } from "@/components/studio/studio-shell";
import { TellerForm, tellerFormValues } from "@/components/studio/teller-form";
import { getSpecialist } from "@/db/repositories/specialists";
import { requireStaff } from "@/lib/auth/staff";

export const metadata: Metadata = { title: "Studio · ပညာရှင် ပြင်ဆင်ရန်", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default async function EditTellerPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const staff = await requireStaff(`/studio/tellers/${id}`);
  if (staff.role === "none" || (staff.role === "teller" && staff.specialistId !== id)) return <StudioNoAccess email={staff.user.email} />;
  const row = await getSpecialist(id, { includeInactive: true }).catch(() => null);
  if (!row) notFound();
  return (
    <StudioShell staff={staff} current="/studio/tellers">
      <header className="page-heading">
        <p className="eyebrow">Studio · {staff.role === "editor" ? "ပညာရှင်များ" : "ကျွန်ုပ်၏ Profile"}</p>
        <h1 className="page-title">{row.name}</h1>
        <p className="page-lede">အများမြင် စာမျက်နှာ — <a className="text-link" href={`/tarot/${row.id}`}>/tarot/{row.id}</a>{row.isActive ? "" : " (လောလောဆယ် ရပ်ထားသည်)"}</p>
      </header>
      <section className="surface form-card"><TellerForm mode={staff.role === "editor" ? "editor" : "self"} initial={tellerFormValues(row)} /></section>
    </StudioShell>
  );
}
```

- [ ] **Step 4: Reader APIs**

`app/api/studio/tellers/route.ts`:

```ts
import { createSpecialist, getSpecialist } from "@/db/repositories/specialists";
import { tellerCreateSchema } from "@/lib/schemas/teller";
import { authorizeStudioRequest, firstIssueMessage, isUniqueViolation, jsonError, noStore } from "@/lib/studio/api";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const auth = await authorizeStudioRequest(request);
  if ("response" in auth) return auth.response;
  if (auth.staff.role !== "editor") return jsonError("forbidden", 403);
  const parsed = tellerCreateSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return jsonError(firstIssueMessage(parsed.error), 400);
  try {
    if (await getSpecialist(parsed.data.id, { includeInactive: true })) return jsonError("duplicate", 409);
    const specialist = await createSpecialist(parsed.data);
    return Response.json({ specialist }, { status: 201, headers: noStore });
  } catch (error) {
    return isUniqueViolation(error) ? jsonError("duplicate", 409) : jsonError("service_unavailable", 503);
  }
}
```

`app/api/studio/tellers/[id]/route.ts`:

```ts
import { updateSpecialist } from "@/db/repositories/specialists";
import { tellerEditorSchema, tellerProfileSchema } from "@/lib/schemas/teller";
import { authorizeStudioRequest, firstIssueMessage, isUniqueViolation, jsonError, noStore } from "@/lib/studio/api";

export const dynamic = "force-dynamic";

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await authorizeStudioRequest(request);
  if ("response" in auth) return auth.response;
  const { id } = await params;
  const { staff } = auth;
  if (staff.role === "teller" && staff.specialistId !== id) return jsonError("forbidden", 403);
  const body = await request.json().catch(() => null);
  const parsed = staff.role === "editor" ? tellerEditorSchema.safeParse(body) : tellerProfileSchema.safeParse(body);
  if (!parsed.success) return jsonError(firstIssueMessage(parsed.error), 400);
  try {
    const specialist = await updateSpecialist(id, parsed.data);
    if (!specialist) return jsonError("not_found", 404);
    return Response.json({ specialist }, { headers: noStore });
  } catch (error) {
    return isUniqueViolation(error) ? jsonError("duplicate", 409) : jsonError("service_unavailable", 503);
  }
}
```

- [ ] **Step 5: Studio CSS**

Append to `app/globals.css`:

```css
/* Studio */
.studio-shell { position: relative; min-height: 100dvh; }
.studio-bar { position: sticky; top: 0; z-index: 5; display: flex; flex-wrap: wrap; align-items: center; gap: 10px 16px; border-bottom: 1px solid var(--hairline); background: rgb(11 15 30 / 84%); padding: 12px clamp(16px, 4vw, 32px); backdrop-filter: blur(12px); }
.studio-word { color: var(--gold); font-family: var(--font-latin); font-size: .72rem; font-weight: 600; letter-spacing: .18em; text-transform: uppercase; }
.role-badge { border: 1px solid var(--gold-deep); border-radius: 999px; padding: 3px 10px; color: var(--gold); font-size: .75rem; }
.studio-nav { display: flex; flex-wrap: wrap; gap: 4px; margin-inline-start: auto; }
.studio-nav a { border-radius: 999px; padding: 8px 12px; color: var(--muted); font-size: .8rem; text-decoration: none; }
.studio-nav a[aria-current="page"] { background: var(--raised); color: var(--text); }
.studio-main { display: grid; width: min(100%, 1100px); gap: 26px; margin-inline: auto; padding: clamp(18px, 4vw, 32px) clamp(16px, 4vw, 32px) 80px; }
.stat-tiles { display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 12px; margin: 0; padding: 0; list-style: none; }
.stat-tile { display: grid; gap: 4px; border: 1px solid var(--hairline); border-radius: var(--radius-md); background: var(--surface); padding: 16px; }
.stat-tile strong { color: var(--gold); font-family: var(--font-latin); font-size: 1.6rem; }
.stat-tile span { color: var(--muted); font-size: .75rem; }
.data-table { width: 100%; border-collapse: collapse; font-size: .8rem; }
.data-table th, .data-table td { border-bottom: 1px solid var(--hairline); padding: 10px 12px; text-align: left; vertical-align: top; white-space: nowrap; }
.data-table th { color: var(--muted); font-size: .75rem; font-weight: 600; }
.data-table a { color: var(--gold); }
.status-badge { display: inline-block; border: 1px solid var(--hairline); border-radius: 999px; padding: 3px 9px; color: var(--muted); font-size: .75rem; }
.status-badge[data-status="requested"] { border-color: var(--gold-deep); color: var(--gold); }
.status-badge[data-status="confirmed"] { border-color: var(--sage); color: var(--sage); }
.status-badge[data-status="completed"] { color: var(--text); }
.status-badge[data-status="cancelled"] { border-color: var(--lacquer); color: var(--lacquer); }
.studio-filters { display: flex; flex-wrap: wrap; align-items: end; gap: 10px; }
.studio-filters .field-group { min-width: 170px; }
.studio-actions { display: flex; flex-wrap: wrap; gap: 10px; }
.studio-list { display: grid; gap: 8px; margin: 0; padding: 0; list-style: none; }
.studio-list li { display: flex; align-items: center; justify-content: space-between; gap: 12px; border: 1px solid var(--hairline); border-radius: var(--radius-sm); background: var(--surface); padding: 12px 14px; }
.studio-list a { color: var(--text); font-weight: 600; text-decoration: none; }
.studio-detail dl { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 12px 20px; margin: 0; }
.studio-detail dt { color: var(--muted); font-size: .75rem; }
.studio-detail dd { margin: 0; font-weight: 600; }
.studio-detail dd a { color: var(--gold); }
.studio-note { color: var(--muted); font-size: .8rem; }
.studio-no-access h1 { margin: 0; font-size: 1.3rem; }
.checkbox-row { display: flex; align-items: center; gap: 10px; align-self: end; font-size: .8rem; }
.checkbox-row input { width: 20px; height: 20px; accent-color: var(--gold); }
```

Verify the tokens exist before relying on them: `grep -n "\-\-sage\|\-\-lacquer\|\-\-raised\|\-\-hairline\|\-\-radius-sm\|\-\-font-latin" app/globals.css | head`. If `--sage` is missing, add `--sage: #9fc19a;` to `:root`.

- [ ] **Step 6: Lint, type-check, build**

Run: `npm run lint && npx tsc --noEmit 2>&1 | grep -v "cloudflare:workers\|D1Database\|Fetcher\|tests/openrouter.test.ts"; npm run build 2>&1 | tail -3`
Expected: clean lint, no new type errors, build complete.

- [ ] **Step 7: Commit**

```bash
git add components/studio app/studio app/api/studio app/globals.css
git commit -m "feat(studio): shell, overview, and reader management

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_015qi697RAwcuBTPXMQAwuii"
```

---

### Task 6: Bookings list, detail, and status updates

**Files:**
- Create: `components/studio/booking-status-form.tsx`, `app/studio/bookings/page.tsx`, `app/studio/bookings/[id]/page.tsx`, `app/api/studio/bookings/[id]/route.ts`

**Interfaces:**
- Consumes: Tasks 1–5.
- Produces: `BookingStatusForm({ bookingId, status, staffNote })`.

- [ ] **Step 1: Status form (client)**

`components/studio/booking-status-form.tsx`:

```tsx
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
```

- [ ] **Step 2: Pages**

`app/studio/bookings/page.tsx`:

```tsx
import type { Metadata } from "next";
import { BookingTable } from "@/components/studio/booking-table";
import { StudioNoAccess } from "@/components/studio/studio-no-access";
import { StudioShell } from "@/components/studio/studio-shell";
import { listBookingsForStaff } from "@/db/repositories/bookings";
import { listSpecialists } from "@/db/repositories/specialists";
import { bookingScope, requireStaff } from "@/lib/auth/staff";
import { bookingStatusLabels, bookingStatusOrder, studioMessages } from "@/lib/content/studio-copy";
import { bookingStatusSchema } from "@/lib/schemas/staff-booking";

export const metadata: Metadata = { title: "Studio · ရက်ချိန်းများ", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default async function StudioBookingsPage({ searchParams }: { searchParams: Promise<{ status?: string; teller?: string }> }) {
  const staff = await requireStaff("/studio/bookings");
  if (staff.role === "none") return <StudioNoAccess email={staff.user.email} />;
  const params = await searchParams;
  const statusFilter = bookingStatusSchema.safeParse(params.status);
  const status = statusFilter.success ? statusFilter.data : undefined;
  const teller = staff.role === "editor" && params.teller ? params.teller : undefined;
  const [bookings, tellers] = await Promise.all([
    listBookingsForStaff(bookingScope(staff), { statuses: status ? [status] : undefined, specialistId: teller }).catch(() => null),
    listSpecialists({ includeInactive: true }).catch(() => []),
  ]);
  const tellerNames = Object.fromEntries(tellers.map((item) => [item.id, item.name]));
  return (
    <StudioShell staff={staff} current="/studio/bookings">
      <header className="page-heading"><p className="eyebrow">Studio · ရက်ချိန်းများ</p><h1 className="page-title">ရက်ချိန်း တောင်းဆိုမှုများ</h1></header>
      <form className="studio-filters" method="get" action="/studio/bookings">
        <div className="field-group">
          <label className="field-label" htmlFor="filter-status">အခြေအနေ</label>
          <select className="select-field" id="filter-status" name="status" defaultValue={status ?? ""}>
            <option value="">အားလုံး</option>
            {bookingStatusOrder.map((item) => <option key={item} value={item}>{bookingStatusLabels[item]}</option>)}
          </select>
        </div>
        {staff.role === "editor" && (
          <div className="field-group">
            <label className="field-label" htmlFor="filter-teller">ပညာရှင်</label>
            <select className="select-field" id="filter-teller" name="teller" defaultValue={teller ?? ""}>
              <option value="">အားလုံး</option>
              {tellers.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
            </select>
          </div>
        )}
        <button className="secondary-button" type="submit">စစ်ထုတ်မည်</button>
      </form>
      {bookings ? <BookingTable bookings={bookings} tellerNames={tellerNames} showTeller={staff.role === "editor"} /> : <p className="empty-state">{studioMessages.db_unavailable}</p>}
    </StudioShell>
  );
}
```

`app/studio/bookings/[id]/page.tsx`:

```tsx
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { BookingStatusForm } from "@/components/studio/booking-status-form";
import { StudioNoAccess } from "@/components/studio/studio-no-access";
import { StudioShell } from "@/components/studio/studio-shell";
import { getBookingForStaff } from "@/db/repositories/bookings";
import { getSpecialist } from "@/db/repositories/specialists";
import { bookingScope, requireStaff } from "@/lib/auth/staff";
import { bookingLabels, formatBookingDate } from "@/lib/content/booking-copy";
import { findDemoSpecialist } from "@/lib/content/demo";
import { parseStoredTimestamp } from "@/lib/readings/quota";
import { BOOKING_TIMEZONE } from "@/lib/schemas/booking";

export const metadata: Metadata = { title: "Studio · ရက်ချိန်း", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default async function StudioBookingPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const staff = await requireStaff(`/studio/bookings/${id}`);
  if (staff.role === "none") return <StudioNoAccess email={staff.user.email} />;
  const booking = await getBookingForStaff(id, bookingScope(staff)).catch(() => null);
  if (!booking) notFound();
  const tellerRow = await getSpecialist(booking.specialistId, { includeInactive: true }).catch(() => null);
  const tellerName = tellerRow?.name ?? findDemoSpecialist(booking.specialistId)?.name ?? booking.specialistId;
  const requestedAt = new Intl.DateTimeFormat("my-MM", { dateStyle: "medium", timeStyle: "short", timeZone: BOOKING_TIMEZONE }).format(parseStoredTimestamp(booking.createdAt));
  return (
    <StudioShell staff={staff} current="/studio/bookings">
      <a className="text-link" href="/studio/bookings">← ရက်ချိန်းများသို့</a>
      <header className="page-heading"><p className="eyebrow">ရက်ချိန်း · {tellerName}</p><h1 className="page-title">{booking.name}</h1><p className="page-lede">{formatBookingDate(booking.preferredDate)} · {bookingLabels.preferredTime[booking.preferredTime]}</p></header>
      <section className="surface studio-detail" aria-label="ဖောက်သည် အချက်အလက်">
        <dl>
          <div><dt>ဖုန်း</dt><dd><a href={`tel:${booking.phone.replace(/\s+/g, "")}`}>{booking.phone}</a></dd></div>
          <div><dt>ဆက်သွယ်လိုသည့် နည်းလမ်း</dt><dd>{bookingLabels.contactChannel[booking.contactChannel]}</dd></div>
          <div><dt>ပညာရှင်</dt><dd>{tellerName}</dd></div>
          <div><dt>အကြောင်းအရာ</dt><dd>{bookingLabels.topic[booking.topic]}</dd></div>
          <div><dt>တောင်းဆိုချိန်</dt><dd>{requestedAt}</dd></div>
          <div><dt>ID</dt><dd>{booking.id}</dd></div>
        </dl>
        {booking.note && <p className="studio-note"><strong>ဖောက်သည် မှတ်ချက် —</strong> {booking.note}</p>}
      </section>
      <BookingStatusForm bookingId={booking.id} status={booking.status} staffNote={booking.staffNote} />
    </StudioShell>
  );
}
```

Confirm `parseStoredTimestamp` is exported from `lib/readings/quota.ts` (`grep -n "export function parseStoredTimestamp" lib/readings/quota.ts`); if it is not, use `new Date(booking.createdAt.replace(" ", "T") + (booking.createdAt.endsWith("Z") ? "" : "Z"))`.

- [ ] **Step 3: Booking API**

`app/api/studio/bookings/[id]/route.ts`:

```ts
import { updateBookingForStaff } from "@/db/repositories/bookings";
import { bookingScope } from "@/lib/auth/staff";
import { bookingStaffPatchSchema } from "@/lib/schemas/staff-booking";
import { authorizeStudioRequest, firstIssueMessage, jsonError, noStore } from "@/lib/studio/api";

export const dynamic = "force-dynamic";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await authorizeStudioRequest(request);
  if ("response" in auth) return auth.response;
  const { id } = await params;
  const parsed = bookingStaffPatchSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return jsonError(firstIssueMessage(parsed.error), 400);
  try {
    const booking = await updateBookingForStaff(id, bookingScope(auth.staff), parsed.data);
    if (!booking) return jsonError("not_found", 404);
    return Response.json({ booking }, { headers: noStore });
  } catch {
    return jsonError("service_unavailable", 503);
  }
}
```

- [ ] **Step 4: Lint, type-check, build**

Run: `npm run lint && npx tsc --noEmit 2>&1 | grep -v "cloudflare:workers\|D1Database\|Fetcher\|tests/openrouter.test.ts"; npm run build 2>&1 | tail -3`
Expected: clean.

- [ ] **Step 5: Commit**

```bash
git add components/studio app/studio app/api/studio
git commit -m "feat(studio): booking list, detail, status and staff notes

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_015qi697RAwcuBTPXMQAwuii"
```

---

### Task 7: Rendered coverage, local verification, gates, merge

**Files:**
- Modify: `tests/rendered-html.test.mjs` (extend `render` with an init argument; add the gating test)
- Scratchpad: `audit.py` (cookie support), `d1.sh`, `mint-cookie.mjs`, `publish-checkpoint-4.md`

- [ ] **Step 1: Rendered gating test**

Change the helper signature to `async function render(pathname = "/", init = {})` and build the request as
`new Request(\`http://localhost${pathname}\`, { ...init, headers: { accept: "text/html", ...(init.headers ?? {}) } })`.

Append:

```js
test("studio pages and apis are gated for guests", async () => {
  for (const path of ["/studio", "/studio/bookings", "/studio/tellers", "/studio/tellers/new", "/studio/tellers/thiri", "/studio/bookings/bkg_x"]) {
    const response = await render(path);
    assert.ok([302, 307, 308].includes(response.status), `${path} ${response.status}`);
    assert.ok((response.headers.get("location") ?? "").endsWith(`/login?return_to=${encodeURIComponent(path)}`), `${path} ${response.headers.get("location")}`);
  }
  const json = { "content-type": "application/json", "sec-fetch-site": "same-origin" };
  assert.equal((await render("/api/studio/bookings/bkg_x", { method: "PATCH", headers: json, body: JSON.stringify({ status: "confirmed" }) })).status, 401);
  assert.equal((await render("/api/studio/tellers/thiri", { method: "PUT", headers: json, body: "{}" })).status, 401);
  assert.equal((await render("/api/studio/tellers", { method: "POST", headers: json, body: "{}" })).status, 401);
  const tarot = await (await render("/tarot")).text();
  assert.match(tarot, /specialist-monogram/);
  assert.doesNotMatch(tarot, /specialist-photo/);
});
```

- [ ] **Step 2: Build and run the rendered suite**

Run: `npm run build && node --test tests/rendered-html.test.mjs`
Expected: all pass (10 tests).

- [ ] **Step 3: Migrate the dev database and seed a teller login**

The dev server's D1 lives under `.wrangler/state/v3`; `scratchpad/d1.sh` wraps `wrangler d1 execute … --persist-to .wrangler/state` (wrangler appends `/v3`).

```bash
SP=/private/tmp/claude-501/-Users-htooayelwin-orca-something/361e73bd-754d-44f0-a78f-85206d8c7a41/scratchpad
"$SP/d1.sh" --file drizzle/0005_*.sql
"$SP/d1.sh" "PRAGMA table_info(tarot_specialists)" | grep -c '"name"'   # expect 17 columns
```

Restart `npm run dev` (background) so the worker picks up the new schema. `.env.local` already holds `SESSION_SECRET=dev-audit-secret-0123456789abcdef` and `SITE_ADMIN_EMAILS=editor@example.com`.

Mint cookies and set thiri's login email through the editor API (this also exercises `PUT`):

```bash
EDITOR=$(node "$SP/mint-cookie.mjs" dev-audit-secret-0123456789abcdef usr_editor editor@example.com "တည်းဖြတ်သူ")
curl -s -X PUT http://localhost:3000/api/studio/tellers/tsp_thiri -H "cookie: suriya_session=$EDITOR" -H "content-type: application/json" -H "sec-fetch-site: same-origin" \
  -d '{"name":"သီရိလမင်း","initials":"TL","specialty":"Tarot & Relationship Guidance","experience":"အတွေ့အကြုံ ၆ နှစ်","displayRate":"၃၀ မိနစ် · ၂၅,၀၀၀ ကျပ်","availabilityLabel":"စနေ · တနင်္ဂနွေ","tags":"ချစ်ရေး၊ အလုပ်အကိုင်၊ စိတ်ခံစားမှု","location":"ရန်ကုန် · ကမာရွတ်","sessionMinutes":30,"bio":"နှစ်ပေါင်း ၆ နှစ် Tarot ဖြင့် ဆွေးနွေးပေးနေသော ပညာရှင်။","photoUrl":"","loginEmail":"thiri@example.com","isActive":true,"sortOrder":0}' -w "\nHTTP %{http_code}\n"
TELLER=$(node "$SP/mint-cookie.mjs" dev-audit-secret-0123456789abcdef usr_thiri thiri@example.com "သီရိလမင်း")
# teller may not touch min-thu → 403; teller cannot send editor-only keys → 400; cross-site → 403; guest → 401
curl -s -o /dev/null -w "%{http_code}\n" -X PUT http://localhost:3000/api/studio/tellers/tsp_min_thu -H "cookie: suriya_session=$TELLER" -H "content-type: application/json" -H "sec-fetch-site: same-origin" -d '{}'
curl -s -X PUT http://localhost:3000/api/studio/tellers/tsp_thiri -H "cookie: suriya_session=$TELLER" -H "content-type: application/json" -H "sec-fetch-site: same-origin" -d '{"isActive":false}' -w "\nHTTP %{http_code}\n"
curl -s -o /dev/null -w "%{http_code}\n" -X PATCH http://localhost:3000/api/studio/bookings/x -H "cookie: suriya_session=$EDITOR" -H "content-type: application/json" -H "sec-fetch-site: cross-site" -d '{"status":"confirmed"}'
curl -s -o /dev/null -w "%{http_code}\n" -X PATCH http://localhost:3000/api/studio/bookings/x -H "content-type: application/json" -H "sec-fetch-site: same-origin" -d '{"status":"confirmed"}'
```

Expected: 200 with the updated specialist, then `403`, `400`, `403`, `401`.

Then confirm the teller sees only their booking and can update it (the dev DB already holds one `tsp_thiri` booking from Phase A's probe; create one for `tsp_min_thu` via `POST /api/bookings` first):

```bash
curl -s -X POST http://localhost:3000/api/bookings -H "content-type: application/json" -d '{"specialistId":"tsp_min_thu","name":"ဒုတိယ ဖောက်သည်","phone":"09 555 000 111","contactChannel":"telegram","preferredDate":"2026-09-12","preferredTime":"morning","topic":"direction"}'
THIRI_BOOKING=$("$SP/d1.sh" "SELECT id FROM tarot_bookings WHERE specialist_id='tsp_thiri' LIMIT 1" | grep '"id"' | sed 's/.*: "\(.*\)".*/\1/')
MINTHU_BOOKING=$("$SP/d1.sh" "SELECT id FROM tarot_bookings WHERE specialist_id='tsp_min_thu' LIMIT 1" | grep '"id"' | sed 's/.*: "\(.*\)".*/\1/')
curl -s -o /dev/null -w "%{http_code}\n" -H "cookie: suriya_session=$TELLER" "http://localhost:3000/studio/bookings/$MINTHU_BOOKING"     # 404
curl -s -X PATCH "http://localhost:3000/api/studio/bookings/$MINTHU_BOOKING" -H "cookie: suriya_session=$TELLER" -H "content-type: application/json" -H "sec-fetch-site: same-origin" -d '{"status":"confirmed"}' -w "\nHTTP %{http_code}\n"   # 404
curl -s -X PATCH "http://localhost:3000/api/studio/bookings/$THIRI_BOOKING" -H "cookie: suriya_session=$TELLER" -H "content-type: application/json" -H "sec-fetch-site: same-origin" -d '{"status":"confirmed","staffNote":"ဖုန်းဆက်ပြီး"}' -w "\nHTTP %{http_code}\n"   # 200
curl -s -H "cookie: suriya_session=$TELLER" http://localhost:3000/studio/bookings | grep -c "ဒုတိယ ဖောက်သည်"   # 0 — the other reader's customer never appears
```

- [ ] **Step 4: Playwright audit with cookies**

Add cookie support to `audit.py`: read `AUDIT_COOKIE` from the environment and, when set, call
`await page.context().add_cookies([{"name": "suriya_session", "value": os.environ["AUDIT_COOKIE"], "domain": "localhost", "path": "/", "httpOnly": True, "secure": True, "sameSite": "Lax"}])`
right after `new_page`. Then run:

```bash
cd "$SP"
AUDIT_COOKIE="$EDITOR" python3 audit.py /studio /studio/tellers /studio/tellers/new /studio/tellers/tsp_thiri /studio/bookings "/studio/bookings/$THIRI_BOOKING"
AUDIT_COOKIE="$TELLER" python3 audit.py /studio /studio/tellers/tsp_thiri /studio/bookings "/studio/bookings/$THIRI_BOOKING"
CUSTOMER=$(node "$SP/mint-cookie.mjs" dev-audit-secret-0123456789abcdef usr_cust customer@example.com "ဖောက်သည်")
AUDIT_COOKIE="$CUSTOMER" python3 audit.py /studio
python3 audit.py /tarot /tarot/tsp_thiri
```

Expected: every line `OK`. Open the 390 px screenshots of `/studio`, `/studio/tellers/tsp_thiri`, `/studio/bookings/<id>`, and the customer's `/studio` (no-access page) with the Read tool and confirm the layout, the Burmese labels, the status badges, and that the photo/bio show on `/tarot/tsp_thiri`.

- [ ] **Step 5: Gates**

```bash
npm run lint && npx vitest run && npm run build && node --test tests/rendered-html.test.mjs
```

Expected: green (re-run `tests/astrology/daily-score.test.ts` alone if it timed out under load).

- [ ] **Step 6: Commit and checkpoint**

```bash
git add tests/rendered-html.test.mjs
git commit -m "test: gate studio routes for guests

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_015qi697RAwcuBTPXMQAwuii"
```

Write `scratchpad/publish-checkpoint-4.md`: migration `0005` summary; the same deploy blocker as checkpoint 3 (Google secrets + `SITE_ADMIN_EMAILS`); how the editor onboards a reader (open `/studio/tellers/<id>`, set the reader's Gmail as login email, save); gate results with commands; the verification matrix from Steps 3–4.

- [ ] **Step 7: Merge into main (no push)**

```bash
git checkout main
git merge --no-ff feat/google-signin-studio -m "Merge feat/google-signin-studio: studio dashboard (phase B)

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_015qi697RAwcuBTPXMQAwuii"
git checkout feat/google-signin-studio
git status --short   # only the three untracked user files may appear
```

Stop the dev server afterwards (`lsof -ti :3000 | xargs kill`). `.env.local` (gitignored, dev-only values) stays for future local audits.

---

## Self-review

- **Spec coverage:** roles/env allowlist/teller email/inactive-teller behaviour (Task 2); migration 0005 columns and unique index (Task 1); repositories with scope predicates (Task 1); schemas with the strict self subset, tag splitting, slug, https photo, lower-cased email (Task 3); page table incl. teller redirect on `/studio/tellers`, forbidden `new`, own-id checks, filters, detail fields with `tel:` link, status buttons, staff note (Tasks 5–6); API rules and status codes, CSRF (Tasks 3, 5, 6); shell/no-access/table/tiles/form components and copy (Task 5); Studio CSS from tokens (Task 5); public photo/bio, active-only defaults, `/profile` Studio button, robots (Task 4); rendered + Playwright + unit tests and the local D1 procedure (Task 7). Sitemap and `POST /api/bookings` need no edits because the repository defaults changed to active-only.
- **Placeholders:** none.
- **Type consistency:** `requireStaff` → `Staff | { role: "none"; user }` is used identically in every page; `bookingScope(staff)` takes a `Staff`; `listBookingsForStaff(scope, { statuses, specialistId, fromDate, limit })`; `updateBookingForStaff(id, scope, { status?, staffNote? })` matches `bookingStaffPatchSchema`'s output; `TellerForm` sends `tags` as a string which `tagList` accepts; `tellerFormValues(row)` reads `row.tags: string[]`, `row.photoUrl`, `row.loginEmail`, `row.bio`, `row.isActive` from the Task 1 schema; `StudioBookingStatus` equals the DB enum.
