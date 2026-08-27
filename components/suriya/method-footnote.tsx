const methodChips = ["Jyotish · Lahiri", "Whole-sign", "Mean Rahu/Ketu", "Vimshottari"] as const;

export function MethodFootnote({ version, chartHref = "/chart", showChartLink = true }: {
  version: string;
  chartHref?: string;
  showChartLink?: boolean;
}) {
  return (
    <footer className="method-footnote" aria-label="တွက်ချက်နည်း">
      <p>
        <span>တွက်ချက်နည်း</span>
        {methodChips.map((chip) => <code key={chip}>{chip}</code>)}
        <code>{version}</code>
      </p>
      {showChartLink && <a className="text-link" href={chartHref}>မွေးဇာတာကို ကြည့်ရန်</a>}
    </footer>
  );
}
