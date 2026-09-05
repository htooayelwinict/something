import { safeRelativeReturnPath } from "@/lib/auth/paths";
import { redirectWithCookies } from "@/lib/auth/responses";
import { clearCookie, SESSION_COOKIE } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const url = new URL(request.url);
  return redirectWithCookies(safeRelativeReturnPath(url.searchParams.get("return_to")), [clearCookie(SESSION_COOKIE)]);
}
