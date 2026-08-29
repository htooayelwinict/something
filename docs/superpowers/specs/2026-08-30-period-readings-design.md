# LLM Period Readings (Daily / Weekly / Monthly) Design

Date: 2026-08-30
Status: Approved in chat (sub-project 2 of 3)

## Business context

Suriya is free; Vedic astrology is the hook and in-person Tarot is the product.
This sub-project adds Gemini-written Burmese readings for **today**, **this
week**, and **this month**, interpreting the deterministic engine's numbers.
Daily is free for everyone (guests get the demo chart). Weekly and monthly
require sign-in and are the sign-in hook. None of these count against the
3-questions-per-day quota.

## Goals

1. A signed-in user opens `/daily`, `/daily/week`, or `/daily/month` and reads
   a streamed Burmese interpretation grounded in calculated evidence, cached so
   Gemini is called at most once per user per period.
2. The pages are complete without a Gemini key or when Gemini fails: a
   deterministic reading built from the same evidence shows instead.
3. No new astronomy. Weekly/monthly evidence is derived by running the existing
   daily engine across the days of the period.

## Non-goals

- Push notifications, email digests, or scheduled pre-generation.
- Regenerate-on-demand buttons (a period reading is generated once; a later
  `PROMPT_VERSION` change naturally produces a new row).
- Yearly readings, compatibility readings.

## Period keys and bounds

`lib/readings/period.ts` (pure):

```ts
type PeriodKind = "daily" | "weekly" | "monthly";
periodFor(kind, now: Date, timezone = "Asia/Yangon") →
  { kind, key, start: ISO instant, end: ISO instant, days: string[] /* local ISO dates */, label: string }
```

- daily: key `2026-08-30`, days = [that date].
- weekly: ISO week Monday–Sunday in the timezone, key `2026-W36`, 7 days.
- monthly: calendar month, key `2026-08`, 28–31 days.
- `start`/`end` are the UTC instants of local midnight at the start of the
  first day and the end of the last day (exclusive). `label` is Burmese with
  Burmese digits, e.g. `၂၀၂၆ ဩဂုတ် ၃၁ – စက်တင်ဘာ ၆`.

## Evidence

`lib/readings/period-evidence.ts` (pure, unit-tested):

```ts
buildPeriodEvidence(snapshot: ChartSnapshot, period: Period) → PeriodEvidence
```

- For each day in `period.days`, evaluate `calculateDailyInsight(snapshot, noonUtcOf(day, timezone))`
  (local noon avoids DST/day-boundary ambiguity and keeps Panchanga stable).
- `PeriodEvidence` = `{ kind, key, label, calculationVersion, rulesetVersion,
  natal: { ascendant, moonSign, moonSignMy }, dasha: { mahadasha, antardasha,
  changeInside: { on: localDate, from, to } | null }, transits: { jupiterSign,
  saturnSign, moonPath: [{ date, signMy, house }] }, days: [{ date, weekday,
  score, band, categories, topFactorLabel }], summary: { averageScore,
  averageCategories, bestDays: 3 dates by score desc, cautionDays: 2 dates by
  caution desc, dominantFactor: most frequent factor label } }`.
- For daily the `days` array has one entry and the existing `DailyInsightData`
  factors are included verbatim as `factors`.
- Dasha change detection compares `antardasha.lord` between the first and last
  day; if it differs, binary-search the day of change.

## Prompt and deterministic fallback

`lib/ai/period-prompt.ts` — `PERIOD_PROMPT_VERSION = "suriya-period-1"`,
`buildPeriodPrompt(evidence)`; identical RESPONSE POLICY to
`buildReadingPrompt` (Burmese only, reflective language, no medical/legal/
investment directives, chart canonical, no outer planets, no numerology).
Required structure:

- daily: two-sentence overview → 3 factors from `factors` → one practical action.
- weekly: overview → 3 factors → "ရက်အလိုက်" list naming `bestDays` and
  `cautionDays` with the reason → one action for the week.
- monthly: overview → 3 factors → three "ရက်သတ္တပတ်" paragraphs (weeks of the
  month) using `days` scores → one action for the month.

`lib/readings/period-deterministic.ts` — `buildDeterministicPeriodReading(evidence)`
renders the same structure from the numbers (Burmese templates, Burmese digits).

## Storage

New table `period_readings` (migration `0003`):

| column | type |
| --- | --- |
| id | text pk `prd_…` |
| user_id | text not null (`"demo"` for guests; FK omitted so demo rows are allowed) |
| kind | enum daily/weekly/monthly |
| period_key | text |
| period_start / period_end | text ISO |
| evidence | json |
| calculation_version, ruleset_version, prompt_version | text |
| response_text | text nullable |
| interpretation_mode | enum deterministic/model |
| status | enum generating/complete/failed |
| error_code | text nullable |
| created_at / updated_at | text |

