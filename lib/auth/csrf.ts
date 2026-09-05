/** Browsers send sec-fetch-site on every fetch; origin is the fallback for older clients. */
export function isSameOriginRequest(headers: Headers, requestUrl: string): boolean {
  const fetchSite = headers.get("sec-fetch-site");
  if (fetchSite) return fetchSite === "same-origin" || fetchSite === "none";
  const origin = headers.get("origin");
  if (!origin) return false;
  try {
    return new URL(origin).origin === new URL(requestUrl).origin;
  } catch {
    return false;
  }
}
