# LLM Period Readings Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Stream cached, Gemini-written Burmese readings for today / this week / this month at `/daily`, `/daily/week`, `/daily/month`, grounded in the existing deterministic engine.

**Architecture:** Pure helpers compute the period (`period.ts`), the evidence by running `calculateDailyInsight` per day (`period-evidence.ts`), the prompt (`period-prompt.ts`) and a deterministic fallback text (`period-deterministic.ts`). One streaming route caches results in a new `period_readings` D1 table keyed by `(user, kind, period, promptVersion)`. The UI reuses `StreamingReading` (generalised with an `endpoint` prop) plus a deterministic `PeriodOverview` strip that renders instantly.

**Tech Stack:** vinext / React 19 / TypeScript 5.9 / Zod 4 / Drizzle + D1 / Vitest 4 / node:test rendered-HTML / astronomy-engine (existing) / `@google/genai` (existing provider).

**Spec:** `docs/superpowers/specs/2026-08-30-period-readings-design.md`

## Global Constraints

- Burmese copy, Burmese digits (`toBurmeseDigits`), text ≥ .75rem, tap targets ≥ 44px, plain `<a href>` navigation.
- Timezone: profile timezone (demo `Asia/Yangon`); ISO week Mon–Sun; local noon for per-day evaluation.
- `PERIOD_PROMPT_VERSION = "suriya-period-1"`; daily free for guests as `user_id = "demo"`; weekly/monthly require sign-in (API 401).
- Never leave a page empty: deterministic text is the fallback on any provider failure.
- Do not touch untracked `untitled.pen`, `zartar-home-desktop.png`, `zartar-home-mobile.png`.
- Gates: `npm run test:unit`, `npm run lint`, `npm run build`, `node --test tests/rendered-html.test.mjs`, Playwright 390/1280.

---

### Task 1: Period keys and bounds

**Files:** Create `lib/readings/period.ts`; Test `tests/period.test.ts`.

**Interfaces — Produces:**
```ts
export type PeriodKind = "daily" | "weekly" | "monthly";
export const periodKinds: readonly PeriodKind[];
export type Period = { kind: PeriodKind; key: string; start: string; end: string; days: string[]; label: string; timezone: string };
export function periodFor(kind: PeriodKind, now: Date, timezone = "Asia/Yangon"): Period;
export function localNoonUtc(localDate: string, timezone: string): Date;
export function isPeriodKind(value: string): value is PeriodKind;
```

- [ ] **Step 1: Failing tests**
```ts
import { describe, expect, it } from "vitest";
import { isPeriodKind, localNoonUtc, periodFor } from "@/lib/readings/period";

const now = new Date("2026-08-30T10:00:00Z"); // Sunday 16:30 Yangon

describe("periodFor", () => {
  it("daily is the local date", () => {
    const p = periodFor("daily", now);
    expect(p.key).toBe("2026-08-30");
    expect(p.days).toEqual(["2026-08-30"]);
    expect(p.start).toBe("2026-08-29T17:30:00.000Z");
    expect(p.end).toBe("2026-08-30T17:30:00.000Z");
    expect(p.label).toBe("ဩဂုတ် ၃၀ · ၂၀၂၆");
  });
  it("weekly is ISO Monday–Sunday", () => {
    const p = periodFor("weekly", now);
    expect(p.key).toBe("2026-W35");
    expect(p.days[0]).toBe("2026-08-24");
    expect(p.days[6]).toBe("2026-08-30");
    expect(p.label).toBe("ဩဂုတ် ၂၄ – ၃၀ · ၂၀၂၆");
  });
  it("weekly crosses months and years", () => {
    const p = periodFor("weekly", new Date("2026-01-01T00:00:00Z"));
    expect(p.key).toBe("2026-W01");
    expect(p.days[0]).toBe("2025-12-29");
    expect(p.label).toBe("ဒီဇင်ဘာ ၂၉ – ဇန်နဝါရီ ၄ · ၂၀၂၆");
  });
  it("monthly covers the calendar month", () => {
    const p = periodFor("monthly", new Date("2026-02-10T00:00:00Z"));
    expect(p.key).toBe("2026-02");
    expect(p.days).toHaveLength(28);
    expect(p.label).toBe("ဖေဖော်ဝါရီ ၂၀၂၆");
  });
  it("localNoonUtc converts", () => {
    expect(localNoonUtc("2026-08-30", "Asia/Yangon").toISOString()).toBe("2026-08-30T05:30:00.000Z");
  });
  it("guards kinds", () => {
    expect(isPeriodKind("weekly")).toBe(true);
    expect(isPeriodKind("yearly")).toBe(false);
  });
});
```
- [ ] **Step 2:** run → fails (module missing).
- [ ] **Step 3: Implement** using `localDateInTimezone` and `localDateTimeToUtc` from `lib/astrology/time.ts`. Month names (Burmese): ဇန်နဝါရီ ဖေဖော်ဝါရီ မတ် ဧပြီ မေ ဇွန် ဇူလိုင် ဩဂုတ် စက်တင်ဘာ အောက်တိုဘာ နိုဝင်ဘာ ဒီဇင်ဘာ. ISO week: use a `Date.UTC(y,m-1,d)` of the local date, find Monday via `(getUTCDay()+6)%7`, week number via the Thursday-of-week rule. `start = localDateTimeToUtc(days[0], "00:00", tz)`, `end = localDateTimeToUtc(dayAfter(days.at(-1)), "00:00", tz)`.
- [ ] **Step 4:** tests pass. **Step 5:** `git add lib/readings/period.ts tests/period.test.ts && git commit -m "feat: add reading period helpers"`.

