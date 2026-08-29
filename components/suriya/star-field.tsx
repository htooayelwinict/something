import { starFieldPoints } from "@/lib/content/motifs";

const stars = starFieldPoints(2026, 140);

/** Fixed, decorative night sky behind the whole shell. Deterministic so SSR and hydration match. */
export function StarField() {
  return (
    <svg className="star-field" viewBox="0 0 100 100" preserveAspectRatio="xMidYMid slice" aria-hidden="true" focusable="false">
      {stars.map((star, index) => (
        <circle key={index} cx={star.x} cy={star.y} r={star.r * 0.12} className={star.twinkle ? "star star-twinkle" : "star"} style={star.twinkle ? { animationDelay: `${(index % 7) * 0.9}s` } : undefined} />
      ))}
    </svg>
  );
}
