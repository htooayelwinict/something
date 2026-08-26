# Suriya Staged MVP Design

Date: 2026-08-26  
Status: Approved through explicit user delegation

## Summary

Suriya (`သုရိယ`) will be a mobile-first, installable web application for Burmese-speaking users who want personalized Vedic astrology guidance. The staged MVP will reproduce the five mobile screens in `untitled.pen`, add the supporting onboarding and reading screens required for a complete product flow, calculate a deterministic Vedic chart from birth data, and stream a concise Burmese interpretation from Gemini.

The first release includes real authentication, saved birth profiles, daily guidance, question-based AI readings, reading history, and a browsable Tarot specialist directory. Live Tarot chat, voice/video, payments, subscriptions, and adviser administration are intentionally represented as non-transactional preview states.

## Product Goals

1. Give a new user a clear path from sign-in to a personalized daily insight in under five minutes.
2. Produce repeatable astrology data from the same birth inputs; AI is used only to interpret calculations, never to invent the chart.
3. Deliver the visual character of the Pencil designs at 390×844 while remaining accessible and usable on larger viewports.
4. Keep personal birth data private through platform authentication, server-side ownership checks, server-only AI credentials, and explicit deletion controls.
5. Establish modular boundaries so the calculation provider, AI provider, database, or Tarot commerce implementation can be replaced without rewriting the interface.

## Non-Goals

- Live adviser chat, voice, or video
- Real booking, payment, payout, or subscription processing
- An adviser or operations dashboard
- Social features or public profiles
- Native iOS or Android binaries
- Offline access to private readings
- Full parity with every advanced calculation shown by the reference Zartar application
- Medical, legal, financial, or deterministic life-event claims
- English localization in the initial release; the copy structure will remain translation-ready

## Target Users and Core Journeys

### New user

1. Open the installable PWA and sign in through the platform-owned ChatGPT identity flow.
2. Complete birth onboarding with name, birth date, exact birth time, city, coordinates, and IANA timezone.
3. Land on the home screen and see a calculated daily insight.
4. Open Ask, enter a question, choose a reading technique, and receive a streamed Burmese response.
5. Revisit the response from Reading History.

### Returning user

1. Open directly into the authenticated shell.
2. Review the daily energy card and next favorable window.
3. Ask a new question or open a previous reading.
4. Edit the birth profile from Profile when necessary.

### Tarot-curious user

1. Browse the seeded specialist directory.
2. Open a specialist preview.
3. See a clear “consultations coming soon” action without entering a payment or fake live-chat flow.

## Information Architecture

| Route | Purpose | Pencil source |
| --- | --- | --- |
| `/login` | Branded entry point for platform-owned ChatGPT sign-in | `သုရိယ — ဝင်ရောက်ရန်` |
| `/onboarding` | Birth profile creation | New screen derived from the visual system |
| `/` | Personalized home dashboard | `သုရိယ — ပင်မ` |
| `/daily` | Expanded daily guidance | `သုရိယ — နေ့စဉ်လမ်းညွှန်` |
| `/ask` | Question composer and technique selector | `သုရိယ — မေးမြန်းရန်` |
| `/readings/[id]` | Streamed or saved reading result | New screen derived from Ask and Daily cards |
| `/readings` | Reading history | New screen derived from the navigation system |
| `/tarot` | Seeded Tarot specialist directory | `သုရိယ — Tarot တိုက်ရိုက်ဆွေးနွေး` |
| `/profile` | Account and birth-profile management | New screen derived from Login and Home |

All authenticated routes share a mobile bottom navigation and a restrained desktop container. The 390px mobile composition is the primary layout. Desktop widths retain the mobile reading rhythm while allowing two-column presentation for dashboard and result details.

## Visual System

The Pencil variables are the source of truth:

- Background: `#F4F2EF`
- Ink: `#1A1A1A`
- Muted ink: `#4A4A4A`
- Gold: `#C8B496`
- Deep gold: `#9B825B`
- Navy: `#384F84`
- Inverse surface: `#1A1A1A`
- Primary Burmese font: Noto Sans Myanmar
- Supporting Latin font: Inter

