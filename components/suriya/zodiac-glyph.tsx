import { zodiacSignsMyanmar } from "@/lib/astrology/types";
import { zodiacGlyph } from "@/lib/content/motifs";

export function ZodiacGlyph({ signIndex, size = "md", label }: { signIndex: number; size?: "sm" | "md" | "lg"; label?: string }) {
  const name = `${zodiacSignsMyanmar[((signIndex % 12) + 12) % 12]}ရာသီ`;
  return (
    <span className="zodiac-glyph" data-size={size} role="img" aria-label={label ?? name}>
      <span aria-hidden="true">{zodiacGlyph(signIndex)}</span>
    </span>
  );
}
