import { SourceChip } from "./source-chip";

type CalculatedSource = {
  id: "vedic" | "numerology";
  label: string;
  value: string;
  status: "calculated";
};

export function MethodSummary({ sources }: { sources: CalculatedSource[] }) {
  return (
    <section className="method-summary" aria-labelledby="method-summary-title">
      <div>
        <p className="eyebrow">CALCULATION SOURCES</p>
        <h2 id="method-summary-title">{sources.length} METHODS COMBINED</h2>
      </div>
      <div className="source-chip-row">
        {sources.map((source, index) => (
          <SourceChip
            key={source.id}
            label={source.label}
            value={source.value}
            tone={index === 0 ? "plum" : "gold"}
          />
        ))}
      </div>
    </section>
  );
}