CSS custom properties will encode color, typography, radius, spacing, elevation, and motion tokens. UI primitives will include `AppShell`, `MobileTabBar`, `StatusHeader`, `Card`, `Button`, `Field`, `Progress`, `Badge`, `EmptyState`, `StreamingText`, and `ChartGrid`. Feature components consume these primitives rather than duplicating style rules.

The implementation will preserve the warm editorial tone, fine borders, gold details, compact type, and quiet whitespace of the source. Motion is limited to short opacity/transform transitions and respects `prefers-reduced-motion`.

## Technical Architecture

### Application

- Vinext App Router with the Next.js 16-compatible API surface supplied by the Sites starter
- React and TypeScript in strict mode
- Server Components by default; Client Components only for interactive forms, streaming state, and install prompts
- Route Handlers for AI streaming and authenticated mutations that need an HTTP boundary
- Route Handlers for authenticated form mutations and streaming boundaries
- CSS variables plus Tailwind utility composition for the design system
- Zod schemas shared by forms, server boundaries, and stored chart snapshots

### Persistence and authentication

- OpenAI Sites dispatch-owned Sign in with ChatGPT (SIWC)
- Stable `oai-authenticated-user-id` as the ownership key; email and full name are display-only
- Cloudflare D1 SQLite for profiles, birth profiles, readings, and seeded Tarot specialists
- Server-side ownership predicates on every user-owned query and mutation
- A small D1 repository layer so route handlers never access the runtime binding directly

### AI

- Google Gen AI SDK (`@google/genai`) on the server
- Gemini model selected through `GEMINI_MODEL`, not hard-coded
- Route Handler converts the provider async stream to a web `ReadableStream`
- Provider adapter isolates Gemini-specific request and chunk formats
- Automated tests use a deterministic fake provider

### Astronomy

- Astronomy Engine supplies tested geocentric astronomical positions under the MIT license
- A pure TypeScript Vedic domain layer performs sidereal conversion and astrology-specific calculations
- The calculation module is server-only for canonical results, but contains no database or AI dependencies
- An `AstrologyProvider` interface permits later replacement with a professionally licensed Swiss Ephemeris service without changing application features

This modular monolith keeps one deployable application while preserving explicit feature boundaries:

```text
UI routes and components
        |
Application services
   |        |        |
Auth    Astrology    Readings
   |        |        |
D1 repositories  Calculation core  AI provider
```

## Vedic Calculation Scope

### Canonical input

- Local birth date and time
- IANA timezone identifier
- Latitude and longitude
- Conversion to an unambiguous UTC instant, including daylight-saving rules where applicable
- Explicit validation for nonexistent or repeated local times

### MVP output

- Tropical geocentric longitudes for Sun, Moon, Mercury, Venus, Mars, Jupiter, Saturn, Uranus, Neptune, and Pluto
- Lahiri sidereal longitudes
- Retrograde status where velocity data supports it
- Sidereal ascendant and whole-sign houses
- Nakshatra and pada
- Vara, Tithi, Yoga, and Karana
- Vimshottari Mahadasha and Antardasha timeline
- D1 Rasi, D9 Navamsa, and D10 Dasamsa placements
- Slow-planet transits for the requested period
- Compact favorable-window score used by the daily screen
- SVG South-Indian-style chart rendering with accessible text alternatives

Advanced Shadbala, Ashtakavarga, uncommon divisional charts, and absolute yes/no event prediction are excluded until each algorithm has authoritative fixtures and a reviewed interpretation policy.

### Calculation correctness

- Every calculation is a pure function of versioned input and configuration.
- Stored readings include `calculation_version` and a complete structured chart snapshot.
- Golden fixtures cover multiple timezones, hemispheres, DST transitions, retrograde boundaries, and nakshatra/dasha boundaries.
- Fixture values are compared with independently generated reference charts; tolerances are explicit and tighter than the displayed precision.
- AI prompts receive only the validated structured snapshot, not calculation instructions it can reinterpret.

## AI Interpretation Policy

