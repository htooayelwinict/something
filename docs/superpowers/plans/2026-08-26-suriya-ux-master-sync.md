# Suriya UX Master Sync Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the current Suriya interface with the new Pen.dev UX master design, add truthful chart-derived reading content and feedback, and publish the verified result to the existing public Sites project.

**Architecture:** Keep the existing Vinext modular monolith, D1 repositories, ChatGPT identity boundary, and versioned astrology core. Add pure numerology and deterministic-reading modules, then rebuild each user-facing route from shared cosmic UI primitives; future consultation transactions stay unavailable while discovery/profile routes remain honest previews.

**Tech Stack:** React 19, TypeScript 5.9, Vinext 1 beta, Vite 8, Cloudflare D1, Drizzle ORM, Zod 4, Astronomy Engine, Lucide React, Vitest, Node test runner, Playwright MCP, Pen.dev MCP, OpenAI Sites.

**Spec:** `docs/superpowers/specs/2026-08-26-suriya-ux-master-sync-design.md`

## Global Constraints

- Pen.dev variables are canonical: canvas `#E9E1D4`, paper `#F8F2E8`, ink `#24231F`, muted `#777168`, line `#CFC3B2`, gold `#B58A46`, plum `#3A243C`, green `#6D8066`.
- Use the existing Myanmar and Latin font setup and Lucide icons; preserve exact canvas copy except the correction from `Dဉာဏ်ရည်တုLY ENERGY` to `DAILY ENERGY`.
- ChatGPT sign-in remains identity-only; never imply access to conversations, memory, subscription, or model quota.
- Show only calculation sources actually used; no fabricated confidence percentage and no claim that four methods were combined.
- Booking, payment, live consultation, and approved consultation summary remain unavailable.
- Preserve native `<a>` route navigation because Vinext beta's `next/link` prefetch handler breaks deployed clicks.
- Every user-owned D1 operation includes the authenticated user ID.
- Mobile widths 320–430px have no horizontal page overflow; verify desktop at 1280×900 and 1440×1000.
- Run production deployment only after lint, full tests, build, dependency audit, Pen.dev comparison, and Playwright verification pass.

---

### Task 1: Add Versioned Numerology to the Canonical Chart

**Files:**
- Create: `lib/numerology/calculate.ts`
- Modify: `lib/astrology/types.ts`
- Modify: `lib/astrology/calculate-chart.ts`
- Create: `tests/numerology.test.ts`

**Interfaces:**
- Produces: `NUMEROLOGY_VERSION`, `NumerologySnapshot`, and `calculateNumerology(birthDate: string): NumerologySnapshot`.
- Extends: `ChartSnapshot.numerology: NumerologySnapshot` for later feed, profile, source, and deterministic-reading tasks.

- [ ] **Step 1: Write the failing numerology tests**

```ts
import { describe, expect, it } from "vitest";
import { calculateNumerology } from "@/lib/numerology/calculate";

describe("calculateNumerology", () => {
  it("derives repeatable values from an ISO birth date", () => {
    expect(calculateNumerology("1995-02-14")).toEqual({
      version: "suriya-numerology-1",
      lifePath: 4,
      birthNumber: 5,
      attitudeNumber: 7,
    });
  });

  it("reduces every value to one digit", () => {
    expect(calculateNumerology("2000-11-29")).toEqual({
      version: "suriya-numerology-1",
      lifePath: 6,
      birthNumber: 2,
      attitudeNumber: 4,
    });
  });
});
```

- [ ] **Step 2: Run the test and confirm the missing-module failure**

Run: `npm run test:unit -- tests/numerology.test.ts`  
Expected: FAIL because `lib/numerology/calculate.ts` does not exist.

- [ ] **Step 3: Implement the pure, versioned calculation**

