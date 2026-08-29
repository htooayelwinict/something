# Night Observatory + SEO/GEO Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the generic parchment UI with the Night Observatory system and add indexable public astrology content with structured data.

**Architecture:** Tokens + CSS rewrite in `app/globals.css`; new SVG components (star-field, sun brand, zodiac glyph, moon phase, dial); Burmese eyebrows; footer. Then content modules (`lib/content/rasi.ts`, `business.ts`, `seo.ts`) feeding new server pages and `sitemap`/`robots`.

**Tech Stack:** as before; `next/font/google` Noto Serif Myanmar.

**Specs:** `docs/superpowers/specs/2026-08-30-night-observatory-visual-system-design.md`, `docs/superpowers/specs/2026-08-30-seo-geo-content-design.md`

## Global Constraints
See both specs: contrast ≥ 4.5:1, Burmese ≥ .75rem, 44px targets, plain `<a>`, Burmese eyebrows, no JS animation, canonical domain `https://suriya.openai.site`, untracked user files untouched, gates as before plus the contrast audit.

---

### Task A1: Tokens, fonts, foundations
- [ ] `app/layout.tsx`: add `Noto_Serif_Myanmar` (`--font-myanmar-serif`, weights 500/600), `themeColor` `#0b0f1e`; `app/manifest.ts` colours `#0b0f1e`.
- [ ] `app/globals.css`: new `:root` tokens; remap legacy aliases; replace hard-coded light tints via the mapping table (gold tints → `rgb(232 200 122 / 12%)`, green tints → `rgb(159 193 154 / 14%)`, lilac/paper tints → `var(--raised)`, `#f6dc93`/`#f7e3a6`/`#d4b873` → `var(--gold)`, `#cdbed0`/`#cdc8c0`/`#dbe7d7`/`#e6dbe7` → `var(--muted)`); fix every rule that used `--ink` as a background; headings serif; eyebrow style `✦` prefix.
- [ ] Verify build + rendered tests; commit `feat: night observatory tokens and typography`.

### Task A2: Motif components (TDD)
- [ ] Tests `tests/motifs.test.ts`: `moonPhaseFraction({number, paksha})` (Shukla 15 → 1, Krishna 15 → 0, Shukla 7 ≈ .47), `zodiacGlyph(0) === "♈"`, `starField(seed)` deterministic string.
- [ ] Create `lib/content/motifs.ts` (pure helpers), `components/suriya/star-field.tsx`, `zodiac-glyph.tsx`, `moon-phase.tsx`, `dial.tsx`, `site-footer.tsx`; new `brand.tsx` sun mark; `app-shell.tsx` renders `StarField` + `SiteFooter`.
- [ ] commit `feat: add observatory motif components`.

### Task A3: Apply motifs + Burmese eyebrows
- [ ] `lib/content/daily-copy.ts`: add `transitMoonSignIndex`, `tithi` to the presentation (test in `tests/daily-copy.test.ts`).
- [ ] `daily-insight.tsx` hero: `ZodiacGlyph` + `MoonPhase` + `Dial`; `daily-brief.tsx`: glyph + moon; `identity-rail.tsx`: natal Moon glyph; `route-cards.tsx` → portal cards with glyph characters; chart cells small glyph.
- [ ] Replace all English eyebrows with Burmese (mapping in the task body of the commit); keep technical tokens.
- [ ] Update `tests/rendered-html.test.mjs` (star-field, site-footer, zodiac-glyph, moon-phase present on `/`; no `[A-Z]{4,} · [A-Z]` in main).
- [ ] Contrast check added to `audit.py`; run on all routes at 390/1280; fix; commit `feat: apply observatory motifs and Burmese labels`.

### Task B1: Content + SEO helpers (TDD)
- [ ] `tests/rasi-content.test.ts`, `tests/seo.test.ts`; create `lib/content/rasi.ts`, `lib/content/business.ts`, `lib/content/seo.ts` (JSON-LD builders: organization, website, breadcrumb, article, localBusiness, faq, collection), `lib/services/public-today.ts` (Yangon Panchanga + horas + transit signs for today).
- [ ] commit `feat: add rasi content and structured data builders`.

### Task B2: Public pages
- [ ] `app/rasi/page.tsx`, `app/rasi/[slug]/page.tsx` (`generateStaticParams` not needed; dynamic), `app/today/page.tsx`, `/tarot` FAQ + JSON-LD, `components/suriya/json-ld.tsx`, footer links, `app/sitemap.ts`, `app/robots.ts`, `public/llms.txt`, `noindex` on private routes, canonicals.
- [ ] Rendered-HTML tests per spec; audit `/rasi/mesha`, `/today`; commit `feat: add public rasi and today pages with structured data`.

### Task C: Final gates, self-review, merge to main.
