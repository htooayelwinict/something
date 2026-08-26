# Suriya MVP Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build and publish a Burmese-first, installable Suriya astrology MVP with the five supplied mobile designs, deterministic Vedic calculations, platform sign-in, saved readings, Gemini streaming, and preview-only Tarot specialists.

**Architecture:** Use the Sites Vinext starter as a modular App Router application deployed as a Cloudflare Worker. Public product surfaces render from typed seed data; authenticated writes use dispatch-owned SIWC identity and ownership-safe D1 repositories. A pure TypeScript calculation core feeds an isolated AI provider so astrology and model behavior can be tested independently.

**Tech Stack:** Vinext, React 19, TypeScript 5.9, Tailwind CSS 4, Cloudflare D1, Drizzle, Astronomy Engine, Zod, Lucide React, Gemini, Vitest, Node test runner

**Spec:** `docs/superpowers/specs/2026-08-26-suriya-mvp-design.md`

## Global Constraints

- Primary viewport is exactly 390×844; layouts must also work from 320px through desktop widths.
- Burmese is the only launch language; organize user-facing copy in typed content modules.
- Noto Sans Myanmar is primary and Inter is supporting Latin copy.
- Product colors come from the Pencil variables: `#F4F2EF`, `#1A1A1A`, `#4A4A4A`, `#C8B496`, `#9B825B`, and `#384F84`.
- Private data is network-only and must never be cached by the PWA.
- Every user-owned D1 query must include the authenticated Sites user ID.
- The canonical chart engine is deterministic and versioned.
- AI output is untrusted plain text and must not render arbitrary HTML.
- Tarot payment, booking, chat, audio, and video remain clearly labeled preview states.
- Keep Cloudflare Worker-compatible ESM output and the starter `sites()` Vite plugin.

---

### Task 1: Product Foundation and Test Harness

**Files:**
- Modify: `package.json`
- Modify: `package-lock.json`
- Modify: `.gitignore`
- Modify: `.openai/hosting.json`
- Create: `vitest.config.ts`
- Modify: `tests/rendered-html.test.mjs`

**Interfaces:**
- Produces: `npm run test:unit`, a `DB` D1 binding declaration, and the dependency floor used by every later task.

- [ ] **Step 1: Replace the starter render assertions** with checks for Burmese site metadata, a main landmark, and the absence of `codex-preview` and `react-loading-skeleton`.
- [ ] **Step 2: Run `npm test`** and verify it fails against the starter skeleton.
- [ ] **Step 3: Install runtime dependencies** `astronomy-engine`, `zod`, `lucide-react`, and `@google/genai`; install `vitest` as a development dependency.
- [ ] **Step 4: Add scripts** `test:unit: vitest run`, `test:watch: vitest`, and update `test` to run unit tests, build, and rendered HTML tests.
- [ ] **Step 5: Set `.openai/hosting.json` to `{ "d1": "DB", "r2": null }`** and ignore local `.wrangler`, `.dev.vars`, and generated build output.
- [ ] **Step 6: Commit** with `chore: prepare Suriya application foundation`.

### Task 2: Design Tokens, Metadata, and Shared Shell

**Files:**
- Delete: `app/_sites-preview/SkeletonPreview.tsx`
- Delete: `app/_sites-preview/preview.css`
- Delete: `app/page.tsx`
- Modify: `app/layout.tsx`
- Modify: `app/globals.css`
- Create: `app/manifest.ts`
- Create: `app/(app)/layout.tsx`
- Create: `app/(app)/page.tsx`
- Create: `components/suriya/app-shell.tsx`
- Create: `components/suriya/bottom-nav.tsx`
- Create: `components/suriya/brand.tsx`
- Create: `lib/content/navigation.ts`

**Interfaces:**
- Produces: `AppShell({ children, title?, eyebrow? })`, `BottomNav()`, shared CSS utility classes, and typed navigation items.

- [ ] **Step 1: Add a failing rendered HTML assertion** for `<html lang="my">`, title `သုရိယ`, and the Burmese home heading.
- [ ] **Step 2: Run `npm test`** and confirm failure.
- [ ] **Step 3: Implement the metadata and manifest** with standalone display, theme/background colors, and site-specific descriptions.
- [ ] **Step 4: Implement the token system** with color, type, spacing, radius, shadow, focus, and reduced-motion rules from the Pencil file.
- [ ] **Step 5: Implement the shared shell** with accessible navigation, a mobile bottom bar, desktop containment, and safe-area padding.
- [ ] **Step 6: Implement the home route skeleton** with real Burmese headings instead of loading UI.
- [ ] **Step 7: Remove `react-loading-skeleton`** and refresh the lockfile.
- [ ] **Step 8: Run `npm test`** and verify the new shell passes.
- [ ] **Step 9: Commit** with `feat: add Suriya design system and shell`.

