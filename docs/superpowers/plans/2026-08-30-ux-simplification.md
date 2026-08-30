# Suriya UX Simplification Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Simplify Suriya into a Today → Ask → human Tarot journey while keeping Chart as accessible supporting evidence.

**Architecture:** Keep every route and backend contract. Change shared navigation and route composition, use native disclosure elements for dense evidence, and standardize guest entry states. Validate observable server-rendered hierarchy first, then verify responsive layout in Playwright.

**Tech Stack:** Next.js-compatible Vinext RSC, React 19, TypeScript, CSS, Vitest, Node worker-render tests, Playwright MCP, Sites hosting.

**Spec:** `docs/superpowers/specs/2026-08-30-ux-simplification-design.md`

**Implementation status:** UX and OpenRouter work are complete and independently approved.

## Global Constraints

- Do not change astrology calculations, prompts, persistence, schemas, migrations, authentication mechanics, quota behavior, or booking API behavior.
- Preserve `untitled.pen`, `zartar-home-desktop.png`, and `zartar-home-mobile.png` unchanged.
- Preserve the Night Observatory visual system.
- Use native links and native `<details>`; do not add a dependency or client-only navigation drawer.
- Write and observe a failing test before each production behavior change.
- Publish through the existing Sites project only after Git and all verification gates pass.

---

### Task 1: Primary navigation and footer hierarchy

**Files:**
- Modify: `tests/navigation.test.ts`
- Modify: `lib/content/navigation.ts`
- Modify: `components/suriya/bottom-nav.tsx`
- Modify: `components/suriya/site-footer.tsx`
- Modify: `app/globals.css`

**Interfaces:**
- Consumes: existing `navigationItems` and `topNavigationLinks` arrays.
- Produces: four mobile items (`/`, `/ask`, `/tarot`, `/profile`) and three desktop text links (`/`, `/ask`, `/tarot`).

- [ ] **Step 1: Write the failing navigation contract**

```ts
expect(navigationItems.map((item) => item.href)).toEqual(["/", "/ask", "/tarot", "/profile"]);
expect(topNavigationLinks.map((item) => item.href)).toEqual(["/", "/ask", "/tarot"]);
expect(navigationItems.some((item) => "featured" in item)).toBe(false);
```

- [ ] **Step 2: Run `npm run test:unit -- tests/navigation.test.ts` and verify the old five/six-item arrays fail the literals.**
- [ ] **Step 3: Update navigation arrays, remove the raised Ask branch/icon sizing, make the dock four equal items, hide the mobile Profile chip, and limit the footer to secondary discovery links.**
- [ ] **Step 4: Re-run `npm run test:unit -- tests/navigation.test.ts` and verify it passes.**

### Task 2: Home orientation hierarchy

**Files:**
- Modify: `tests/rendered-html.test.mjs`
- Modify: `app/page.tsx`
- Modify: `components/suriya/daily-brief.tsx`
- Modify: `components/suriya/route-cards.tsx`
- Modify: `app/globals.css`

**Interfaces:**
- Consumes: `DailyBriefView`, daily personalization state, and existing `/daily`, `/ask`, `/tarot`, `/chart`, `/profile` routes.
- Produces: one primary Daily CTA, two secondary task cards, and an explicit guest demo note.

- [ ] **Step 1: Add rendered-HTML assertions that guest Home has no `identity-rail`, has one `primary-button`, has exactly two `route-card` elements, has no `/daily/week` or `/daily/month`, and contains the demo personalization message.**
- [ ] **Step 2: Run `npm run build && node --test tests/rendered-html.test.mjs` and verify Home fails for the current duplicate links, rail, and card count.**
- [ ] **Step 3: Render the identity rail only for personalized users, replace the heading copy, convert Daily score digits with `toBurmeseDigits`, make the full Daily link the sole primary CTA, reduce RouteCards to Ask and Tarot, and add a quiet Chart link.**
- [ ] **Step 4: Rebuild and re-run rendered HTML tests until the new Home contract passes.**

### Task 3: Daily progressive disclosure

**Files:**
- Modify: `tests/rendered-html.test.mjs`
- Modify: `app/daily/page.tsx`
- Modify: `components/suriya/daily-insight.tsx`
- Modify: `components/suriya/dial.tsx`
- Modify: `components/suriya/cosmic-metric.tsx`
- Modify: `app/globals.css`

**Interfaces:**
- Consumes: the existing daily presentation, `toBurmeseDigits`, `DailyInsight`, `LuckyWindow`, and `PanchangaStrip`.
- Produces: `daily-evidence-disclosure` and `daily-data-disclosure` native detail panels.