```ts
export const NUMEROLOGY_VERSION = "suriya-numerology-1" as const;

export type NumerologySnapshot = {
  version: typeof NUMEROLOGY_VERSION;
  lifePath: number;
  birthNumber: number;
  attitudeNumber: number;
};

function reduceNumber(value: number): number {
  let current = Math.abs(Math.trunc(value));
  while (current > 9) {
    current = String(current).split("").reduce((sum, digit) => sum + Number(digit), 0);
  }
  return current;
}

export function calculateNumerology(birthDate: string): NumerologySnapshot {
  const [year, month, day] = birthDate.split("-").map(Number);
  return {
    version: NUMEROLOGY_VERSION,
    lifePath: reduceNumber([...String(year), ...String(month).padStart(2, "0"), ...String(day).padStart(2, "0")].reduce((sum, digit) => sum + Number(digit), 0)),
    birthNumber: reduceNumber(day),
    attitudeNumber: reduceNumber(month + day),
  };
}
```

Add `numerology: NumerologySnapshot` to `ChartSnapshot`, import the type, and set `numerology: calculateNumerology(input.birthDate)` in `calculateChart`.

- [ ] **Step 4: Run focused and astrology regression tests**

Run: `npm run test:unit -- tests/numerology.test.ts tests/astrology/chart.test.ts`  
Expected: both files PASS and chart fixtures include `numerology`.

- [ ] **Step 5: Commit the calculation unit**

```bash
git add lib/numerology/calculate.ts lib/astrology/types.ts lib/astrology/calculate-chart.ts tests/numerology.test.ts
git commit -m "feat: add versioned numerology snapshot"
```

### Task 2: Replace Identical Demo Copy with a Chart-Derived Reading

**Files:**
- Create: `lib/readings/deterministic.ts`
- Create: `tests/deterministic-reading.test.ts`
- Modify: `lib/ai/fake.ts`
- Modify: `lib/ai/index.ts`
- Modify: `app/api/readings/[id]/stream/route.ts`

**Interfaces:**
- Produces: `buildDeterministicReading(snapshot: ChartSnapshot, input: ReadingRequestInput): DeterministicReading`.
- Produces: `DeterministicReading = { text: string; sources: ReadingSource[]; mode: "deterministic" }`.
- Changes: `getAiProvider(fallbackText: string): { provider: AiProvider; mode: "deterministic" | "model" }`; configured Gemini behavior remains unchanged.

- [ ] **Step 1: Write failing source and personalization tests**

```ts
import { describe, expect, it } from "vitest";
import { calculateChart } from "@/lib/astrology/calculate-chart";
import { buildDeterministicReading } from "@/lib/readings/deterministic";

const chart = calculateChart({
  name: "မေသီ",
  birthDate: "1995-02-14",
  birthTime: "06:42",
  birthCity: "Yangon",
  latitude: 16.7967,
  longitude: 96.161,
  timezone: "Asia/Yangon",
}, new Date("2026-08-26T00:00:00.000Z"));

describe("buildDeterministicReading", () => {
  it("uses only canonical chart facts and ends with one action", () => {
    const result = buildDeterministicReading(chart, { kind: "janma", question: "အလုပ်ပြောင်းသင့်လား?" });
    expect(result.mode).toBe("deterministic");
    expect(result.sources.map((source) => source.label)).toEqual(["လဂ်", "လ၏အနေအထား", "ဘဝလမ်းကြောင်း"]);
    expect(result.text).toContain(chart.ascendant.sign);
    expect(result.text).toContain(chart.planets.find((planet) => planet.name === "Moon")!.sign);
    expect(result.text).toContain(String(chart.numerology.lifePath));
    expect(result.text).toMatch(/လက်တွေ့လုပ်ဆောင်ရန် — .+$/);
  });
});
```

- [ ] **Step 2: Run the focused test and verify failure**

Run: `npm run test:unit -- tests/deterministic-reading.test.ts`  
Expected: FAIL because the deterministic module does not exist.

- [ ] **Step 3: Implement the deterministic reading contract**

