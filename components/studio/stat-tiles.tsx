import { toBurmeseDigits } from "@/lib/content/burmese-digits";

export function StatTiles({ tiles }: { tiles: Array<{ label: string; value: number }> }) {
  return (
    <ul className="stat-tiles" aria-label="အနှစ်ချုပ်">
      {tiles.map((tile) => <li className="stat-tile" key={tile.label}><strong>{toBurmeseDigits(tile.value)}</strong><span>{tile.label}</span></li>)}
    </ul>
  );
}
