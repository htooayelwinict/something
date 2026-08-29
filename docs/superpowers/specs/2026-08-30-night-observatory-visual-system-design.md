# Night Observatory Visual System Design

Date: 2026-08-30
Status: Approved in chat (sub-project 3a)

## Problem

The current UI reads as generic: flat parchment, identical white cards with a
lucide icon in a rounded square, English uppercase eyebrows on every section,
no imagery connected to astrology or Myanmar, a single typeface. Users get no
signal that this is a Jyotish product, and nothing is memorable enough to share.

## Direction

"Night Observatory": a deep indigo sky, gold star-field, engraved gold hairlines,
zodiac glyphs and a real Moon phase, serif Burmese display type. Dark-first,
luxurious, unmistakably astrological, still calm enough for long Burmese reading.

## Tokens (`app/globals.css`)

| token | value | use |
| --- | --- | --- |
| `--sky` | `#0b0f1e` | page background |
| `--surface` | `#141b34` | cards |
| `--raised` | `#1d2649` | nested cards, inputs |
| `--text` | `#f3ecdd` | body text |
| `--muted` | `#b3a996` | secondary text (≥ 4.5:1 on surface) |
| `--gold` | `#e8c87a` | accents, links, glyphs |
| `--gold-deep` | `#b8933f` | borders, ornaments |
| `--hairline` | `rgb(232 200 122 / 18%)` | dividers, card borders |
| `--lacquer` | `#d9756c` | caution (on dark; ≥ 4.5:1) |
| `--sage` | `#9fc19a` | favourable |
| `--radius-*` | unchanged | |

Legacy aliases (`--ink`, `--paper`, `--navy`, `--cosmic-*`) are remapped to the
new tokens so untouched rules keep working, then removed where encountered.
Contrast: every text/background pair ≥ 4.5:1; the audit script checks computed
colours for all text nodes.

## Typography

- Headings: Noto Serif Myanmar (`next/font/google`, variable `--font-myanmar-serif`),
  weight 600, larger scale: h1 `clamp(2rem, 8vw, 3.4rem)`, h2 `1.3rem`.
- Body: Noto Sans Myanmar (unchanged). Latin/numerals: Inter.
- Eyebrows become Burmese, gold, serif, `.78rem`, with a leading `✦`. English
  eyebrow strings are replaced across pages (e.g. `DAILY READING` → `နေ့စဉ်ဖတ်စာ`).
  Technical labels (Lahiri, D9) stay.

## Motifs and components

- `components/suriya/star-field.tsx`: deterministic inline SVG (seeded PRNG, 140
  stars, three sizes) rendered once in `AppShell` as a fixed background layer;
  CSS twinkle on a subset, disabled under `prefers-reduced-motion`.
- `components/suriya/brand.tsx`: gold sun-disc SVG mark (12 rays) + "သုရိယ" in
  serif and "SURIYA" small caps.
- `components/suriya/zodiac-glyph.tsx`: `{ signIndex, size }` → gold ring,
  Unicode glyph (♈…♓), `aria-label` Burmese sign name. Used in the daily hero,
  home brief, identity rail, chart cells (small), ရာသီ pages later.
- `components/suriya/moon-phase.tsx`: `{ tithi: { number, paksha } }` → SVG disc
  with the lit fraction computed from tithi (Shukla n → n/15 waxing, Krishna n →
  1 − n/15 waning). Used in the daily hero and home brief.
- Score ring → `.dial`: conic gold arc with 12 tick marks and a needle; number in
  Inter, label in Burmese.
- Section ornament `.ornament` (`✦ ─── ✦`) between major sections; `.section-title h2`
  in serif with a short gold rule.
- Route cards → `.portal-card`: deep-sky gradient, large glyph, gold hairline,
  hover lift; four cards keep their hrefs.
- Chart grid: sky surface, gold hairlines, Lagna cell with a soft gold glow,
  planet chips in raised colour.
- Tarot hero: card-back lattice pattern (CSS repeating-linear-gradient) with gold
  border; specialist cards get a gold-framed monogram medallion.
- Forms: inputs on `--raised` with hairline border, gold focus ring; primary
  button gold background with sky text; secondary gold outline; ghost muted.
- Nav: top bar sky glass with gold underline on the current link; bottom nav
  sky glass, active item gold with a small dot.
- Footer (`components/suriya/site-footer.tsx`, in `AppShell`): brand line,
  public links (ပင်မ, နေ့စဉ်, ယနေ့ Panchanga, ရာသီများ, Tarot, မွေးဇာတာ), Yangon
  line, method note. The `/today` and `/rasi` links appear in 3b; until then the
  footer links to existing routes only.

## Pages touched

All: home, daily/week/month, chart, ask, readings list and detail, tarot index,
specialist, booking confirmation, profile, onboarding, login. Markup changes are
limited to: eyebrow copy, adding glyph/moon components to the daily hero, home
brief and identity rail, the dial, and the footer. Everything else is CSS.

## Accessibility and performance

- Contrast ≥ 4.5:1 everywhere; focus rings gold, 3px.
- Burmese text ≥ .75rem, targets ≥ 44px (unchanged rules).
- No JS animation; star-field is one inline SVG (< 6 KB); fonts via next/font.
- `prefers-reduced-motion` disables twinkle and hover lifts.
- `theme-color`, manifest `background_color`/`theme_color` → `#0b0f1e`.

## Testing

- Unit: `moonPhaseFraction(tithi)` boundaries; `zodiacGlyph(signIndex)` map;
  star-field determinism (same seed → same markup).
- Rendered HTML: home has `star-field`, `site-footer`, `zodiac-glyph`,
  `moon-phase`; no English eyebrows (`/[A-Z]{4,}\s·\s[A-Z]/` absent in main).
- Playwright audit extended with a contrast check (every text node's colour vs
  effective background ≥ 4.5:1, ignoring decorative `aria-hidden`), run on
  `/`, `/daily`, `/chart`, `/ask`, `/tarot`, `/tarot/thiri`, `/readings`,
  `/profile`, `/login` at 390 and 1280.
- Usual gates.