```ts
export type ReadingSource = { id: "ascendant" | "moon" | "life_path"; label: string; value: string };
export type DeterministicReading = { text: string; sources: ReadingSource[]; mode: "deterministic" };

export function buildDeterministicReading(snapshot: ChartSnapshot, input: ReadingRequestInput): DeterministicReading {
  const moon = snapshot.planets.find((planet) => planet.name === "Moon")!;
  const sources: ReadingSource[] = [
    { id: "ascendant", label: "လဂ်", value: `${snapshot.ascendant.sign} · အိမ် ၁` },
    { id: "moon", label: "လ၏အနေအထား", value: `${moon.sign} · အိမ် ${moon.house}` },
    { id: "life_path", label: "ဘဝလမ်းကြောင်း", value: String(snapshot.numerology.lifePath) },
  ];
  const text = [
    `အကျဉ်းချုပ် — “${input.question}” ဆိုတဲ့မေးခွန်းကို ချက်ချင်းအတည်ပြုဆုံးဖြတ်ခြင်းထက် ရရှိထားတဲ့အချက်အလက်နဲ့ ပြန်လည်ချိန်ဆဖို့ သင့်တော်ပါတယ်။ ဒီအဖြေဟာ တွက်ချက်ထားတဲ့ ဇာတာအချက်များကို ရှင်းပြထားတဲ့ လမ်းညွှန်သာဖြစ်ပါတယ်။`,
    `သင့်လဂ်က ${snapshot.ascendant.sign} ဖြစ်ပြီး လက ${moon.sign} ရာသီ အိမ် ${moon.house} မှာ ရှိပါတယ်။ ဘဝလမ်းကြောင်းဂဏန်း ${snapshot.numerology.lifePath} နဲ့အတူ ကြည့်တဲ့အခါ ကိုယ့်ဦးစားပေးမှုကို တိတိကျကျ စာရင်းပြုစုခြင်းက အထောက်အကူဖြစ်နိုင်ပါတယ်။`,
    "လက်တွေ့လုပ်ဆောင်ရန် — ဆုံးဖြတ်ချက်မချမီ အရေးကြီးဆုံးအချက်သုံးခုကို ရေးပြီး ယုံကြည်ရသူတစ်ဦးနှင့် ပြန်လည်စစ်ဆေးပါ။",
  ].join("\n\n");
  return { text, sources, mode: "deterministic" };
}
```

Replace the fixed provider class with `DeterministicAiProvider`, accept the computed fallback text in its constructor, and stream paragraph chunks. `getAiProvider` returns `{ provider: new DeterministicAiProvider(fallbackText), mode: "deterministic" }` without a key and `{ provider: new GeminiProvider(...), mode: "model" }` with a key. Pass `buildDeterministicReading(...).text` into `getAiProvider(fallbackText)` in the stream route and destructure both values. Do not parse a prompt to recover chart data.

- [ ] **Step 4: Run reading, prompt, and stream-adjacent tests**

Run: `npm run test:unit -- tests/deterministic-reading.test.ts tests/prompt.test.ts tests/reading-schema.test.ts`  
Expected: PASS.

- [ ] **Step 5: Commit the truthful fallback**

```bash
git add lib/readings/deterministic.ts tests/deterministic-reading.test.ts lib/ai/fake.ts lib/ai/index.ts 'app/api/readings/[id]/stream/route.ts'
git commit -m "feat: personalize local reading fallback"
```

### Task 3: Persist Reading Mode and User Feedback

**Files:**
- Modify: `db/schema.ts`
- Modify: `db/repositories/readings.ts`
- Modify: `app/api/readings/route.ts`
- Modify: `app/api/readings/[id]/stream/route.ts`
- Create: `app/api/readings/[id]/feedback/route.ts`
- Create: `lib/schemas/feedback.ts`
- Create: `tests/feedback-schema.test.ts`
- Create: `drizzle/0001_reading_feedback.sql`
- Modify: `drizzle/meta/_journal.json`

**Interfaces:**
- Produces: `readingFeedbackSchema` with `{ value: "useful" | "not_useful" }`.
- Produces: `setReadingFeedback(userId: string, id: string, feedback: ReadingFeedback): Promise<ReadingRow | undefined>`.
- Extends: reading rows with `interpretationMode: "deterministic" | "model"` and nullable `feedback`.
- Changes: `completeReading(userId: string, id: string, responseText: string, interpretationMode: "deterministic" | "model")` persists the provider mode returned by Task 2.

- [ ] **Step 1: Write the failing validation test**

