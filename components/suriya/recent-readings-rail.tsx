import { BookOpenText, Clock3 } from "lucide-react";
import type { ReadingRow } from "@/db/schema";

export function RecentReadingsRail({ readings }: { readings: ReadingRow[] }) {
  return (
    <section className="recent-readings-rail" aria-labelledby="recent-readings-title">
      <div className="recent-rail-heading"><BookOpenText size={17} aria-hidden="true" /><h2 id="recent-readings-title">လတ်တလောဖတ်စာ</h2></div>
      {readings.length === 0 ? (
        <p>သိမ်းထားသော ဖတ်စာ မရှိသေးပါ။</p>
      ) : (
        <ol>
          {readings.slice(0, 6).map((reading) => (
            <li key={reading.id}>
              <a href={`/readings/${reading.id}`}>
                <strong>{reading.question || "နေ့စဉ်ဖတ်စာ"}</strong>
                <span><Clock3 size={11} aria-hidden="true" /> {reading.status === "complete" ? "ဖတ်ကြားပြီး" : reading.status === "failed" ? "ပြန်စမ်းရန်" : "တွက်ချက်နေသည်"}</span>
              </a>
            </li>
          ))}
        </ol>
      )}
      <a className="text-link" href="/readings">အားလုံး ကြည့်ရန်</a>
    </section>
  );
}
