import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { loginPath } from "./paths";
import { parseCookies, SESSION_COOKIE, verifySessionCookieValue } from "./session";

export type AppUser = {
  userId: string;
  displayName: string;
  email: string;
  fullName: string | null;
};

export async function getCurrentUser(): Promise<AppUser | null> {
  const secret = process.env.SESSION_SECRET?.trim();
  if (!secret) return null;
  const requestHeaders = await headers();
  const session = await verifySessionCookieValue(parseCookies(requestHeaders.get("cookie")).get(SESSION_COOKIE), secret);
  if (!session) return null;
  return { userId: session.uid, displayName: session.name ?? session.email, email: session.email, fullName: session.name };
}

export async function requireUser(returnTo: string): Promise<AppUser> {
  const user = await getCurrentUser();
  if (user) return user;
  redirect(loginPath(returnTo));
}
