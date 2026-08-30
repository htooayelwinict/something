# Suriya UX Simplification Design

**Date:** 2026-08-30

**Status:** Approved by the user's standing instruction to self-review, choose the recommendation, implement, and continue without another question.

## Objective

Make Suriya understandable within one mobile viewport without changing the fortune engine, route contracts, database, authentication, or Tarot booking flow. The first-time mental model is:

1. Read today's guidance.
2. Ask a personal question.
3. Book a human Tarot conversation when human judgment is wanted.

The birth chart remains available as the evidence and context behind those tasks, not as a fourth equal product.

## Evidence

The live product was inspected at 390 px and 1280 px on `/`, `/daily`, `/chart`, `/ask`, and `/tarot`. An independent Claude audit inspected twelve routes at both widths and the current source.

- Mobile Home exposes top navigation, a five-item fixed dock, four portal cards, profile links, and seven footer links around only 76 words of core content.
- Home and Daily lead with the same score, title, and sky state, so the destination does not feel meaningfully different from its preview.
- Mobile Daily is over 4,000 px tall and presents calculations, interpretation, category scores, timing, Panchanga, two next actions, and a Tarot upsell at the same hierarchy.
- Signed-out users see a fake `Suriya Guest` birth identity and numerology as if it were their own context.
- Ask is a real user task, while Chart is reference material. The current navigation gives both Chart and duplicated discovery/SEO pages more prominence than the task hierarchy warrants.
- English and romanized Sanskrit labels compete with Burmese copy, and score digits are inconsistent.

## Considered Approaches

### A. One page a day

Make Home equal Daily and reduce the product to Today, Chart, and Tarot. This is the smallest route model, but it hides Ask inside Chart and weakens the main interactive task.

### B. Today plus a More drawer

Keep only Today and Tarot visible and place everything else in a More sheet. This gives the calmest first view, but adds a new interaction pattern and makes Ask unnecessarily hard to discover.

### C. Three-task story with supporting Chart — selected

Keep all routes, but expose only Today, Ask, Tarot, and Profile in mobile navigation. Home previews Today, then offers Ask and Tarot. Chart appears contextually from Home, Daily, Profile, and readings. Technical evidence is rendered in the document but collapsed until requested.

This is the best balance because it fixes information hierarchy without changing engines, persistence, URLs, or SEO leaf pages.

## Information Architecture

### Primary navigation

- `/` — `ယနေ့`
- `/ask` — `မေးရန်`
- `/tarot` — `Tarot`
- `/profile` — `ကိုယ်ရေး`

Mobile uses one four-item bottom dock. It has no raised center action. The mobile header shows Brand only, avoiding a duplicate Profile action. Desktop uses three text links (Today, Ask, Tarot) plus the Profile chip. The Brand remains the route home.

### Secondary discovery

The footer is the only global place for the full Daily report, Chart, saved readings, Panchanga, and the twelve zodiac pages. It must not repeat all primary navigation.

### Home

Home is an orientation layer, not a second Daily report.

- One short heading explains the three tasks.
- One Daily preview has one primary CTA to `/daily`.
- Weekly/monthly links and the duplicate Daily portal card are removed.
- Two secondary cards link to Ask and Tarot.
- Chart is a quiet contextual text link.
- A guest sees an explicit demo note and a profile link, never a fake identity rail.
- A personalized user may retain the identity rail on desktop.

### Daily

Daily is the complete interpretation.

- Keep period tabs, headline/score, streamed reading, timing, one next-action row, Tarot upsell, and method note visible.
- Remove the two metric cards that repeat Moon and timing.
- Put score factors in one closed native `<details>`.
- Put category scores and Panchanga in one closed native `<details>`.
- Use one primary action to Ask and a secondary Chart link.
- Hide the demo identity rail for guests.
- Use Burmese digits for user-facing scores and remove English category eyebrows.
- Keep model-written readings compact by showing a semantic text preview with an explicit expand/collapse control; the complete text is rendered only while expanded.

### Ask

- Keep the question composer as the focus.
- Put calculation-method explanation in a native `<details>` after the form.
- Tell guests above the form that sign-in is required and that three questions per day are free.
- Preserve an anonymous draft in tab-scoped `sessionStorage` across the sign-in round trip; do not place the question in a URL.
- Remove the generic inline Tarot upsell. Retain the quota-exhausted Tarot alternative.
- Hide the demo identity rail for guests.