Unique index `(user_id, kind, period_key, prompt_version)`; index
`(user_id, created_at)`.

Repository `db/repositories/period-readings.ts`: `findPeriodReading(userId,
kind, key, promptVersion)`, `createPeriodReading(...)` using `onConflictDoNothing`
then re-read, `completePeriodReading`, `failPeriodReading`.

## API

`GET /api/period-readings/[kind]/stream`

1. Validate `kind` (404 otherwise). Resolve user; guests → `userId = "demo"`
   and demo profile; weekly/monthly for guests → 401.
2. `period = periodFor(kind, now, profile.timezone)`; compute evidence.
3. Find the cached row for `(userId, kind, key, PERIOD_PROMPT_VERSION)`.
   - `complete` → return stored text.
   - `generating` and updated < 2 minutes ago → return
     `409 { error: "generating" }` (the client retries after 3 s).
   - otherwise create/reset the row to `generating`.
4. Stream via `getAiProvider(fallbackText)` exactly like
   `/api/readings/[id]/stream`; on completion `completePeriodReading`; on
   provider error store the **deterministic** text as `complete` with
   `interpretation_mode = deterministic` (so the page is never empty), and only
   mark `failed` if even that write fails.
5. If the DB is unavailable, stream the deterministic text without caching.

Headers: `text/plain; charset=utf-8`, `private, no-store`.

## UI

- `components/suriya/period-tabs.tsx`: three links ယနေ့ · ဤအပတ် · ဤလ,
  `aria-current="page"` on the active one, 44 px targets.
- `components/suriya/streaming-reading.tsx` gains `endpoint`, `title`, and
  `headingId` props (defaults keep the existing behaviour for `/readings/[id]`).
  On 409 it waits 3 s and retries up to 5 times.
- `components/suriya/period-overview.tsx`: deterministic strip from evidence —
  average score, best days, caution days, dasha (with change note), Moon path
  chips. Renders instantly, before the stream.
- `/daily`: `PeriodTabs` under the header; new section **သုရိယ၏ ယနေ့အမြင်**
  (StreamingReading, endpoint `/api/period-readings/daily/stream`) placed
  directly after the score/factors card. Existing sections unchanged.
- `/daily/week`, `/daily/month` (`app/daily/week/page.tsx`,
  `app/daily/month/page.tsx`): header with period label, `PeriodTabs`,
  `PeriodOverview`, streamed reading, `TarotUpsell`, `MethodFootnote`. Guests:
  a sign-in card ("ဝင်ရောက်ပြီး အပတ်စဉ်နှင့် လစဉ် ဖတ်စာကို အခမဲ့ ရယူပါ")
  linking to `chatGPTSignInPath("/daily/week")`, plus the tabs so they can go
  back to today.
- Home `DailyBrief`: link row "ဤအပတ် · ဤလ" beneath the existing daily link.
- Route card for Daily on Home mentions "ယနေ့ · အပတ်စဉ် · လစဉ်".

## Errors

| case | behaviour |
| --- | --- |
| invalid kind | 404 |
| guest weekly/monthly | page shows sign-in card; API 401 |
| Gemini not configured / failure | deterministic text streamed and cached as `deterministic` |
| generation in progress elsewhere | 409 → client retry |
| DB unavailable | deterministic text streamed, not cached |

## Testing

Unit: `tests/period.test.ts` (keys, bounds, Yangon week/month edges, labels),
`tests/period-evidence.test.ts` (day count, best/caution selection, dasha change
detection using a fixed profile), `tests/period-prompt.test.ts` (policy lines,
version, evidence embedded, structure per kind), `tests/period-deterministic.test.ts`
(Burmese text, contains best days), `tests/streaming-reading.test.ts` (existing
helpers still pass; add retry-decision helper test).

Rendered HTML: `/daily` contains `period-tabs` and the daily reading section;
`/daily/week` and `/daily/month` render 200 with the sign-in card for guests and
`aria-current="page"` on the right tab; `/api/period-readings/yearly/stream` →
404; `/api/period-readings/weekly/stream` → 401 for guests;
`/api/period-readings/daily/stream` → 200 text for guests (deterministic).

Playwright 390/1280 on `/daily`, `/daily/week`, `/daily/month`: no console
errors, no overflow, Burmese ≥ 12 px.

Performance guard: a unit test asserts `buildPeriodEvidence` for a 31-day month
completes in under 3 s.

## Out of scope

Admin views, notifications, yearly readings, the visual polish pass.
