import { moonPhaseFraction } from "@/lib/content/motifs";
import { toBurmeseDigits } from "@/lib/content/burmese-digits";

/** SVG Moon whose lit portion follows today's tithi. */
export function MoonPhase({ tithi, size = 44 }: { tithi: { number: number; paksha: "Shukla" | "Krishna"; name?: string }; size?: number }) {
  const fraction = moonPhaseFraction(tithi);
  const waxing = tithi.paksha === "Shukla";
  // Terminator x-radius: +r at full, -r at new; sign flips for waxing vs waning.
  const r = 20;
  const k = (fraction * 2 - 1) * r;
  const sweepOuter = waxing ? 1 : 0;
  const path = waxing
    ? `M 24 4 A ${r} ${r} 0 0 ${sweepOuter} 24 44 A ${Math.abs(k)} ${r} 0 0 ${k >= 0 ? 0 : 1} 24 4 Z`
    : `M 24 4 A ${r} ${r} 0 0 ${sweepOuter} 24 44 A ${Math.abs(k)} ${r} 0 0 ${k >= 0 ? 1 : 0} 24 4 Z`;
  const label = `${waxing ? "လဆန်း" : "လဆုတ်"} ${toBurmeseDigits(tithi.number)} ရက်`;
  return (
    <svg className="moon-phase" width={size} height={size} viewBox="0 0 48 48" role="img" aria-label={label}>
      <circle cx="24" cy="24" r="20" className="moon-dark" />
      <path d={path} className="moon-lit" />
      <circle cx="24" cy="24" r="20" className="moon-rim" />
    </svg>
  );
}
