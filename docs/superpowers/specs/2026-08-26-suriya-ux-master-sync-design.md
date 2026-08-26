# Suriya UX Master Design Sync

Date: 2026-08-26  
Status: Approved through explicit user delegation and self-review

## Objective

Rebuild the public Suriya application from the new `untitled.pen` UX master canvas while preserving the working authentication, D1 ownership, astrology calculation, reading history, and public deployment. The result must match the canvas's warm cosmic visual system, work across mobile and desktop, and never imply that unfinished AI, palmistry, booking, payment, or human-consultation services are operational.

## Canvas Interpretation

The canvas has three distinct layers:

1. Core product screens: personalized home, daily overview, horoscope detail, Ask Suriya, Cosmic Profile, saved readings, and feedback.
2. Human-consultation concepts: escalation, consultant discovery/profile, booking/payment, consultation room, and approved summary.
3. Internal readiness boards: prototype, consultant operations, fortune-engine quality, trust and safety, marketplace operations, evaluation, mobile usability, and pilot launch.

Only end-user product surfaces belong in the public application. Internal readiness boards remain design and product requirements, not routes. Consultant discovery and profiles ship as clearly labeled previews; transactional and live consultation screens do not ship until their services exist.

## Route Map

| Route | Canvas source | Result |
| --- | --- | --- |
| `/login` | Existing authentication plus the new visual system | ChatGPT identity entry point |
| `/onboarding` | UX overview step 01 and Cosmic Profile | Birth-profile creation followed by calculated results |
| `/` | `01 — Home / Personalized Feed` | Desktop feed with identity rail and mobile single-column feed |
| `/daily` | `02 — Daily Reading` | Daily overview, energy, source cards, lucky window, and practical ritual |
| `/daily/details` | `02A — Horoscope Detail` | Full calculated guidance and D1/D9/D10 charts |
| `/ask` | `03 — Ask Suriya` | Conversation-oriented question composer with recent readings and source disclosure |
| `/readings` | UX overview step 05 and Ask history rail | Saved reading library |
| `/readings/[id]` | Ask answer state and saved feedback | Streamed/saved answer, factors, follow-ups, and feedback controls |
| `/profile` | `04 — Cosmic Profile` | Profile identity, completion, birth facts, calculation fingerprint, and edit form |
| `/tarot` | `Hybrid 01 — Consultant Discovery` | Honest consultant preview directory |
| `/tarot/[id]` | `Hybrid 02 — Consultant Profile` | Read-only consultant details and availability preview |

The booking, payment, consultation-room, and approved-summary concepts remain unavailable. Controls leading toward them use explicit “coming soon” copy and do not simulate transactions.

## Visual System

The Pen.dev variables are canonical:

- Canvas: `#E9E1D4`
- Paper: `#F8F2E8`
- Ink: `#24231F`
- Muted: `#777168`
- Line: `#CFC3B2`
- Gold: `#B58A46`
- Plum: `#3A243C`
- Green: `#6D8066`

The implementation uses CSS custom properties and the existing Myanmar/Latin font setup. Shared primitives cover shell/navigation, buttons, status badges, source chips, metrics, progress, cards, message bubbles, chart panels, empty/error states, and consultant cards. The accidental canvas string `Dဉာဏ်ရည်တုLY ENERGY` is corrected to `DAILY ENERGY`.

Desktop home and Ask use a left identity/history rail, dominant center content, and contextual right panel where shown by the canvas. Tablet collapses optional rails. Mobile uses one dominant column with the floating bottom navigation and no horizontal page scrolling. Horoscope detail retains the canvas's narrow reading rhythm and stacked chart panels.

## Product Truthfulness

ChatGPT sign-in supplies identity only: stable user ID, email, and optional full name. Suriya never receives the user's ChatGPT conversations, memory, prompts, subscription, or model quota.

Birth date, time, city, coordinates, and timezone remain stored in the app's D1 database under the authenticated user ID. The astrology engine calculates canonical chart placements locally. Calculation facts and source/version metadata are separated from prose interpretation.

