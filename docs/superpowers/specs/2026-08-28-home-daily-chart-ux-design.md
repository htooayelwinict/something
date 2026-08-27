# Suriya Home, Daily, and Chart UX Redesign

Date: 2026-08-28
Status: Approved by the user after independent Claude review

## Objective

Give the three primary astrology surfaces distinct jobs and make the natal chart the most visually compelling, understandable part of the product. Preserve the existing Jyotish calculations, demo/profile behavior, public routing, warm cosmic visual system, and honest source disclosure.

## Page Responsibilities

### Home (`/`)

Home is a short orientation and routing surface. A user should understand today's headline and choose their next destination within ten seconds.

It contains:

- A greeting and personalized/demo status.
- A compact `DailyBrief` with one score, one headline, and the favorable-window summary.
- Three clear destinations: Daily, Ask Suriya, and Birth Chart.
- Recent readings when available.
- A compact identity summary rather than repeated numerology cards.

It does not contain the expanded daily analysis, calculation-method section, factor list, category grid, or ritual card.

### Daily (`/daily`)

Daily is the actionable, time-sensitive reading. It explains what the user should pay attention to today and why.

It contains:

- The expanded daily insight and score.
- Five category metrics with Burmese-first labels.
- Calculated factors grouped by source.
- The favorable time window, sunrise/sunset context, and Rahu Kalam when available.
- A Panchanga summary.
- Calls to open the birth chart or ask a personal question.
- A compact method footnote rather than a large repeated method section.

### Birth Chart (`/chart`)

`/chart` is the canonical natal-chart route. `/daily/details` remains as a compatibility redirect. The page title is `သင့်မွေးဇာတာ`; it must not repeat the Daily hero.

The D1 chart is the visual hero and the source of truth. Supporting sections explain the chart, then connect it to the current daily calculation.

## Chart Experience

### Information order

1. Chart heading with birth date, local time, birthplace, demo/personalized state, and calculation caption.
2. Key facts: Lagna, Moon sign/nakshatra, and current Maha/Antardasha.
3. Large D1 South Indian chart.
4. Accessible placement list.
5. Dasha timeline.
6. A concise “how today touches this chart” section using the same transit and dasha factors as Daily.
7. D9 and D10 divisional charts in progressively disclosed panels.
8. Panchanga-at-birth and calculation-method footnotes.
9. Safety guidance.

### Chart semantics and visuals

- Every chart cell identifies the sign in Burmese, with English as supporting text.
- Planet placements use stable text glyphs or abbreviations, degrees, and a retrograde marker.
- House numbers are calculated relative to the ascendant.
- The ascendant cell receives a meaningful gold treatment and a visible `လဂ်` label.
- Empty houses are left visually quiet; no dash placeholders.
- The center identifies the division and relevant birth context.
- D1 is large and primary; D9 and D10 are compact and collapsed on mobile.
- A semantic placement list backs the visual chart for keyboard and screen-reader users.
- Existing paper, line, plum, gold, and green tokens remain the only palette.

Interactive house selection and a live transit overlay are polish work. The initial redesign must establish stable chart semantics and layout first; interaction may be added only if it remains server-render friendly and does not duplicate astrology calculations in the UI.

## Shared Components

- Add `DailyBrief` for Home; do not reuse `DailyInsight` above the fold across routes.
- Keep `DailyInsight` expanded on Daily only.
- Replace repeated `MethodSummary` sections with `MethodFootnote` on Daily and Chart.
- Replace `ChartGrid` as the chart-page composition with focused components: `ChartKeyFacts`, a reusable `SouthIndianChart`, `PlacementList`, `DashaTimeline`, and `DivisionalCharts`.
- Reuse the chart primitives in saved reading detail where compatible.
- Add `/chart` to shared navigation and name `/` as `ပင်မ` consistently.

## Typography and Accessibility

- Burmese body and label text must render at 12 CSS pixels or larger with generous line height.
- Burmese is the primary label language; English uppercase is an eyebrow or secondary annotation.
- Interactive targets remain at least 44 by 44 CSS pixels.
- Muted text on tinted cards must meet WCAG AA contrast.
- The chart has an accessible name and references the detailed placement list.
- Mobile layouts from 320–430px have no horizontal overflow; desktop uses a sticky chart beside facts and placements where space permits.
- Motion remains optional and respects `prefers-reduced-motion`.

## Data Boundaries

The UI consumes the existing `CelestialChart` and daily presentation data. It does not recalculate planetary positions. Sign labels come from the astrology type definitions, daily factors come from `getDailyExperience`, and dasha dates come from the stored chart snapshot. Missing optional values render neutral explanatory copy rather than fabricated data.

## Compatibility and Risks

- Keep `/daily/details` as a redirect because existing links and bookmarks may use it.
- Update saved-reading chart composition without changing stored snapshot schemas.
- Use text or inline-vector fallbacks for planetary symbols so Android font coverage cannot turn the chart into emoji or missing glyphs.
- Update rendered-HTML assertions alongside each route change.
- Larger Burmese type may change metric wrapping; mobile metrics use two columns or one column rather than compressing text.
- The chart-to-daily connection must use existing factors so the two surfaces cannot disagree.

## Acceptance Criteria

- Home, Daily, and Chart have distinct first viewports and distinct user jobs.
- Home contains no expanded Daily hero or full method section.
- Daily contains the full score, category, factor, timing, and Panchanga experience.
- `/chart` renders a prominent D1 chart with 12 Burmese sign labels, house numbers, ascendant emphasis, planet degrees, and no dash placeholders.
- `/daily/details` redirects to `/chart`.
- D9/D10 are progressively disclosed on mobile and never leave an orphaned third chart on desktop.
- No Burmese interface text computes below 12px, and tinted-card text reaches AA contrast.
- Unit tests, lint, production build, rendered HTML tests, and mobile/desktop browser checks pass.
