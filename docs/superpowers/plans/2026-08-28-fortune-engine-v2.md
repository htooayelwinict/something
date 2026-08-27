# Fortune Engine v2 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship distinct Janma, Prashna, and Muhurta calculations plus an explainable daily Vedic evidence engine and real local timing.

**Architecture:** Keep Astronomy Engine for celestial positions, split generic event charts from natal-only data, and persist a technique-aware reading wrapper. A local solar-day module selects planetary-hora candidates, while the daily engine emits category scores and traceable factors consumed by deterministic and AI interpretations.

**Tech Stack:** TypeScript 5.9, React 19, Vinext, Zod 4, Astronomy Engine 2.1, Vitest 4.

**Spec:** `docs/superpowers/specs/2026-08-28-fortune-engine-v2-design.md`

## Global Constraints

- Keep `astronomy-engine`; add no production dependency.
- Use Lahiri sidereal positions, whole-sign houses, and mean Rahu/Ketu.
- Keep numerology separate from the daily astrology score.
- Persist every rule and calculation version needed for reproducibility.
- Treat all output as reflective guidance, never certainty.
- Preserve legacy stored chart snapshots and the existing database schema.

---

### Task 1: Canonical chart v2 and lunar nodes

**Files:**
- Create: `lib/astrology/nodes.ts`
- Modify: `lib/astrology/types.ts`
- Modify: `lib/astrology/calculate-chart.ts`
- Modify: `lib/astrology/dasha.ts`
- Test: `tests/astrology/chart.test.ts`
- Test: `tests/astrology/dasha.test.ts`

**Interfaces:**
- Produces: `meanLunarNodes(instant): { rahu: number; ketu: number }`
- Produces: `calculateCelestialChart(instant, location, role): CelestialChart`
- Preserves: `calculateChart(input, asOf): ChartSnapshot`

- [ ] Add tests asserting Rahu/Ketu are present, exactly 180 degrees apart, marked mean-node/retrograde, and included in divisional maps. Add a Dasha test asserting the returned Maha/Antar periods contain `at` and invalid out-of-range dates throw.

  ```ts
  expect(angularSeparation(rahu.longitude, ketu.longitude)).toBeCloseTo(180, 10);
  expect(Date.parse(result.mahadasha.start)).toBeLessThanOrEqual(at.valueOf());
  expect(() => vimshottariAt(moon, birth, tooEarly)).toThrow("outside generated Vimshottari range");
  ```
- [ ] Run `npm run test:unit -- tests/astrology/chart.test.ts` and confirm the new assertion fails because the nodes are absent.
- [ ] Implement mean-node longitude, version metadata, generic chart construction, and the natal wrapper.
- [ ] Run the focused test and the complete unit suite; confirm both pass.

### Task 2: Local solar/Panchanga timing

**Files:**
- Create: `lib/astrology/muhurta.ts`
- Modify: `lib/astrology/time.ts`
- Modify: `lib/astrology/panchanga.ts`
- Test: `tests/astrology/muhurta.test.ts`

**Interfaces:**
- Produces: `localDateTimeToUtc(date, time, timezone): Date`
- Produces: `calculatePanchangaAt(instant, timezone): Panchanga`
- Produces: `findMuhurtaWindow(location, targetDate, eventType, notBefore?): MuhurtaWindow | null`

- [ ] Add literal tests for Yangon sunrise/sunset ordering, local labels, deterministic selection, planetary hora metadata, and no overlap with Rahu Kalam.

  ```ts
  const result = findMuhurtaWindow(yangon, "2026-08-28", "work");
  expect(result?.timezone).toBe("Asia/Yangon");
  expect(Date.parse(result!.start)).toBeLessThan(Date.parse(result!.end));
  expect(overlap(result!.start, result!.end, result!.rahuKalam.start, result!.rahuKalam.end)).toBe(false);
  ```
- [ ] Run the focused test and confirm it fails because the module does not exist.
- [ ] Implement generalized local conversion, solar-day search, daylight horas, Rahu Kalam, event affinities, and midpoint Panchanga scoring.
- [ ] Run the focused test and complete unit suite; confirm both pass.

### Task 3: Explainable daily evidence

**Files:**
- Modify: `lib/astrology/types.ts`
- Replace: `lib/astrology/daily-score.ts`
- Modify: `lib/content/daily-copy.ts`
- Modify: `components/suriya/daily-insight.tsx`
- Modify: `components/suriya/lucky-window.tsx`
- Modify: `app/daily/page.tsx`
- Test: `tests/astrology/daily-score.test.ts`
- Test: `tests/daily-copy.test.ts`

