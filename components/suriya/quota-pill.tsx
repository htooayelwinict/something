import { toBurmeseDigits } from "@/lib/content/burmese-digits";

export function QuotaPill({ used, limit }: { used: number; limit: number }) {
  const remaining = Math.max(0, limit - used);
  return (
    <span className="quota-pill" data-empty={remaining === 0 ? "true" : undefined}>
      ယနေ့ ကျန် {toBurmeseDigits(remaining)} / {toBurmeseDigits(limit)}
    </span>
  );
}
