import { authorizeUrl, googleConfig, pkceChallenge, randomToken, redirectUri } from "@/lib/auth/google";
import { safeRelativeReturnPath } from "@/lib/auth/paths";
import { redirectWithCookies } from "@/lib/auth/responses";
import { OAUTH_COOKIE, OAUTH_MAX_AGE_SECONDS, serializeCookie, signValue, type OAuthPayload } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const config = googleConfig();
  if (!config) return redirectWithCookies("/login?error=unconfigured");
  const url = new URL(request.url);
  const state = randomToken(16);
  const verifier = randomToken(32);
  const payload: OAuthPayload = {
    state,
    verifier,
    returnTo: safeRelativeReturnPath(url.searchParams.get("return_to")),
    exp: Math.floor(Date.now() / 1000) + OAUTH_MAX_AGE_SECONDS,
  };
  const cookie = serializeCookie(OAUTH_COOKIE, await signValue(payload, config.sessionSecret), OAUTH_MAX_AGE_SECONDS);
  const location = authorizeUrl({
    clientId: config.clientId,
    redirectUri: redirectUri(request.url, config.redirectUriOverride),
    state,
    codeChallenge: await pkceChallenge(verifier),
  });
  return redirectWithCookies(location, [cookie]);
}