**Interfaces:**
- Produces: `DailyInsightData.categories`, `timingStatus`, `window`, and structured `factors`.
- Preserves: bounded overall `score`, `band`, and formatted `favorableWindow` for existing consumers.

- [ ] Add tests proving every score is bounded, the score is reconstructible from category values, all factors have stable IDs and impacts, numerology does not affect scoring, and the selected window uses the profile timezone.

  ```ts
  expect(Object.values(result.categories).every((score) => score >= 20 && score <= 95)).toBe(true);
  expect(result.factors.every((factor) => factor.id && Object.keys(factor.impacts).length > 0)).toBe(true);
  expect(result.window?.timezone).toBe("Asia/Yangon");
  ```
- [ ] Run focused tests and confirm failure against the old three-aspect heuristic.
- [ ] Implement the transit-house, Dasha-activation, Panchanga, and timing factors with named rules and capped impacts.
- [ ] Update presentation components to show categories, factual timing status, and non-certain timing language.
- [ ] Run focused tests and the complete unit suite; confirm both pass.

### Task 4: Technique-aware reading snapshots

**Files:**
- Create: `lib/readings/calculate-reading.ts`
- Create: `lib/readings/snapshot.ts`
- Modify: `lib/schemas/reading.ts`
- Modify: `app/api/readings/route.ts`
- Modify: `app/api/readings/[id]/stream/route.ts`
- Modify: `components/suriya/question-composer.tsx`
- Modify: `components/suriya/reading-sources.tsx`
- Modify: `app/readings/[id]/page.tsx`
- Modify: `lib/readings/deterministic.ts`
- Modify: `lib/ai/prompt.ts`
- Test: `tests/reading-schema.test.ts`
- Test: `tests/reading-calculation.test.ts`
- Test: `tests/deterministic-reading.test.ts`
- Test: `tests/prompt.test.ts`
- Test: `tests/reading-sources.test.ts`

**Interfaces:**
- Produces: `calculateReadingSnapshot(profile, input, now): ReadingSnapshot`
- Produces: `readingChart(snapshot): CelestialChart`
- Produces: `readingTechnique(snapshot, fallback): ReadingTechniqueId`
- Requires Muhurta requests to contain `targetDate` and `eventType`.

- [ ] Add schema tests for the discriminated request variants and 90-day Muhurta horizon.

  ```ts
  expect(readingRequestSchema.safeParse({ kind: "muhurta", question, targetDate, eventType: "work" }).success).toBe(true);
  expect(readingRequestSchema.safeParse({ kind: "muhurta", question }).success).toBe(false);
  ```

- [ ] Add calculation tests proving Janma uses the birth instant, Prashna uses submission time, and Muhurta uses its selected interval.

  ```ts
  expect(calculateReadingSnapshot(profile, { kind: "prashna", question }, now).chart.instant).toBe(now.toISOString());
  expect(muhurta.context.window?.start).toBe(muhurta.chart.instant);
  ```
- [ ] Run focused tests and confirm the failures identify the shared natal-engine behavior.
- [ ] Implement the reading wrapper, compatibility accessors, and technique calculator.
- [ ] Wire the API, conditional composer inputs, page chart, source cards, deterministic fallback, and technique-specific prompt policy.
- [ ] Run all focused tests and the complete unit suite; confirm both pass.

### Task 5: Self-review and release verification

**Files:**
- Modify: only files implicated by review findings
- Review: `docs/superpowers/specs/2026-08-28-fortune-engine-v2-design.md`
- Review: `docs/superpowers/plans/2026-08-28-fortune-engine-v2.md`

**Interfaces:**
- Consumes: all prior task outputs.
- Produces: a reviewed, buildable Fortune Engine v2.

- [ ] Compare the diff against every spec requirement and list any gap.
- [ ] Inspect all new non-null assertions, date boundaries, snapshot compatibility branches, score caps, and user-facing certainty language.
- [ ] For each correctness finding, add a failing regression test before applying the fix.
- [ ] Run `npm run test:unit`, `npm run lint`, `npm run build`, and `node --test tests/rendered-html.test.mjs`.
- [ ] Inspect `git diff --check` and `git status --short`; leave the user's existing untracked design/image files untouched.