```ts
import { describe, expect, it } from "vitest";
import { readingFeedbackSchema } from "@/lib/schemas/feedback";

describe("readingFeedbackSchema", () => {
  it.each(["useful", "not_useful"])("accepts %s", (value) => {
    expect(readingFeedbackSchema.parse({ value })).toEqual({ value });
  });
  it("rejects unknown values", () => {
    expect(readingFeedbackSchema.safeParse({ value: "maybe" }).success).toBe(false);
  });
});
```

- [ ] **Step 2: Run the focused test and confirm failure**

Run: `npm run test:unit -- tests/feedback-schema.test.ts`  
Expected: FAIL because `lib/schemas/feedback.ts` does not exist.

- [ ] **Step 3: Add schema, migration, repository, and owned endpoint**

```ts
export const readingFeedbackSchema = z.object({ value: z.enum(["useful", "not_useful"]) });
export type ReadingFeedback = z.infer<typeof readingFeedbackSchema>["value"];
```

Migration SQL:

```sql
ALTER TABLE `readings` ADD `interpretation_mode` text NOT NULL DEFAULT 'deterministic';
ALTER TABLE `readings` ADD `feedback` text;
```

Repository update:

```ts
export async function setReadingFeedback(userId: string, id: string, feedback: ReadingFeedback) {
  const db = await getDb();
  const [row] = await db.update(readings).set({ feedback, updatedAt: new Date().toISOString() })
    .where(and(eq(readings.userId, userId), eq(readings.id, id))).returning();
  return row;
}
```

Update `completeReading` to include `interpretationMode` in its owned D1 update, and pass the `mode` returned by `getAiProvider` from the stream route. New reading rows start with `interpretationMode: "deterministic"`; configured model completion changes it to `model`.

The new route obtains `getChatGPTUser()`, returns 401 without identity, validates JSON, calls `setReadingFeedback(user.userId, id, parsed.data.value)`, returns 404 if no owned row, and returns `{ feedback: row.feedback }` with `private, no-store` caching.

- [ ] **Step 4: Generate/check Drizzle metadata and run tests**

Run: `npm run db:generate` if metadata cannot be updated by the existing generator without duplicating the SQL, then inspect the generated migration and keep exactly one additive migration.  
Run: `npm run test:unit -- tests/feedback-schema.test.ts tests/reading-schema.test.ts`  
Expected: PASS.

- [ ] **Step 5: Commit the additive data change**

```bash
git add db/schema.ts db/repositories/readings.ts app/api/readings/route.ts 'app/api/readings/[id]/stream/route.ts' 'app/api/readings/[id]/feedback/route.ts' lib/schemas/feedback.ts tests/feedback-schema.test.ts drizzle
git commit -m "feat: store reading mode and feedback"
```

### Task 4: Build the Cosmic Shell and Shared UI Primitives

**Files:**
- Modify: `app/globals.css`
- Modify: `components/suriya/app-shell.tsx`
- Modify: `components/suriya/brand.tsx`
- Modify: `components/suriya/bottom-nav.tsx`
- Create: `components/suriya/top-nav.tsx`
- Create: `components/suriya/identity-rail.tsx`
- Create: `components/suriya/source-chip.tsx`
- Create: `components/suriya/cosmic-metric.tsx`
- Modify: `tests/navigation.test.ts`
- Modify: `tests/rendered-html.test.mjs`

**Interfaces:**
- Produces: `AppShell({ children, rail?, aside?, activeSection? })` responsive three-zone shell.
- Produces: `IdentityRail`, `SourceChip`, and `CosmicMetric` reusable by all core routes.
- Keeps: native anchors for every internal route.

- [ ] **Step 1: Add failing rendered-shell expectations**

Add assertions that `/` contains `SURIYA`, `နေ့စဉ်ဖတ်စာ`, `နည်းလမ်းများ`, and the `အဓိက လမ်းညွှန်` landmark; update the static navigation test to cover every new component and continue rejecting `next/link` imports.

- [ ] **Step 2: Run shell tests and confirm copy/layout markers are missing**