---

### Task 2: Period evidence

**Files:** Create `lib/readings/period-evidence.ts`; Modify `lib/services/daily.ts` (export `demoProfile`); Test `tests/period-evidence.test.ts`.

**Interfaces — Consumes:** `calculateChart(input, asOf)`, `calculateDailyInsight(snapshot, date)`, `Period`, `zodiacSignsMyanmar`, `vimshottariAt`. **Produces:**
```ts
export type PeriodDay = { date: string; weekday: string; score: number; band: DailyInsightData["band"]; categories: DailyCategoryScores; topFactorLabel: string; moonSignMy: string; moonHouse: number };
export type PeriodEvidence = {
  kind: PeriodKind; key: string; label: string; timezone: string;
  calculationVersion: string; rulesetVersion: string;
  natal: { ascendant: string; moonSign: string; moonSignMy: string };
  dasha: { mahadasha: DashaPeriod; antardasha: DashaPeriod; changeInside: { on: string; from: string; to: string } | null };
  transits: { jupiterSign: string; saturnSign: string; moonPath: Array<{ date: string; signMy: string; house: number }> };
  days: PeriodDay[];
  factors?: DailyInsightData["factors"]; // daily only
  summary: { averageScore: number; averageCategories: DailyCategoryScores; bestDays: string[]; cautionDays: string[]; dominantFactor: string };
};
export function buildPeriodEvidence(snapshot: ChartSnapshot, period: Period): PeriodEvidence;
```
Moon sign per day: transit factor `transit.moon` has `house`; `signIndex = (natalMoon.signIndex + house - 1) % 12`. Jupiter/Saturn sign: same from `transit.jupiter` / `transit.saturn` factors of the first day (use English sign name from `zodiacSigns` in types, and Burmese from `zodiacSignsMyanmar`). Dasha per day: `vimshottariAt(natalMoon.longitude, new Date(snapshot.instant), localNoonUtc(day))`; change detection scanning day-by-day (≤31 cheap calls). Weekday Burmese from `lib/content/booking-copy.ts` weekdays array — export it as `burmeseWeekdays`.

- [ ] **Step 1: Failing test**
```ts
import { describe, expect, it } from "vitest";
import { calculateChart } from "@/lib/astrology/calculate-chart";
import { buildPeriodEvidence } from "@/lib/readings/period-evidence";
import { periodFor } from "@/lib/readings/period";
import { demoProfile } from "@/lib/services/daily";

const asOf = new Date("2026-08-30T10:00:00Z");
const chart = calculateChart(demoProfile, asOf);

describe("buildPeriodEvidence", () => {
  it("evaluates every day of the week and ranks them", () => {
    const e = buildPeriodEvidence(chart, periodFor("weekly", asOf));
    expect(e.days).toHaveLength(7);
    expect(e.summary.bestDays).toHaveLength(3);
    expect(e.summary.cautionDays).toHaveLength(2);
    const scores = new Map(e.days.map((d) => [d.date, d.score]));
    expect(scores.get(e.summary.bestDays[0])).toBe(Math.max(...scores.values()));
    expect(e.transits.moonPath).toHaveLength(7);
    expect(e.natal.moonSignMy.length).toBeGreaterThan(0);
  });
  it("includes daily factors verbatim for daily", () => {
    const e = buildPeriodEvidence(chart, periodFor("daily", asOf));
    expect(e.days).toHaveLength(1);
    expect(e.factors?.length).toBeGreaterThan(3);
  });
  it("builds a month in under 3 seconds", () => {
    const started = performance.now();
    const e = buildPeriodEvidence(chart, periodFor("monthly", asOf));
    expect(e.days).toHaveLength(31);
    expect(performance.now() - started).toBeLessThan(3000);
  });
});
```
- [ ] **Step 2:** run → fails. **Step 3:** implement. **Step 4:** pass. **Step 5:** commit `feat: build period evidence from daily engine`.