- [ ] **Step 1: Add worker-render assertions for both disclosure class names, absence of `metrics-grid`, absence of `CAREER|RELATIONSHIPS|FOCUS|ENERGY|CAUTION`, Burmese score text, and a primary `/ask` action.**
- [ ] **Step 2: Run the worker build/test and verify those assertions fail against the expanded Daily page.**
- [ ] **Step 3: Remove duplicated metric cards, wrap factors in the evidence disclosure, wrap category/Panchanga data in the data disclosure, remove category English eyebrows, convert score/dial/category values to Burmese digits, hide the guest rail, and switch the primary action to Ask.**
- [ ] **Step 4: Rebuild and verify the Daily worker assertions pass while existing calculation content remains in the HTML.**

### Task 4: Ask, Chart, guest entry states, and repeated upsells

**Files:**
- Modify: `tests/rendered-html.test.mjs`
- Modify: `app/ask/page.tsx`
- Modify: `app/chart/page.tsx`
- Modify: `app/profile/page.tsx`
- Modify: `app/readings/page.tsx`
- Modify: `app/readings/[id]/page.tsx`
- Modify: `app/login/page.tsx`
- Modify: `app/today/page.tsx`
- Modify: `app/rasi/[slug]/page.tsx`
- Modify: `components/suriya/period-page.tsx`
- Modify: `components/suriya/identity-rail.tsx`
- Modify: `components/suriya/technique-card.tsx`
- Modify: `app/globals.css`

**Interfaces:**
- Consumes: existing auth URLs, quota branch, Chart components, and SEO page actions.
- Produces: `ask-method-disclosure`, `chart-data-disclosure`, standardized guest sign-in copy, and fewer inline upsells.

- [ ] **Step 1: Add worker-render assertions that normal Ask has a method disclosure and no inline upsell, Chart has a data disclosure and `/ask` primary CTA, `/today`, `/rasi/mesha`, and guest `/readings` have no upsell, and guest walls contain the benefit/action/back pattern.**
- [ ] **Step 2: Build and run rendered tests to observe failures for the current aside, open chart data, repeated upsells, and old sign-in language.**
- [ ] **Step 3: Move the Ask explainer into a details element, remove its normal upsell, wrap Chart placements/Dasha in details, add the Chart Ask CTA, remove the named route upsells, update guest language, replace user-facing `Cosmic ID`, add selected-technique screen-reader copy, and add mobile form clearance.**
- [ ] **Step 4: Build and run rendered tests until the guest and route hierarchy contract passes.**

### Task 5: Responsive review and production verification

**Files:**
- Modify when a failing visual check requires it: `app/globals.css` and the component responsible for that check.
- Preserve: user-owned untracked files named in Global Constraints.

**Interfaces:**
- Consumes: locally built Vinext application and the written acceptance criteria.
- Produces: verified responsive source, a reviewed Git commit, and a Sites deployment.

- [ ] **Step 1: Run `npm run test:unit`, `npm run lint`, `npm run build`, and `node --test tests/rendered-html.test.mjs`; record exact counts and exit codes.**
- [ ] **Step 2: Start the local app and inspect `/`, `/daily`, `/chart`, `/ask`, `/tarot`, and `/tarot/thiri` at 390×844 and 1280×900. For each route assert `scrollWidth <= innerWidth`, capture errors, and inspect task hierarchy. Assert Home ≤ 1,300 px and Daily ≤ 3,000 px at 390 px.**
- [ ] **Step 3: For `/ask` and `/tarot/thiri`, compare the submit control and `.bottom-nav` rectangles at the document bottom and verify they do not intersect.**
- [ ] **Step 4: Send the final diff and spec to the existing Claude terminal for read-only review. Fix each valid Critical or Important issue with a new failing test, then repeat Steps 1–3.**
- [ ] **Step 5: Review `git diff --check`, `git status --short`, and the exact diff; commit only intended source/docs/tests and leave the three user files untouched.**
- [ ] **Step 6: Push `main`, push the identical commit to the existing Sites source repository, package the site, save a Sites version using that pushed commit SHA, deploy the public version, poll to `succeeded`, and smoke-test the live routes at both widths.**

### Task 6: Planned OpenRouter runtime compatibility

**Files:**
- Add: `lib/ai/openrouter.ts`
- Add: `tests/openrouter.test.ts`
- Modify: `lib/ai/index.ts`
- Modify: `app/daily/page.tsx`
- Modify: `components/suriya/period-page.tsx`
- Modify: `.env.example`
- Modify: `README.md`

- [x] **Step 1: Write failing provider tests for split SSE chunks, endpoint normalization, 429 mapping, provider selection, Gemini precedence, and deterministic fallback.**
- [x] **Step 2: Observe the missing-adapter failure.**
- [x] **Step 3: Implement the server-only OpenRouter adapter and select it from the supplied environment variables.**
- [x] **Step 4: Expose the configured interpretation mode to live period-reading surfaces and document local/hosted configuration.**
- [ ] **Step 5: Verify a real local stream without logging or committing secret values, then verify the production runtime variable names before deployment.**