### Task 3: Five Pencil Screens as Functional Routes

**Files:**
- Create: `app/(app)/daily/page.tsx`
- Create: `app/(app)/ask/page.tsx`
- Create: `app/(app)/tarot/page.tsx`
- Create: `app/login/page.tsx`
- Modify: `app/(app)/page.tsx`
- Create: `components/suriya/daily-insight.tsx`
- Create: `components/suriya/question-composer.tsx`
- Create: `components/suriya/technique-card.tsx`
- Create: `components/suriya/tarot-specialist-card.tsx`
- Create: `lib/content/demo.ts`
- Test: `tests/content.test.ts`

**Interfaces:**
- Produces: `DailyInsight`, `QuestionComposer`, `TechniqueCard`, `TarotSpecialistCard`, `demoDailyInsight`, and `demoSpecialists`.

- [ ] **Step 1: Write failing unit tests** that require three reading techniques, two Tarot specialists, a daily score in `0..100`, and Burmese product copy.
- [ ] **Step 2: Run `npm run test:unit`** and confirm missing-module failures.
- [ ] **Step 3: Implement typed demo content** without fetching or persistence.
- [ ] **Step 4: Implement Home and Daily** from frames `GjQvB` and `A2MFRo`, including the favorable time card, energy score, and human-oracle callout.
- [ ] **Step 5: Implement Ask** from frame `F5bAt` with a controlled question field, technique selection, character limit, disabled state, and accessible labels.
- [ ] **Step 6: Implement Tarot** from frame `Qd1ip` with two specialist cards and a preview modal/banner that never implies a booking occurred.
- [ ] **Step 7: Implement Login** from frame `y8UXU` with the platform-owned ChatGPT sign-in link and accurate privacy copy.
- [ ] **Step 8: Run unit tests and `npm run build`**; fix only actual failures.
- [ ] **Step 9: Commit** with `feat: implement Suriya core screens`.

### Task 4: D1 Schema and Ownership-Safe Repositories

**Files:**
- Modify: `db/schema.ts`
- Modify: `db/index.ts`
- Create: `db/repositories/profiles.ts`
- Create: `db/repositories/readings.ts`
- Create: `db/repositories/specialists.ts`
- Create: `db/initialize.ts`
- Create: `lib/ids.ts`
- Create: generated files under `drizzle/`
- Test: `tests/ids.test.ts`

**Interfaces:**
- Produces: `newId(prefix): string`, `upsertProfile(user)`, `getBirthProfile(userId)`, `saveBirthProfile(userId,input)`, `createReading(userId,input)`, `getReading(userId,id)`, `listReadings(userId)`, and `listSpecialists()`.

- [ ] **Step 1: Write failing tests** for sortable prefixed IDs and invalid prefix rejection.
- [ ] **Step 2: Run unit tests** and confirm failure.
- [ ] **Step 3: Define SQLite tables** `profiles`, `birth_profiles`, `readings`, and `tarot_specialists` with timestamps and ownership indexes matching actual queries.
- [ ] **Step 4: Implement `newId`** using `crypto.randomUUID()` and an allowlisted prefix.
- [ ] **Step 5: Implement repository functions** so all user-owned reads and mutations accept `userId` as a required first argument and include it in the predicate.
- [ ] **Step 6: Implement idempotent local initialization** using one prepared statement per table/index and `DB.batch()`.
- [ ] **Step 7: Generate migrations** with `npm run db:generate`, inspect the SQL, and run `PRAGMA optimize` after index creation.
- [ ] **Step 8: Run tests and build**.
- [ ] **Step 9: Commit** with `feat: add private D1 persistence`.

### Task 5: SIWC Identity, Onboarding, and Profile

**Files:**
- Create: `app/(app)/onboarding/page.tsx`
- Create: `app/(app)/profile/page.tsx`
- Create: `app/api/profile/route.ts`
- Create: `components/suriya/birth-profile-form.tsx`
- Create: `lib/schemas/profile.ts`
- Modify: `app/chatgpt-auth.ts` only if tests reveal a compatibility issue
- Test: `tests/profile-schema.test.ts`

