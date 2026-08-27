export function CosmicMetric({
  label,
  eyebrow,
  value,
  description,
  tone = "paper",
}: {
  label: string;
  eyebrow?: string;
  value: string;
  description: string;
  tone?: "paper" | "green" | "lilac";
}) {
  return (
    <article className="cosmic-metric" data-tone={tone}>
      <p><strong>{label}</strong>{eyebrow && <small>{eyebrow}</small>}</p>
      <strong className="cosmic-metric-value">{value}</strong>
      <span>{description}</span>
    </article>
  );
}
