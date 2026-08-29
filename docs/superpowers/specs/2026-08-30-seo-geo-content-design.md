# SEO / GEO Public Content Design

Date: 2026-08-30
Status: Approved in chat (sub-project 3b)

## Problem

Every page is a personalised app screen. There is no crawlable evergreen
content, no structured data, no sitemap, and private routes are indexable.
Search engines and AI answer engines have nothing to cite.

## Public pages

### `/rasi` and `/rasi/[slug]` (12 signs)

Slugs: mesha, vrishabha, mithuna, karka, simha, kanya, tula, vrischika, dhanu,
makara, kumbha, meena (sidereal signs, matching `zodiacSigns` order).

Content file `lib/content/rasi.ts`: per sign `{ slug, index, nameMy, nameSa,
glyph, rulingPlanet, element, quality, temperament (2 sentences), strengths[3],
cautions[2], luckyDay, luckyColour, keywords[] }` in Burmese.

Page sections: hero with `ZodiacGlyph`, Burmese name + Sanskrit + English;
"သဘောသဘာဝ"; "အားသာချက် / သတိထားရန်"; **live** "ယနေ့ ဤရာသီအတွက်" — today's Moon
sign and its house counted from this sign, Jupiter and Saturn signs (from the
demo daily engine at Yangon noon), today's Panchanga; CTA to `/daily` (personal
reading) and `/tarot`; links to the other 11 signs. `Article` + `BreadcrumbList`
JSON-LD; canonical `/rasi/[slug]`; title `"{nameMy}ရာသီ — သဘောသဘာဝနှင့် ယနေ့ ဂြိုဟ်အနေအထား | သုရိယ"`.

`/rasi` index: 12 glyph cards linking to each sign, intro paragraph, `CollectionPage` JSON-LD.

### `/today`

Public Yangon Panchanga for the current local date: vara, tithi, nakshatra, yoga,
karana, sunrise, sunset, Rahu Kalam, the day's Hora table (12 daytime horas
from `findMuhurtaWindow`/existing muhurta helpers), Moon sign. Dated `<h1>`
(Burmese digits), canonical `/today`, `WebPage` + `FAQPage` JSON-LD with three
visible Q&As (ရာဟုကာလ, တိထိ, နက္ခတ်). Links to `/daily`, `/rasi`, `/tarot`.
Cache header `public, max-age=300`.

### `/tarot`

Adds visible FAQ (6 Q&As) and JSON-LD: `LocalBusiness` (`@type: ["LocalBusiness","Service"]`,
name, areaServed Yangon, address locality from `lib/content/business.ts`,
telephone from `TAROT_CONTACT_PHONE` when set, priceRange "25000-30000 MMK",
`makesOffer` per specialist), `Person` for each specialist, `FAQPage`.

## Site-wide

- `app/sitemap.ts`: `/`, `/daily`, `/daily/week`, `/daily/month`, `/today`,
  `/rasi`, 12 sign pages, `/tarot`, specialist pages (demo ids + DB rows when
  available), `/ask`, `/chart`.
- `app/robots.ts`: allow all; disallow `/readings`, `/profile`, `/onboarding`,
  `/login`, `/tarot/bookings/`, `/api/`; sitemap URL.
- `robots` metadata `noindex` on the private routes above.
- Layout JSON-LD: `Organization` (သုရိယ, url, logo) + `WebSite`.
- `public/llms.txt`: what the site is, the public URLs, one-paragraph summaries.
- Footer links (from 3a) include `/today` and `/rasi`.
- Per-page `metadata.alternates.canonical` and Burmese descriptions carrying
  the target phrases (ဗေဒင်, ဇာတာ, ရာသီ, နေ့စဉ်ဟောစာတမ်း, Tarot ရန်ကုန်).

## Testing

Unit: 12 signs with all fields, unique slugs, glyph map aligned to
`zodiacSigns`; `/today` FAQ builder; sitemap entries include all sign pages;
JSON-LD builders produce valid JSON with required `@type`s.
Rendered HTML: `/rasi`, `/rasi/mesha`, `/today`, `/tarot` contain
`application/ld+json` that parses; `/robots.txt` and `/sitemap.xml` 200 with
expected entries; `/readings` has `noindex`.
Playwright on `/rasi/mesha`, `/today` at 390/1280 with the contrast check.
