# သုရိယ (Suriya)

သုရိယ is a Burmese-first, mobile-first Vedic astrology PWA. It calculates a deterministic sidereal birth chart from exact birth details, turns the chart into practical daily guidance, and can stream a careful Burmese interpretation through OpenRouter or Gemini.

## Included in this MVP

- Five core screens from the supplied Pencil design: Home, Daily, Ask, Login, and Tarot preview
- Sign in with ChatGPT through the Sites platform-owned identity flow
- Private D1 storage for profiles, birth details, and saved readings
- Lahiri sidereal positions, whole-sign houses, Panchanga, Vimshottari Dasha, D1, D9, and D10 calculations
- OpenRouter or Gemini streaming behind a server-only provider boundary
- Deterministic local reading fallback when no model provider is configured
- Installable manifest, 192/512 icons, accessible charts, reduced-motion support, and a generated social card

Live Tarot booking, payment, chat, voice, and video are deliberately marked as preview-only.

## Local development

Requirements: Node.js 22.13 or newer.

```bash
npm ci
npm run dev
```

The default local URL is `http://localhost:3000`. Public pages work without credentials. Platform authentication headers are supplied by the hosted Sites environment.

## Environment

Copy `.env.example` to `.env.local` when testing a model locally. OpenRouter uses its OpenAI-compatible streaming endpoint:

```bash
OPENROUTER_API_KEY=your_server_only_key
LLM_MODEL=openrouter/auto
OPENROUTER_API_URL=https://openrouter.ai/api/v1
```

Direct Gemini configuration remains supported and takes precedence when both providers are configured:

```bash
GEMINI_API_KEY=your_server_only_key
GEMINI_MODEL=gemini-2.5-flash
```

Never expose either API key to browser code. When neither key is present, the provider returns a clearly bounded deterministic sample interpretation so the rest of the flow remains testable.

## Database

The app expects the Cloudflare D1 binding `DB`, declared in `.openai/hosting.json`. Schema changes live in `db/schema.ts`.

```bash
npm run db:generate
```

Checked-in SQL migrations under `drizzle/` are packaged during the Sites build and applied by the hosting workflow. Every user-owned repository method requires the authenticated user ID and repeats it in read, update, and delete predicates.

## Quality checks

```bash
npm run lint
npm run test:unit
npm test
npm run build
```

The calculation tests include the Yangon fixture independently observed in the reference application, DST gap/overlap rejection, boundary arithmetic, divisional-chart cases, prompt safety, and deterministic daily scores.

## Privacy boundaries

- Birth details, questions, chart snapshots, and readings are stored only for the authenticated account and are served with private, no-store cache headers.
- The client never supplies a trusted ownership ID.
- Model API keys and the full prompt stay server-side.
- AI interprets a versioned calculated snapshot; it does not invent or recalculate planet positions.
- Astrology copy is reflective guidance, not medical, legal, or investment advice.

## Deployment

Production builds must retain the `sites()` Vite plugin and the D1 declaration in `.openai/hosting.json`.

```bash
npm run build
```

The build packages `.openai/hosting.json` and `drizzle/` into `dist/` for Sites hosting. Configure `OPENROUTER_API_KEY`, `LLM_MODEL`, and optionally `OPENROUTER_API_URL` as server runtime values in the hosting environment. `GEMINI_API_KEY` and `GEMINI_MODEL` remain supported.