The prompt consists of a fixed system policy, a versioned structured chart snapshot, the selected technique, date range, and a clearly delimited user question.

Responses must:

- Be written in clear Burmese
- Start with a concrete, useful summary
- Explain only the two or three chart factors that materially support the interpretation
- Use reflective language rather than certainty about unavoidable events
- End with one practical action
- Avoid medical diagnoses, legal conclusions, investment directives, fear-based language, and fabricated personal facts
- State when a question needs a qualified professional instead of an astrology answer

Raw model output is treated as untrusted text. The MVP renders plain streamed text with controlled paragraph formatting rather than arbitrary HTML.

## Data Model

### `profiles`

- `id text primary key` containing the stable authenticated Sites user ID
- `display_name text`
- `locale text default 'my'`
- timestamps

### `birth_profiles`

- `id text primary key`
- `user_id text references profiles`
- `name text`
- `birth_date date`
- `birth_time time`
- `birth_city text`
- `latitude numeric`
- `longitude numeric`
- `timezone text`
- timestamps
- one active profile per user in the MVP

### `readings`

- `id text primary key`
- `user_id text references profiles`
- `birth_profile_id text references birth_profiles`
- `kind text` (`daily`, `janma`, `prashna`, `muhurta`)
- `question text nullable`
- `period_start date`
- `period_end date`
- `chart_snapshot jsonb`
- `calculation_version text`
- `prompt_version text`
- `response_text text nullable`
- `status text` (`calculating`, `generating`, `complete`, `failed`)
- `error_code text nullable`
- timestamps

### `tarot_specialists`

- `id text primary key`
- name, initials, specialty, experience, display rate, availability label, and sort order
- seeded read-only content for the MVP

Every user-owned database operation includes the authenticated user ID in its predicate. Tarot specialist rows are publicly readable. D1 schema and indexes are managed through checked-in Drizzle migrations.

## Server Boundaries

- `POST /api/readings` validates input, calculates the chart, creates a pending reading, and returns its ID.
- `GET /api/readings/[id]/stream` verifies ownership, streams Gemini text, updates the reading on completion, and records a safe error code on failure.
- Authenticated Route Handlers create/update the birth profile and handle account settings.
- Daily insights are generated from a deterministic chart summary and cached per user/local date only in D1; private responses are never placed in shared CDN caches.

The separate create and stream operations make retry behavior explicit. A failed AI call reuses the existing chart snapshot and does not create another reading.

## Validation and Error Handling

- Client validation improves responsiveness; all rules are repeated server-side.
- Missing or approximate birth time is explained before submission because it affects the ascendant and divisional charts.
- Invalid coordinates, timezone identifiers, and date ranges receive field-level errors.
- Calculation failures produce a traceable internal code and never invoke AI.
- AI timeout, quota, and provider errors preserve the reading and expose a retry action.
- Streaming disconnects can resume by reopening the saved reading; completed chunks are persisted only after a successful final response in the MVP.
- Missing identity redirects through dispatch-owned SIWC while preserving a same-origin return URL.
- Empty history and unavailable Tarot commerce use designed empty states rather than dead controls.

## Privacy and Security

- API keys and service credentials remain server-only.
- User identity is verified at each server boundary; client-supplied `user_id` values are ignored.
- Every database repository requires an authenticated user ID and includes it in ownership-sensitive reads, updates, and deletes.
- Questions are length-limited and delimited in prompts to reduce prompt injection.
- Rate limits apply per authenticated user and IP to reading creation and AI streaming.
- Logs exclude birth data, questions, chart snapshots, and model responses.
- Users can delete individual readings, their birth profile, or their account data.
- Privacy copy accurately distinguishes browser, database, and AI-provider processing.

## PWA Behavior

- A Next.js manifest defines standalone display, colors, icons, and start URL.
- Static assets and the public shell may be cached; authenticated pages, birth data, and readings are network-only.
- Installation is an optional enhancement, not a blocking onboarding step.
- The application remains fully usable in a normal mobile or desktop browser.

## Testing Strategy

### Unit tests