The canvas references numerology, Myanmar astrology, palmistry, Tarot, and combined confidence values. The release follows these rules:

- Display real Vedic chart and daily-transit facts produced by the existing calculation engine.
- Add only deterministic numerology values that have an implemented, versioned rule and tests.
- Mark Myanmar astrology, palmistry, and Tarot as optional or upcoming unless a real input and calculation path exists.
- Never claim that four methods were combined when they were not.
- Never show fabricated confidence percentages.
- Source chips and explanation panels list only factors actually used.

## Reading Generation

The reading provider boundary remains replaceable. Production currently has no model key, so the identical fake response is replaced by a deterministic chart interpreter that creates Burmese copy from the stored chart, selected technique, daily factors, and user question category. This fallback is personalized by calculated facts and labels itself as rule-based guidance.

When a server-side model credential is configured later, the AI provider may explain the canonical structured snapshot but cannot recalculate placements, invent facts, or access ChatGPT account content. Output remains plain text, length-limited, and subject to the existing safety prompt.

## Interaction Design

- Saving onboarding data validates fields, persists the profile, calculates the chart, and redirects to the personalized home.
- Home links to daily overview, full detail, Ask, profile completion, and available method previews.
- Daily lucky-window segments and ritual controls expose clear selected/completed states without implying real-world guarantees.
- Ask supports a single Burmese question, reading technique selection, submit/loading/error states, recent-reading navigation, and suggested follow-ups.
- Reading detail supports retry after a provider failure and useful/not-useful feedback stored per owned reading.
- Profile editing preserves existing values and reports save success or field/server errors.
- Consultant previews expose specialties, availability labels, rates, and non-transactional interest actions.
- Every control has visible focus, disabled, loading, success, or restriction feedback.

## Data Changes

Existing profile, birth profile, reading, and specialist tables remain. The implementation adds:

- `readings.feedback` with `useful`, `not_useful`, or null.
- `readings.interpretation_mode` identifying deterministic or configured model output.
- Versioned numerology results in the stored chart snapshot rather than a separate table.

All reads and writes for profiles, birth data, readings, and feedback include the authenticated user ID. Public specialist data contains no user-owned fields.

## Error, Empty, and Restriction States

- Anonymous personalized actions redirect to ChatGPT sign-in with a safe same-origin return path.
- Missing birth data redirects to onboarding or presents a clear profile-required action.
- Invalid dates, times, coordinates, and timezones stay field-specific.
- Calculation failure prevents interpretation and retains a safe diagnostic code.
- Provider failure preserves the saved chart/question and provides retry.
- Empty reading history and unavailable consultation commerce use designed, honest states.
- Public home/daily pages may use the clearly identified guest demonstration profile; they do not imply personal calculation.

## Accessibility and Responsive Requirements

- Semantic landmarks, headings, labels, lists, buttons, links, radio groups, and status regions remain intact.
- Touch targets are at least 44px and keyboard focus is never hidden.
- Text/background contrast meets WCAG AA for normal copy.
- Motion respects `prefers-reduced-motion`.
- Mobile widths from 320px through 430px have no horizontal overflow.
- Desktop layouts are verified at 1280×900 and 1440×1000.
- Burmese text wrapping is checked visually rather than inferred from Latin metrics.

## Testing and Acceptance

Implementation follows test-driven development:

1. Unit tests cover deterministic numerology/interpretation, source disclosure, route content, feedback validation, and ownership predicates.
2. Existing astrology, schema, prompt, build, and server-render tests remain green.
3. Playwright verifies navigation, onboarding/profile controls, daily/detail links, Ask selection/submission, reading feedback, and consultant preview interactions.
4. Pen.dev screenshots are compared against local browser renders for home, daily, detail, Ask, profile, and consultant discovery at their intended viewport classes.
5. Lint, full tests, production build, and dependency audit pass before deployment.
6. The public production deployment is retested anonymously on mobile and desktop with zero browser errors.

The work is complete only when the public URL serves the new design, the primary flows work, and unsupported services remain visibly unavailable rather than mocked as real.