**Interfaces:**
- Produces: `birthProfileSchema`, `BirthProfileInput`, and authenticated `GET`/`PUT /api/profile`.

- [ ] **Step 1: Write failing schema tests** for valid Yangon data, invalid coordinates, invalid IANA zones, future birth dates, and missing exact time.
- [ ] **Step 2: Run unit tests** and confirm failure.
- [ ] **Step 3: Implement the shared Zod schema** and normalize whitespace without altering Burmese names.
- [ ] **Step 4: Implement the onboarding/profile form** with server errors, accessible grouping, and no browser persistence of birth data.
- [ ] **Step 5: Implement authenticated profile endpoints** using `getChatGPTUser()` and repository ownership checks; return `401` when identity is absent.
- [ ] **Step 6: Implement profile sign-in/sign-out actions** using only dispatch-owned paths.
- [ ] **Step 7: Run tests and build**.
- [ ] **Step 8: Commit** with `feat: add birth profile onboarding`.

### Task 6: Deterministic Astrology Core

**Files:**
- Create: `lib/astrology/types.ts`
- Create: `lib/astrology/angles.ts`
- Create: `lib/astrology/ayanamsa.ts`
- Create: `lib/astrology/panchanga.ts`
- Create: `lib/astrology/dasha.ts`
- Create: `lib/astrology/divisional.ts`
- Create: `lib/astrology/calculate-chart.ts`
- Create: `lib/astrology/daily-score.ts`
- Test: `tests/astrology/*.test.ts`

**Interfaces:**
- Consumes: `BirthProfileInput`.
- Produces: `calculateChart(input, instant): ChartSnapshot`, `calculateDailyInsight(snapshot,date): DailyInsightData`, and calculation version `suriya-vedic-1`.

- [ ] **Step 1: Write failing angle and divisional tests** for normalization, sign indexes, D9, and D10 boundary cases.
- [ ] **Step 2: Implement minimal angle/divisional functions** and make those tests pass.
- [ ] **Step 3: Write failing Panchanga tests** for Tithi, Nakshatra, Pada, Yoga, and Karana boundaries.
- [ ] **Step 4: Implement Panchanga functions** as pure degree arithmetic and make tests pass.
- [ ] **Step 5: Write failing Vimshottari tests** for birth balance and period containment.
- [ ] **Step 6: Implement the 120-year sequence** with UTC-safe interval arithmetic and make tests pass.
- [ ] **Step 7: Add golden chart fixtures** for Yangon births already observed in the reference app, including explicit numeric tolerances.
- [ ] **Step 8: Implement `calculateChart`** using Astronomy Engine positions, Lahiri sidereal conversion, ascendant, whole-sign houses, retrograde flags, D1/D9/D10, Panchanga, and current Dasha.
- [ ] **Step 9: Implement the bounded daily score** from versioned, documented factors; never use random values.
- [ ] **Step 10: Run the complete astrology suite twice** and verify deterministic output.
- [ ] **Step 11: Commit** with `feat: add deterministic Vedic calculations`.

### Task 7: Daily Guidance and Accessible Charts

**Files:**
- Modify: `app/(app)/page.tsx`
- Modify: `app/(app)/daily/page.tsx`
- Create: `components/suriya/chart-grid.tsx`
- Create: `components/suriya/south-indian-chart.tsx`
- Create: `lib/content/daily-copy.ts`
- Test: `tests/daily-copy.test.ts`

**Interfaces:**
- Consumes: `ChartSnapshot` and `DailyInsightData`.
- Produces: `SouthIndianChart({ title, placements })` and deterministic Burmese daily summaries.

- [ ] **Step 1: Write failing tests** that map score bands and chart factors to bounded Burmese guidance keys.
- [ ] **Step 2: Implement copy selection** without AI and make tests pass.
- [ ] **Step 3: Implement accessible CSS-grid charts** with textual placement lists; do not author decorative SVG illustrations.
- [ ] **Step 4: Connect Home and Daily** to authenticated profile calculations when available and demo data otherwise.
- [ ] **Step 5: Run tests and build**.
- [ ] **Step 6: Commit** with `feat: connect personalized daily guidance`.

### Task 8: Reading Creation, Gemini Streaming, and History