Run: `npm run test:unit -- tests/navigation.test.ts && npm run build && node --test tests/rendered-html.test.mjs`  
Expected: rendered home assertion FAIL before the shell rewrite.

- [ ] **Step 3: Implement shared markup and tokens**

Replace root colors with the eight Pen.dev variables and define a consistent spacing/radius scale. `TopNav` uses a native brand link, desktop links for daily/methods/saved, and a profile chip. `BottomNav` remains fixed on mobile and becomes hidden at the desktop breakpoint. `IdentityRail` receives `{ name, birthLabel, numerology, personalized }` and displays guest/profile state without fake completion values. `SourceChip` receives `{ label, value, tone }`; `CosmicMetric` receives `{ label, value, description, tone }`.

Use CSS grid areas:

```css
.cosmic-shell { min-height: 100dvh; background: var(--cosmic-bg); }
.cosmic-layout { width: min(100%, 1440px); margin: 0 auto; padding: 18px; }
@media (min-width: 1040px) {
  .cosmic-layout[data-with-rail="true"] { display: grid; grid-template-columns: 250px minmax(0, 1fr); gap: 22px; }
  .bottom-nav { display: none; }
}
```

Retain the existing `skip-link`, focus-visible treatment, reduced-motion rule, minimum 44px actions, and native-anchor compatibility override.

- [ ] **Step 4: Run lint and shell regressions**

Run: `npm run lint && npm run test:unit -- tests/navigation.test.ts && npm run build && node --test tests/rendered-html.test.mjs`  
Expected: PASS.

- [ ] **Step 5: Commit the shared design system**

```bash
git add app/globals.css components/suriya/app-shell.tsx components/suriya/brand.tsx components/suriya/bottom-nav.tsx components/suriya/top-nav.tsx components/suriya/identity-rail.tsx components/suriya/source-chip.tsx components/suriya/cosmic-metric.tsx tests/navigation.test.ts tests/rendered-html.test.mjs
git commit -m "feat: build cosmic application shell"
```

### Task 5: Implement Personalized Home, Daily Overview, and Horoscope Detail

**Files:**
- Modify: `lib/services/daily.ts`
- Modify: `lib/content/daily-copy.ts`
- Modify: `components/suriya/daily-insight.tsx`
- Create: `components/suriya/method-summary.tsx`
- Create: `components/suriya/lucky-window.tsx`
- Create: `components/suriya/ritual-card.tsx`
- Modify: `app/page.tsx`
- Modify: `app/daily/page.tsx`
- Create: `app/daily/details/page.tsx`
- Modify: `tests/daily-copy.test.ts`
- Modify: `tests/rendered-html.test.mjs`

**Interfaces:**
- Extends: `getDailyExperience()` with `numerology`, `identity`, and truthful `sources` derived from `chart` and `insight`.
- Produces: `LuckyWindow({ favorableWindow })`, `RitualCard({ lifePath })`, and `MethodSummary` presentational components.

- [ ] **Step 1: Add failing content and route assertions**

```ts
it("describes only calculated sources", () => {
  const presentation = buildDailyPresentation(chart, calculateDailyInsight(chart, now));
  expect(presentation.sources.map((source) => source.id)).toEqual(["vedic", "numerology"]);
  expect(presentation.combinedMethodCount).toBe(2);
});
```

Add server-render checks that `/` contains `TODAY’S POWER NUMBER`, `/daily` contains `DAILY ENERGY` and `LUCKY WINDOW`, and `/daily/details` contains `D1 · RASI`, `D9 · NAVAMSA`, and `D10 · DASAMSA`.

- [ ] **Step 2: Run focused tests and confirm failure**

Run: `npm run test:unit -- tests/daily-copy.test.ts && npm run build && node --test tests/rendered-html.test.mjs`  
Expected: FAIL on missing source metadata and missing detail route.

- [ ] **Step 3: Implement the three Pen.dev screens**

Home uses the identity rail on desktop, date/greeting, plum power-number panel, dominant insight card, real Vedic/numerology summaries, and ritual card. Guest content is labeled `နမူနာဖတ်စာ`; authenticated content names the saved profile.

