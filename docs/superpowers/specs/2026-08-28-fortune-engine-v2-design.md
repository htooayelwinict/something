# Fortune Engine v2 Design

## Goal

Replace Suriya's opaque MVP fortune heuristics with a versioned, explainable Vedic calculation layer. Janma, Prashna, and Muhurta must calculate different charts, daily guidance must expose the factors behind its scores, and recommended times must be derived from the user's local solar day rather than a fixed clock formula.

This is reflective guidance, not a scientifically validated prediction system. Product language must describe calculated tendencies and candidate times, never certainty or guaranteed outcomes.

## Chosen approach

Keep `astronomy-engine` as the astronomical base and add a small, explicit Vedic ruleset in TypeScript. The alternative of adopting Swiss Ephemeris now was rejected because its deployment footprint and dual-license decision are disproportionate to this release. An AI-only interpretation approach was rejected because it cannot repair incorrect or missing calculations.

The v2 snapshot records the ephemeris family, Lahiri mode, mean-node mode, whole-sign house system, Dasha year convention, and ruleset version. Stored readings remain reproducible and the AI is only allowed to verbalize supplied evidence.

## Canonical charts

`CelestialChart` represents a chart for an instant and location. It contains the ascendant, whole-sign houses, planetary positions, Panchanga, and D1/D9/D10 placements. `ChartSnapshot` remains the natal specialization and additionally contains the birth profile, numerology, and current Vimshottari periods.

The planet list retains the existing physical planets for compatibility and adds mean Rahu and Ketu. Nodes are always exactly opposite, are marked as mean nodes, and are treated as retrograde. Daily Vedic rules use the classical seven grahas plus Rahu and Ketu; outer planets remain display-only.

## Daily evidence engine

The daily result contains five category values: career, relationships, focus, energy, and caution. Support categories start at 50; caution starts at 35. Named factors apply bounded integer impacts, and the overall score is derived from the four support categories with a caution penalty. Every factor contains a stable rule ID, source, Burmese explanation, and per-category impacts.

The four presentation bands are calibrated to the score range reachable from the v2 factors, rather than the wider category clamps, so `quiet`, `steady`, `open`, and `bright` all represent attainable results. Remaining-window availability is exposed as an advisory timing factor with no category impact; opening the same civil day's guidance after the final daylight hora must not lower the headline score by itself.

Version 2 uses these limited rules:

- Moon transit house from the natal Moon.
- Jupiter transit house from the natal Moon.
- Saturn transit house from the natal Moon, including a clearly labeled Sade Sati pressure condition.
- Natal house activation by the current Mahadasha and Antardasha lords.
- Current Panchanga conditions used by the local timing engine.

The ruleset deliberately avoids mixing Western 60/90/120-degree aspects into the Vedic calculation. Numerology remains visible as a separate method and does not alter the daily astrology score.

## Local timing and Muhurta

For a target local date, calculate sunrise and sunset at the saved latitude and longitude without requiring local midnight to exist. Split daylight into twelve planetary horas, derive each hora ruler from the local weekday at sunrise, and exclude any hora overlapping local Rahu Kalam. Panchanga `vara` likewise changes at local sunrise rather than civil midnight. Score the remaining candidates with event-type hora affinity plus explicit Panchanga rules at the interval midpoint. Return the strongest candidate with its ISO boundaries, localized label, hora ruler, score, reasons, sunrise, sunset, timezone, and ruleset version.

The event types are `general`, `work`, `relationship`, and `travel`. This is a transparent general-purpose electional subset, not a claim to implement every regional Muhurta tradition. If no future daylight candidate exists, the result is `null` and the UI says that no remaining interval was found.

## Distinct reading techniques

All persisted v2 readings use a `ReadingSnapshot` wrapper with technique, calculation time, primary chart, and technique context.

- **Janma:** the primary chart is the natal chart, calculated from saved birth data with current Dashas.
- **Prashna:** the primary chart is a new question chart at submission time, using the saved profile location as the question location. The snapshot explicitly records that location source.
- **Muhurta:** the request requires a target date and event type. The primary chart is cast for the selected candidate window's start; the context stores the complete timing result. If no window is available, the chart uses local noon and the context records a null window.

The reading page, source cards, deterministic fallback, and AI prompt use the primary chart and technique context. Legacy v1 chart snapshots remain renderable through a small compatibility accessor.

## User interface

The Ask composer reveals target date and event type only for Muhurta. It explains that Prashna uses the submission time and saved location and that Muhurta uses the saved location. Daily cards keep the familiar overall score but add category scores, a factual timing status, and the selected hora ruler. Copy changes from “lucky” certainty to “calculated suitable window.”

## Error handling

- Invalid or past Muhurta dates and dates more than 90 days away return validation errors.
- Nonexistent or repeated local birth times are rejected against the selected IANA timezone before storage or calculation.
- Polar/no-sunrise cases return no interval instead of inventing a time.
- Missing transit factors produce neutral evidence rather than non-null assertions.
- Dasha lookups outside the generated range throw rather than silently selecting an unrelated period.
- Existing v1 readings fall back to their stored chart and are labeled legacy.

## Testing

Development follows red-green-refactor. Tests cover mean-node opposition, chart metadata, local-time conversion, solar-day timing, Rahu Kalam exclusion, deterministic Muhurta selection, bounded category scoring, evidence traceability, technique-specific chart instants, request validation, prompt constraints, legacy snapshot access, and the updated presentation. The final gate runs unit tests, lint, production build, and rendered-HTML tests.

## Out of scope

- Statistical claims that astrology predicts real-world events.
- Full regional Muhurta rule catalogs, birth-time rectification, or Pratyantardasha.
- Replacing Astronomy Engine or adding a native ephemeris dependency.
- Database schema changes; the existing JSON snapshot and period columns are sufficient.
