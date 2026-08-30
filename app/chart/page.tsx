import type { Metadata } from "next";
import { ArrowRight } from "lucide-react";
import { AppShell } from "@/components/suriya/app-shell";
import { ChartKeyFacts } from "@/components/suriya/chart-key-facts";
import { DashaTimeline } from "@/components/suriya/dasha-timeline";
import { DivisionalCharts } from "@/components/suriya/divisional-charts";
import { IdentityRail } from "@/components/suriya/identity-rail";
import { MethodFootnote } from "@/components/suriya/method-footnote";
import { PanchangaStrip, panchangaView } from "@/components/suriya/panchanga-strip";
import { PlacementList } from "@/components/suriya/placement-list";
import { SouthIndianChart } from "@/components/suriya/south-indian-chart";
import { TodayConnection } from "@/components/suriya/today-connection";
import { chartBirthLabel, todayHighlights } from "@/lib/content/chart-view";
import { getDailyExperience } from "@/lib/services/daily";

export const metadata: Metadata = { title: "သင့်မွေးဇာတာ", alternates: { canonical: "/chart" } };

export default async function ChartPage() {
  const daily = await getDailyExperience();
  const { chart, insight } = daily;
  const highlights = todayHighlights(chart, insight.factors);
  return (
    <AppShell rail={daily.personalized ? <IdentityRail {...daily.identity} personalized /> : undefined}>
      <header className="page-heading chart-heading">
        <p className="eyebrow">မွေးဇာတာ · Jyotish · {daily.personalized ? "ကိုယ်ပိုင်" : "နမူနာ"}</p>
        <h1 className="page-title">သင့်မွေးဇာတာ</h1>
        <p className="page-lede">{chartBirthLabel(chart)}</p>
        <p className="chart-caption">Lahiri ayanamsa {chart.ayanamsa.toFixed(2)}° · whole-sign · mean Rahu/Ketu · {chart.version}</p>
      </header>
      <div className="chart-layout">
        <div className="chart-hero-column">
          <SouthIndianChart
            chart={chart}
            division="d1"
            size="hero"
            caption={chartBirthLabel(chart)}
            describedBy="chart-key-facts"
            highlights={highlights}
          />
          {highlights.length > 0 && (
            <p className="chart-legend">
              <span className="legend-lagna">လဂ်</span> မွေးလဂ်အိမ်
              <span className="legend-today">ယနေ့</span> ယနေ့ လ၊ ကြာသပတေး၊ စနေ ရောက်နေသော ရာသီ
            </p>
          )}
        </div>
        <div className="chart-side-column">
          <ChartKeyFacts chart={chart} id="chart-key-facts" />
          <details className="chart-data-disclosure disclosure-card surface">
            <summary><span>ဂြိုဟ်နှင့် ဒဿာ အသေးစိတ်</span><small>လိုအပ်သည့်အခါ ဖွင့်ကြည့်ရန်</small></summary>
            <div className="chart-data-content disclosure-content">
              <PlacementList chart={chart} />
              <DashaTimeline dasha={chart.dasha} now={new Date(chart.asOf)} />
            </div>
          </details>
        </div>
      </div>
      <div className="chart-actions"><a className="primary-button" href="/ask">ဤဇာတာအကြောင်း မေးရန် <ArrowRight size={15} aria-hidden="true" /></a></div>
      <TodayConnection factors={insight.factors} score={insight.score} />
      <DivisionalCharts chart={chart} />
      <PanchangaStrip title="မွေးချိန် Panchanga" data={panchangaView(chart.panchanga)} />
      <MethodFootnote version={chart.version} showChartLink={false} />
      <aside className="safety-note">
        <strong>လမ်းညွှန်အဖြစ်သာ အသုံးပြုပါ</strong>
        <p>ဤဇာတာနှင့် ဖတ်စာသည် ဆေးဘက်၊ ဥပဒေ သို့မဟုတ် ငွေကြေးပညာရှင်၏ အကြံဉာဏ်ကို အစားမထိုးပါ။</p>
      </aside>
    </AppShell>
  );
}