Daily uses the compact Pen.dev header, plum guidance hero with energy score, three metric positions where the third unsupported method is visibly `မချိတ်ဆက်ရသေး`, a selected lucky-window segment based on the computed favorable window, and native link to `/daily/details`.

Detail reuses `DailyInsight`, explanatory factors, safety copy, `ChartGrid`, and the existing D1/D9/D10 renderers. The route is server-rendered from `getDailyExperience()` and uses the mobile-first narrow reading layout from frame `m6jeJ`.

- [ ] **Step 4: Run daily and rendered regression suites**

Run: `npm run test:unit -- tests/daily-copy.test.ts tests/numerology.test.ts tests/astrology/chart.test.ts && npm run build && node --test tests/rendered-html.test.mjs`  
Expected: PASS.

- [ ] **Step 5: Commit the core reading surfaces**

```bash
git add lib/services/daily.ts lib/content/daily-copy.ts components/suriya/daily-insight.tsx components/suriya/method-summary.tsx components/suriya/lucky-window.tsx components/suriya/ritual-card.tsx app/page.tsx app/daily/page.tsx app/daily/details/page.tsx tests/daily-copy.test.ts tests/rendered-html.test.mjs
git commit -m "feat: implement personalized daily experience"
```

### Task 6: Implement Ask, Reading Detail, Sources, Follow-Ups, and Feedback

**Files:**
- Modify: `components/suriya/question-composer.tsx`
- Modify: `components/suriya/streaming-reading.tsx`
- Create: `components/suriya/reading-sources.tsx`
- Create: `components/suriya/reading-feedback.tsx`
- Create: `components/suriya/recent-readings-rail.tsx`
- Modify: `app/ask/page.tsx`
- Modify: `app/readings/page.tsx`
- Modify: `app/readings/[id]/page.tsx`
- Modify: `tests/rendered-html.test.mjs`

**Interfaces:**
- Produces: `ReadingFeedback({ id, initialValue })` client component calling `PUT /api/readings/:id/feedback`.
- Produces: `ReadingSources({ chart })` from real ascendant, Moon, and numerology values.
- Produces: `RecentReadingsRail({ readings })` with native owned reading links.

- [ ] **Step 1: Add failing route-content assertions**

Assert `/ask` contains `သုရိယကို မေးပါ`, `အဖြေတွက်ချက်ပုံ`, and `သင့်ဇာတာနှင့် ချိတ်ဆက်ထားသည်`; authenticated reading-detail behavior is covered by unit tests for source extraction and the feedback schema rather than an anonymous server-render route.

- [ ] **Step 2: Run rendered checks and confirm failure**

Run: `npm run build && node --test tests/rendered-html.test.mjs`  
Expected: FAIL on the new Ask copy.

- [ ] **Step 3: Implement conversation and feedback states**

Ask uses a recent-reading rail when authenticated, a central composer/chat surface, and a right explanation panel on desktop. Before submission it renders the Pen.dev welcome state and selected real sources. The existing technique radio cards remain accessible and submission preserves the 401 → login and 409 → onboarding redirects.

Reading detail renders streamed plain text, `ReadingSources`, three native follow-up links that prefill `/ask?q=...`, and `ReadingFeedback`. Feedback buttons expose pressed, saving, saved, and error states through `aria-pressed` and a live status region.

History adopts the cosmic card/list styling and keeps empty, generating, failed, and complete states distinguishable.

- [ ] **Step 4: Run build, rendered tests, and lint**

Run: `npm run lint && npm run test:unit -- tests/feedback-schema.test.ts tests/deterministic-reading.test.ts && npm run build && node --test tests/rendered-html.test.mjs`  
Expected: PASS.

- [ ] **Step 5: Commit the Ask and saved-reading flow**

```bash
git add components/suriya/question-composer.tsx components/suriya/streaming-reading.tsx components/suriya/reading-sources.tsx components/suriya/reading-feedback.tsx components/suriya/recent-readings-rail.tsx app/ask/page.tsx app/readings/page.tsx 'app/readings/[id]/page.tsx' tests/rendered-html.test.mjs
git commit -m "feat: implement cosmic reading conversation"
```

