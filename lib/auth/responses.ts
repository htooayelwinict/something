/** 302 with cookies; `Response.redirect` is not used because its headers are immutable. */
export function redirectWithCookies(location: string, cookies: string[] = []): Response {
  const headers = new Headers({ location, "cache-control": "no-store" });
  for (const cookie of cookies) headers.append("set-cookie", cookie);
  return new Response(null, { status: 302, headers });
}
