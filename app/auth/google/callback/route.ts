import { findOrCreateGoogleProfile } from "@/db/repositories/profiles";
import { exchangeCode, googleConfig, redirectUri, validateIdTokenClaims, type GoogleIdentity } from "@/lib/auth/google";
import { safeRelativeReturnPath } from "@/lib/auth/paths";
import { redirectWithCookies } from "@/lib/auth/responses";
import {
  clearCookie, createSessionCookieValue, OAUTH_COOKIE, parseCookies, serializeCookie, SESSION_COOKIE,
  SESSION_MAX_AGE_SECONDS, verifyValue, type OAuthPayload,
} from "@/lib/auth/session";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const config = googleConfig();
  if (!config) return redirectWithCookies("/login?error=unconfigured");
  const clearOauth = clearCookie(OAUTH_COOKIE);
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  if (url.searchParams.get("error") || !code || !state) return redirectWithCookies("/login?error=google", [clearOauth]);

  const stored = await verifyValue<OAuthPayload>(parseCookies(request.headers.get("cookie")).get(OAUTH_COOKIE), config.sessionSecret);
  if (!stored || stored.state !== state || typeof stored.exp !== "number" || stored.exp * 1000 <= Date.now()) {
    return redirectWithCookies("/login?error=google", [clearOauth]);
  }

  let identity: GoogleIdentity | null = null;
  try {
    const idToken = await exchangeCode({
      code,
      verifier: stored.verifier,
      redirectUri: redirectUri(request.url, config.redirectUriOverride),
      clientId: config.clientId,
      clientSecret: config.clientSecret,
    });
    identity = validateIdTokenClaims(idToken, { clientId: config.clientId });
  } catch {
    identity = null;
  }
  if (!identity) return redirectWithCookies("/login?error=google", [clearOauth]);

  try {
    const profile = await findOrCreateGoogleProfile(identity);
    const session = await createSessionCookieValue({ uid: profile.id, email: profile.email, name: identity.name }, config.sessionSecret);
    return redirectWithCookies(safeRelativeReturnPath(stored.returnTo), [serializeCookie(SESSION_COOKIE, session, SESSION_MAX_AGE_SECONDS), clearOauth]);
  } catch {
    return redirectWithCookies("/login?error=service", [clearOauth]);
  }
}