### Task 7: Implement Cosmic Profile and Onboarding

**Files:**
- Modify: `components/suriya/birth-profile-form.tsx`
- Create: `components/suriya/cosmic-fingerprint.tsx`
- Modify: `app/profile/page.tsx`
- Modify: `app/onboarding/page.tsx`
- Modify: `app/login/page.tsx`
- Modify: `tests/rendered-html.test.mjs`

**Interfaces:**
- Produces: `CosmicFingerprint({ numerology, connectedMethods })` with three calculated values and truthful method state.
- Keeps: existing `/api/profile` GET/PUT boundary and same-origin post-save navigation.

- [ ] **Step 1: Add failing profile/login rendered expectations**

Assert `/profile` anonymously contains `YOUR COSMIC IDENTITY` and the ChatGPT sign-in action; assert `/login` still contains its secure identity disclosure and no wording about reading ChatGPT conversations.

- [ ] **Step 2: Run rendered tests and confirm failure**

Run: `npm run build && node --test tests/rendered-html.test.mjs`  
Expected: FAIL on `YOUR COSMIC IDENTITY`.

- [ ] **Step 3: Implement profile and onboarding states**

Authenticated profile renders avatar/name/birth label, a completion bar computed from stored fields, birth facts, `CosmicFingerprint`, connected Vedic/numerology chips, and upcoming chips for unsupported methods. The editable form stays on the page below the summary and retains all validation/status behavior.

Onboarding uses the same form in a focused paper panel with a three-step progress header: identity, birth data, calculated profile. Login adopts the new plum/gold surfaces while preserving the native `/signin-with-chatgpt` anchor.

- [ ] **Step 4: Run schema, build, rendered, and lint checks**

Run: `npm run lint && npm run test:unit -- tests/profile-schema.test.ts tests/numerology.test.ts && npm run build && node --test tests/rendered-html.test.mjs`  
Expected: PASS.

- [ ] **Step 5: Commit identity surfaces**

```bash
git add components/suriya/birth-profile-form.tsx components/suriya/cosmic-fingerprint.tsx app/profile/page.tsx app/onboarding/page.tsx app/login/page.tsx tests/rendered-html.test.mjs
git commit -m "feat: implement cosmic identity experience"
```

### Task 8: Implement Honest Consultant Discovery and Profiles

**Files:**
- Modify: `db/repositories/specialists.ts`
- Modify: `components/suriya/tarot-specialist-card.tsx`
- Modify: `app/tarot/page.tsx`
- Create: `app/tarot/[id]/page.tsx`
- Modify: `tests/rendered-html.test.mjs`

**Interfaces:**
- Produces: `getSpecialist(id: string)` public read-only repository function.
- Keeps: no booking/payment/live-session mutation or route.

- [ ] **Step 1: Add failing consultant-route expectations**

Assert `/tarot` contains `လူသားအကြံပေး` and `Preview`; verify the route renders seeded fallback specialist names in local server-render tests. Add a static assertion that no source file contains `payment_intent`, `checkout`, or a booking POST endpoint.

- [ ] **Step 2: Run rendered checks and confirm failure**

Run: `npm run build && node --test tests/rendered-html.test.mjs`  
Expected: FAIL on the new consultant-discovery copy.

- [ ] **Step 3: Implement discovery and read-only profiles**

Load specialists through `listSpecialists().catch(() => demoSpecialists)` and map database field names to the card view model. Discovery matches frame `HEFLT`: category chips, three-column desktop cards, status/rate metadata, and native profile links. The profile route loads by ID, calls `notFound()` for unknown IDs, and displays specialty, experience, tags, rate, and a disabled/preview consultation action with explicit “booking မဖွင့်ရသေးပါ” copy.

- [ ] **Step 4: Run build, rendered, and lint checks**

Run: `npm run lint && npm run build && node --test tests/rendered-html.test.mjs`  
Expected: PASS and no transactional route exists.

- [ ] **Step 5: Commit consultant previews**

```bash
git add db/repositories/specialists.ts components/suriya/tarot-specialist-card.tsx app/tarot/page.tsx 'app/tarot/[id]/page.tsx' tests/rendered-html.test.mjs
git commit -m "feat: add consultant discovery previews"
```