### Chart

- Keep the D1 chart and three key facts visible.
- Put the full placement table and Dasha timeline in one native `<details>`.
- Add one primary Ask CTA after the chart block.
- Hide the demo identity rail for guests while retaining explicit `နမူနာ` copy.

### Guest and sign-in language

Use one pattern on Profile, Readings, and locked period pages:

1. State the benefit: `သင့်မွေးချိန်အတိုင်း တွက်ချက်ပေးမည်` or the route-specific equivalent.
2. Label the action `အကောင့်ဖွင့်/ဝင်ရောက်မည် (ChatGPT)`.
3. Offer `ယနေ့ဖတ်စာသို့ ပြန်သွားရန်`.

Replace `Cosmic ID` in user-facing UI with `သင့်ဇာတာ အချက်အလက်`.

### SEO leaf pages

`/today` and `/rasi/*` remain indexable and linked from the footer. They are reference pages, not primary application destinations. Remove the repeated inline Tarot upsell from `/today`, `/rasi/*`, `/readings`, and `/ask`; leave contextual text links or the core route actions intact.

## Visual and Interaction Rules

- Preserve the Night Observatory palette, typography, glyphs, and card language.
- Simplification comes from subtraction, spacing, and disclosure—not a new visual system.
- Native `<details>` keeps content accessible and server-rendered without a client-only drawer.
- Mobile Home target: no more than 1,300 px tall at 390×844.
- Mobile Daily target: no more than 3,000 px tall at 390×844 with disclosure panels closed.
- No horizontal overflow at 390 px or 1280 px.
- The four-item bottom dock must not use the floating Ask treatment.
- Forms receive enough trailing space that their submit action can scroll clear of the fixed dock.
- Selected reading technique includes screen-reader text.
- Burmese content remains at least 12 px; all existing keyboard focus styles remain.

## Out of Scope

- Astrology calculations, prompts, quotas, schema, migrations, authentication mechanics, consultant data, booking API behavior, payment, and route deletion.
- Rewriting all Sanskrit terminology across long-form SEO content. The task only removes high-salience English category labels and improves the changed guest/navigation surfaces.
- A new analytics system or formal usability study.

## LLM Configuration Amendment

The user supplied the previously planned OpenRouter environment variables during implementation. The server provider boundary therefore accepts `OPENROUTER_API_KEY`, `LLM_MODEL`, and `OPENROUTER_API_URL` in addition to the existing Gemini variables. Gemini remains compatible and takes precedence when both keys are present; without either key, the deterministic interpretation remains the safe fallback. Secrets and complete prompts stay server-side, and no `.env` file is committed.

OpenRouter uses its OpenAI-compatible streaming endpoint. The server reports the actual delivered interpretation mode through `x-interpretation-mode`; the client never infers provenance from key presence alone. Model and deterministic period caches use separate keys. A provider fallback is reused for fifteen minutes before another model attempt, preventing outage retry storms while allowing recovery. Partial or empty model responses are never presented as complete. A concurrent generation uses HTTP 202 with bounded polling rather than a console-error-producing conflict response.

## Acceptance Criteria

- `navigationItems` is exactly `/`, `/ask`, `/tarot`, `/profile`; desktop text navigation is exactly `/`, `/ask`, `/tarot`.
- Guest Home renders no identity rail, one primary CTA, two route cards, no weekly/monthly shortcuts, and an explicit demo/personalization note.
- Daily renders factor and data disclosure panels, no repeated metric cards, Burmese score digits, no English category eyebrows, and one primary Ask action.
- Ask has no inline Tarot upsell in the normal guest state and its explainer is collapsed.
- Chart has a collapsed detail panel and an Ask CTA.
- `/today`, `/rasi/mesha`, and guest `/readings` render no inline Tarot upsell.
- Guest Profile, Readings, weekly, and monthly states use the shared benefit/action/back pattern.
- Playwright checks at 390×844 and 1280×900 show no console errors, no horizontal overflow, and no fixed-dock collision with form submit controls.
- Unit tests, lint, production build, and rendered-worker HTML tests pass.
