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
      <p>{label}</p>
      <strong>{value}</strong>
      <span>{description}</span>
    </article>
  );
}