### Task 9: Pen.dev Visual Review and Responsive Interaction Verification

**Files:**
- Modify as discrepancies require: `app/globals.css`, `app/**/*.tsx`, `components/suriya/**/*.tsx`
- Test evidence: Playwright MCP session and Pen.dev screenshots; do not commit generated screenshots.

**Interfaces:**
- Consumes: all completed routes and the source frames `qaJx9`, `N6wvN`, `J7PpAd`, `h3x8k`, `m6jeJ`, and `HEFLT`.
- Produces: visually reviewed, accessible, interaction-complete local application.

- [ ] **Step 1: Start the local site and capture source references**

Run: `npm run dev` and keep the server alive. Use Pen.dev `TakeScreenshot` for the six source frames. Open local `/`, `/daily`, `/daily/details`, `/ask`, `/profile`, and `/tarot` with Playwright.

- [ ] **Step 2: Verify mobile behavior at 390×844 and 320×700**

Check native bottom navigation, no horizontal overflow, Burmese wrapping, source chips, daily-detail navigation, Ask radio selection and submit redirect, profile form controls, consultant details, focus order, and zero console errors. Record any discrepancy against its source frame and patch the existing component directly.

- [ ] **Step 3: Verify desktop behavior at 1280×900 and 1440×1000**

Check identity/history rails, dominant content width, top navigation, right contextual panels, card alignment, chart readability, and no clipped content. Patch discrepancies and repeat only the affected route comparison.

- [ ] **Step 4: Run the complete verification suite**

Run: `npm run lint`  
Run: `npm test`  
Run: `npm audit --omit=dev`  
Expected: lint exits 0, all unit/rendered tests pass, production build succeeds, and audit reports zero production vulnerabilities.

- [ ] **Step 5: Commit visual-review corrections**

```bash
git add app components lib tests db drizzle
git commit -m "fix: align Suriya with UX master canvas"
```

Skip the commit only if `git status --short` shows no tracked changes after verification.

### Task 10: Migrate D1, Publish the Existing Sites Project, and Verify Production

**Files:**
- No new source files unless production verification finds a reproducible defect.
- Existing project identity: `.openai/hosting.json` project `appgprj_6a8e620814ec819187166e798a9c3434`.

**Interfaces:**
- Consumes: exact tested Git HEAD and built Vinext archive.
- Produces: a successful public version at `https://suriya-myanmar.htoo368095.chatgpt.site`.

- [ ] **Step 1: Apply the additive production D1 migration**

Use the Sites D1 migration tool with the exact project ID and `drizzle/0001_reading_feedback.sql`. Query `PRAGMA table_info(readings)` afterward and verify `interpretation_mode` and `feedback` exist without deleting existing rows.

- [ ] **Step 2: Push the exact tested Git HEAD**

Create a short-lived Sites source credential, use per-command HTTP-header authentication, and push `HEAD` to the configured `main` branch. Do not persist or print the token.

- [ ] **Step 3: Package and save the built version**

Run the Sites helper:

```bash
/Users/htooayelwin/.codex/plugins/cache/openai-bundled/sites/0.1.34/scripts/package-site.sh /Users/htooayelwin/orca/something <temporary-archive-path>
```

Save a version using the exact pushed commit SHA and resulting archive.

- [ ] **Step 4: Deploy the saved version publicly and poll to a terminal state**

Deploy the saved version to the existing public project. Poll the deployment ID until `succeeded`; on `failed`, report the provider message and do not claim completion.

- [ ] **Step 5: Verify the anonymous production experience**

With Playwright at 390×844 and 1280×900, verify `/`, `/daily`, `/daily/details`, `/ask`, `/profile`, `/tarot`, and a consultant profile. Exercise route links, source/technique cards, Tarot preview controls, and anonymous sign-in redirects. Require zero console errors and confirm the URL remains publicly reachable.

- [ ] **Step 6: Final repository check**

Run: `git status --short && git log -5 --oneline`  
Expected: only the user's untracked reference assets remain, and the published commit is current HEAD.
