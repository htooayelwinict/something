export function CosmicMetric({
  label,
  value,
  description,
  tone = "paper",
}: {
  label: string;
  value: string;
  description: string;
  tone?: "paper" | "green" | "lilac";
}) {
  return (
    <article className="cosmic-metric" data-tone={tone}>
      <p><strong>{label}</strong></p>
      <strong className="cosmic-metric-value">{value}</strong>
      <span>{description}</span>
    </article>
  );
}