---

### Task 3: Prompt + deterministic fallback

**Files:** Create `lib/ai/period-prompt.ts`, `lib/readings/period-deterministic.ts`; Tests `tests/period-prompt.test.ts`, `tests/period-deterministic.test.ts`.

**Produces:** `PERIOD_PROMPT_VERSION = "suriya-period-1"`, `buildPeriodPrompt(evidence): string`, `buildDeterministicPeriodReading(evidence): string`.

- [ ] **Step 1: Failing tests**
```ts
// tests/period-prompt.test.ts
it("embeds policy, version and evidence", () => {
  const prompt = buildPeriodPrompt(weeklyEvidence);
  expect(prompt).toContain("PROMPT_VERSION: suriya-period-1");
  expect(prompt).toContain("Write only in clear, natural Burmese");
  expect(prompt).toContain("Never provide a medical diagnosis");
  expect(prompt).toContain("EVIDENCE_JSON_BEGIN");
  expect(prompt).toContain(weeklyEvidence.key);
  expect(prompt).toContain("ရက်အလိုက်");
});
// tests/period-deterministic.test.ts
it("writes Burmese text naming the best days", () => {
  const text = buildDeterministicPeriodReading(weeklyEvidence);
  expect(text).toMatch(/[က-႟]/);
  for (const day of weeklyEvidence.summary.bestDays) expect(text).toContain(toBurmeseDigits(day.slice(-2)));
  expect(text).toMatch(/လက်တွေ့လုပ်ဆောင်ရန်/);
});
```
(build `weeklyEvidence` as in Task 2's test.)
- [ ] **Step 3:** Prompt: reuse the policy paragraph text from `lib/ai/prompt.ts` (copy the RESPONSE POLICY block; do not import — the two prompts version independently). Per-kind STRUCTURE block per spec. Deterministic: paragraphs — overview from `averageScore` band via `dailyCopy(band)` (map avg score to band with the same thresholds as `daily-score.ts` — export `bandFor(score)` from `daily-score.ts` if not already exported), 3 factor lines (daily: first three `factors`; weekly/monthly: dominantFactor, dasha, moon path summary), day list for weekly, week paragraphs for monthly (chunk `days` by 7), final "လက်တွေ့လုပ်ဆောင်ရန် — …".
- [ ] **Step 5:** commit `feat: add period prompt and deterministic fallback`.

---

### Task 4: Storage

**Files:** Modify `db/schema.ts`, `lib/ids.ts` (`prd`), `db/initialize.ts`; Create `db/repositories/period-readings.ts`; run `npm run db:generate` → `drizzle/0003_*.sql`; Test `tests/ids.test.ts`.

**Produces:**
```ts
findPeriodReading(userId, kind, periodKey, promptVersion)
createPeriodReading(input: PeriodReadingInsert) // onConflictDoNothing, then findPeriodReading
resetPeriodReading(id) // status generating, updatedAt now
completePeriodReading(id, text, mode)
failPeriodReading(id, code)
```
Schema: table `period_readings` per spec, `uniqueIndex("period_readings_key_idx").on(userId, kind, periodKey, promptVersion)`, `index("period_readings_user_idx").on(userId, createdAt)`. Add the two `CREATE [UNIQUE] INDEX IF NOT EXISTS` to `db/initialize.ts`.
- [ ] commit `feat: add period reading storage`.

---

### Task 5: Streaming API

**Files:** Create `app/api/period-readings/[kind]/stream/route.ts`, `lib/services/period-reading.ts`.

`lib/services/period-reading.ts`:
```ts
export async function resolvePeriodRequest(kind: PeriodKind, now = new Date()) → { userId: string; profile: BirthProfileInput; personalized: boolean } | null (null = guest on weekly/monthly)
export function periodReadingFor(profile, kind, now) → { snapshot, period, evidence, prompt, fallback }
```
Route logic per spec §API. Use `parseStoredTimestamp` from `lib/readings/quota.ts` for the 2-minute stale check. On provider error: `completePeriodReading(id, fallback, "deterministic")` and stream the fallback text to the client (the client may already have partial text — reset by sending a ` `? No: keep simple — if any chunks were already written, append `\n\n` + fallback? Avoid mixed output: buffer model chunks and only forward once the stream completes? That kills streaming. Decision: forward chunks live; on mid-stream failure, write nothing more, store the **partial + fallback** is wrong — store fallback only and close the stream; client shows what it has, refresh shows the fallback). Document this in a comment.
- [ ] lint + tsc clean; commit `feat: stream cached period readings`.

---

### Task 6: UI

**Files:** Modify `components/suriya/streaming-reading.tsx` (props `endpoint?`, `title?`, `headingId?`, 409 retry), `app/daily/page.tsx`, `components/suriya/daily-brief.tsx`, `components/suriya/route-cards.tsx`, `app/globals.css`; Create `components/suriya/period-tabs.tsx`, `components/suriya/period-overview.tsx`, `app/daily/week/page.tsx`, `app/daily/month/page.tsx`, `lib/content/period-copy.ts`; Test `tests/streaming-reading.test.ts` (add `retryDelayFor(status, attempt)` helper: 409 → 3000 for attempt < 5, else null).

- `PeriodTabs({ active })`: `<nav className="period-tabs" aria-label="ကာလ ရွေးရန်">` links `/daily` ယနေ့, `/daily/week` ဤအပတ်, `/daily/month` ဤလ.
- `PeriodOverview({ evidence })`: `<section className="surface period-overview">` with dl: ပျမ်းမျှ အမှတ်, အကောင်းဆုံးရက်များ (Burmese weekday + day digits), သတိထားရမည့်ရက်များ, ဒဿာ (maha · antar, change note), လ လမ်းကြောင်း chips.
- `/daily/week|month` server pages: `getDailyExperience()`; if `!daily.user` → sign-in card (`chatGPTSignInPath("/daily/week")`) + tabs; else `periodReadingFor(profile...)` — reuse `daily.chart` (snapshot) and `periodFor(kind, new Date(), tz)` → `buildPeriodEvidence` → render.
- `/daily`: `PeriodTabs active="daily"` after header; after `<DailyInsight>` add `<StreamingReading id="daily" endpoint="/api/period-readings/daily/stream" initialStatus="generating" title="သုရိယ၏ ယနေ့အမြင်" headingId="daily-reading" />`.
- Home: `DailyBrief` link row; Daily route card description "ယနေ့ · အပတ်စဉ် · လစဉ် ဖတ်စာနှင့် သင့်လျော်ချိန်".
- CSS: `.period-tabs` (flex pills, 44px, `[aria-current]` plum), `.period-overview dl` rows, `.moon-path` chips.
- [ ] commit `feat: add weekly and monthly reading pages`.

---

### Task 7: Rendered-HTML tests, audit, gates

Add to `tests/rendered-html.test.mjs`:
```js
test("period readings routes", async () => {
  const daily = await (await render("/daily")).text();
  assert.match(daily, /period-tabs[\s\S]*aria-current="page"[^>]*>ယနေ့/);
  assert.match(daily, /သုရိယ၏ ယနေ့အမြင်/);
  for (const [path, tab] of [["/daily/week", "ဤအပတ်"], ["/daily/month", "ဤလ"]]) {
    const res = await render(path); assert.equal(res.status, 200, path);
    const html = await res.text();
    assert.match(html, new RegExp(`aria-current="page"[^>]*>${tab}`), path);
    assert.match(html, /ဝင်ရောက်ပြီး အပတ်စဉ်နှင့် လစဉ်/, path);
  }
  assert.equal((await render("/api/period-readings/yearly/stream")).status, 404);
  assert.equal((await render("/api/period-readings/weekly/stream")).status, 401);
  const dailyStream = await render("/api/period-readings/daily/stream");
  assert.equal(dailyStream.status, 200);
  assert.match(await dailyStream.text(), /[က-႟]/);
});
```
Then build, run, Playwright (`audit.py`) on `/daily`, `/daily/week`, `/daily/month`, fix, final gates, commit `test: cover period readings`.
