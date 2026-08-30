import { toBurmeseDigits } from "@/lib/content/burmese-digits";

/** Astrolabe-style score dial: gold arc, 12 tick marks, a needle and the number. */
export function Dial({ score, label, size = 96 }: { score: number; label: string; size?: number }) {
  const clamped = Math.max(0, Math.min(100, score));
  const angle = -120 + (clamped / 100) * 240;
  const ticks = Array.from({ length: 13 }, (_, index) => -120 + index * 20);
  const r = 40;
  const polar = (deg: number, radius: number) => {
    const rad = ((deg - 90) * Math.PI) / 180;
    return [50 + radius * Math.cos(rad), 50 + radius * Math.sin(rad)] as const;
  };
  const arc = (from: number, to: number) => {
    const [x1, y1] = polar(from, r);
    const [x2, y2] = polar(to, r);
    return `M ${x1} ${y1} A ${r} ${r} 0 ${to - from > 180 ? 1 : 0} 1 ${x2} ${y2}`;
  };
  const [nx, ny] = polar(angle, 30);
  return (
    <svg className="dial" width={size} height={size} viewBox="0 0 100 100" role="img" aria-label={`${label} ${toBurmeseDigits(clamped)} အမှတ်`}>
      <path d={arc(-120, 120)} className="dial-track" />
      {clamped > 0 && <path d={arc(-120, angle)} className="dial-arc" />}
      {ticks.map((tick) => {
        const [x1, y1] = polar(tick, 44);
        const [x2, y2] = polar(tick, 48);
        return <line key={tick} x1={x1} y1={y1} x2={x2} y2={y2} className="dial-tick" />;
      })}
      <line x1="50" y1="50" x2={nx} y2={ny} className="dial-needle" />
      <circle cx="50" cy="50" r="3" className="dial-hub" />
      <text x="50" y="80" textAnchor="middle" className="dial-value">{toBurmeseDigits(clamped)}</text>
    </svg>
  );
}
