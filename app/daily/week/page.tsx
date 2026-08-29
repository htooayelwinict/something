import type { Metadata } from "next";
import { PeriodPage } from "@/components/suriya/period-page";

export const metadata: Metadata = { title: "အပတ်စဉ်ဖတ်စာ", alternates: { canonical: "/daily/week" } };
export const dynamic = "force-dynamic";

export default function WeeklyPage() {
  return <PeriodPage kind="weekly" path="/daily/week" />;
}
