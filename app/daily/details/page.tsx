import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

/** Compatibility route: the natal chart now lives at /chart. */
export default function DailyDetailsPage() {
  redirect("/chart");
}