- Date/timezone normalization
- Angle normalization and sidereal conversion
- Ascendant and whole-sign houses
- Panchanga components
- Nakshatra/pada and Vimshottari boundaries
- D1/D9/D10 placement transforms
- Prompt construction and injection delimiting

### Integration tests

- D1 repositories and authorization helpers
- Ownership isolation using two distinct test users
- Reading state transitions
- Fake AI streaming, retry, timeout, and failure behavior

### Component tests

- Authentication and onboarding forms
- Navigation state
- Question composer and technique selection
- Streaming, empty, retry, and completed result states
- Accessible names, keyboard use, and reduced motion

### End-to-end tests

- Email sign-in and first-time onboarding
- Returning-user daily dashboard
- Ask-to-stream-to-history flow
- Unauthorized reading access rejection
- Birth-profile update and recalculation behavior
- Tarot preview and coming-soon action
- Mobile 390×844 and representative desktop layout checks

Gemini is mocked in the normal suite. A manually enabled live smoke test validates credentials and provider compatibility without becoming a required CI dependency.

## Deployment

- OpenAI Sites hosts the Vinext/Next.js-compatible Cloudflare Worker application.
- Sites provisions and binds Cloudflare D1 as `DB`.
- Google AI Studio or Vertex AI supplies Gemini credentials.
- Environment validation fails fast during build/start when required server variables are missing.
- Database migrations and seed data live in the repository.
- Local development uses the starter's simulated binding; hosted environments receive Sites-owned D1 resources.

## Delivery Sequence

1. Foundation: Next.js, design tokens, quality tooling, PWA manifest, and static application shell.
2. Pixel-accurate implementation of the five Pencil screens using seeded data.
3. D1 schema, ownership-safe repositories, SIWC authentication, onboarding, and profile management.
4. Pure calculation engine with fixtures and SVG charts.
5. Daily guidance and deterministic daily scoring.
6. Ask flow, Gemini adapter, streaming result, retry, and history.
7. Tarot preview states, accessibility pass, responsive QA, and production documentation.

Each sequence ends with passing tests and a browser verification checkpoint.

## Acceptance Criteria

- All five supplied screens are represented as functional application routes and match the design at 390×844.
- A user can authenticate, create a birth profile, view a daily insight, request an AI reading, and reopen it from history.
- The same birth input and calculation version always produce the same structured chart.
- D1, D9, D10, Panchanga, Nakshatra, and Dasha fixtures pass within documented tolerances.
- All user-owned data is covered by verified server-side ownership checks.
- AI output streams, errors safely, retries without duplicate calculations, and persists only for its owner.
- Tarot content is clearly a preview and never suggests that payment or a live consultation occurred.
- Keyboard navigation, accessible names, contrast, reduced motion, and mobile/desktop Playwright checks pass.
- Setup, environment variables, migrations, tests, and deployment are documented in the repository.

## Decision Record

- The product is a responsive Next.js PWA rather than a native application.
- The MVP uses an all-TypeScript modular monolith.
- Astronomy Engine plus a tested Vedic domain layer is preferred over Swiss Ephemeris for the MVP. Astronomy Engine is MIT-licensed and reports ±1 arcminute accuracy; Swiss Ephemeris requires either an AGPL-compatible project or a professional license for a public service.
- Sites dispatch-owned SIWC provides authentication, and Sites-owned D1 provides durable SQLite storage.
- Gemini is isolated behind an AI provider interface and streams through a server Route Handler.
- Burmese is the only launch language, with translation-ready message organization.
- Tarot commerce and communication are deferred, not simulated as working transactions.

## References

- [Pencil source design](../../../untitled.pen)
- [Next.js PWA guide](https://nextjs.org/docs/app/guides/progressive-web-apps)
- [Next.js streaming guide](https://nextjs.org/docs/app/guides/streaming)
- OpenAI Sites platform authentication and persistence guidance
- [Google Gen AI JavaScript SDK](https://googleapis.github.io/js-genai/release_docs/)
- [Astronomy Engine](https://github.com/cosinekitty/astronomy)
- [Swiss Ephemeris licensing](https://www.astro.com/swisseph/sweph_e.htm)