**Files:**
- Create: `lib/ai/provider.ts`
- Create: `lib/ai/gemini.ts`
- Create: `lib/ai/fake.ts`
- Create: `lib/ai/prompt.ts`
- Create: `lib/schemas/reading.ts`
- Create: `app/api/readings/route.ts`
- Create: `app/api/readings/[id]/stream/route.ts`
- Create: `app/(app)/readings/page.tsx`
- Create: `app/(app)/readings/[id]/page.tsx`
- Create: `components/suriya/streaming-reading.tsx`
- Modify: `components/suriya/question-composer.tsx`
- Test: `tests/prompt.test.ts`
- Test: `tests/reading-schema.test.ts`

**Interfaces:**
- Produces: `AiProvider.stream(request): AsyncIterable<string>`, `buildReadingPrompt(snapshot,input): string`, `POST /api/readings`, and `GET /api/readings/:id/stream`.

- [ ] **Step 1: Write failing prompt tests** for Burmese-only output policy, delimited raw questions, length bounds, and exclusion of unsupported claims.
- [ ] **Step 2: Implement prompt construction** and make tests pass.
- [ ] **Step 3: Implement the provider interface and fake provider** for deterministic local/test streams.
- [ ] **Step 4: Implement Gemini streaming** with server-only credentials, configured model name, abort propagation, and safe provider error mapping.
- [ ] **Step 5: Implement reading creation**: authenticate, validate, load the user's profile, calculate the chart once, store a pending reading, and return its ID.
- [ ] **Step 6: Implement the stream endpoint**: verify ownership, stream plain text, save only the final response, and persist a safe failure code on error.
- [ ] **Step 7: Connect Ask to the create/stream flow** with visible calculating, generating, retry, and completed states.
- [ ] **Step 8: Implement private History and Result routes** with empty and failed states.
- [ ] **Step 9: Run tests and build**.
- [ ] **Step 10: Commit** with `feat: stream and save astrology readings`.

### Task 9: PWA Assets, Accessibility, and Social Preview

**Files:**
- Modify: `app/layout.tsx`
- Modify: `app/manifest.ts`
- Create: `public/icon-192.png`
- Create: `public/icon-512.png`
- Create: `public/og.png`
- Modify: `public/favicon.svg`
- Modify: `README.md`
- Test: `tests/rendered-html.test.mjs`

**Interfaces:**
- Produces: installable metadata, one validated social card, and complete setup/deployment documentation.

- [ ] **Step 1: Audit every interactive element** for semantic role, accessible name, focus indication, touch size, and keyboard operation.
- [ ] **Step 2: Add final PWA icons and manifest entries**; cache only public/static assets.
- [ ] **Step 3: Generate exactly one Suriya social preview** from the frozen brand brief, inspect its Burmese/English text, and retry once only if unusable.
- [ ] **Step 4: Add absolute Open Graph and X metadata** derived from the incoming host; omit image metadata if the generated card cannot be validated.
- [ ] **Step 5: Replace the README** with product purpose, local setup, environment keys, D1 migrations, tests, privacy boundaries, and deployment notes.
- [ ] **Step 6: Update rendered HTML tests** for metadata, landmarks, Burmese copy, and absence of starter artifacts.
- [ ] **Step 7: Run `npm run lint`, `npm test`, and `npm run build`**.
- [ ] **Step 8: Commit** with `feat: finish installable Suriya MVP`.

### Task 10: Hosting and Final Verification

**Files:**
- Inspect: `dist/.openai/hosting.json`
- Inspect: `dist/.openai/drizzle/`
- Modify only if needed: `.env.example`

**Interfaces:**
- Consumes: successful production build and generated D1 migrations.
- Produces: deployed Sites URL and verified hosted capabilities.

- [ ] **Step 1: Run a clean production build** while the retained development server remains running.
- [ ] **Step 2: Inspect packaged hosting metadata and migration output** for `DB`, no R2, and the expected schema.
- [ ] **Step 3: Publish through Sites hosting** and configure only required runtime values.
- [ ] **Step 4: Verify the hosted public shell, sign-in entry, D1-backed profile/readings, and Gemini failure fallback without exposing secrets.**
- [ ] **Step 5: Stop the retained development server** after hosting succeeds.
- [ ] **Step 6: Commit any final non-secret configuration correction** with `fix: finalize hosted Suriya configuration`.
