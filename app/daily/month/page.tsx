import type { Metadata } from "next";
import { PeriodPage } from "@/components/suriya/period-page";

export const metadata: Metadata = { title: "လစဉ်ဖတ်စာ", alternates: { canonical: "/daily/month" } };
export const dynamic = "force-dynamic";

export default function MonthlyPage() {
  return <PeriodPage kind="monthly" path="/daily/month" />;
}
