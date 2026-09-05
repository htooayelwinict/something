const RESERVED_PREFIX = "/auth/";

export function safeRelativeReturnPath(value: string | null | undefined): string {
  if (!value || !value.startsWith("/") || value.startsWith("//")) return "/";
  let url: URL;
  try {
    url = new URL(value, "https://app.local");
  } catch {
    return "/";
  }
  if (url.origin !== "https://app.local") return "/";
  if (url.pathname.startsWith(RESERVED_PREFIX) || url.pathname === "/login") return "/";
  return `${url.pathname}${url.search}${url.hash}`;
}

export function loginPath(returnTo: string): string {
  return `/login?return_to=${encodeURIComponent(safeRelativeReturnPath(returnTo))}`;
}

export function signOutPath(returnTo = "/"): string {
  return `/auth/signout?return_to=${encodeURIComponent(safeRelativeReturnPath(returnTo))}`;
}

export function googleStartPath(returnTo: string): string {
  return `/auth/google/start?return_to=${encodeURIComponent(safeRelativeReturnPath(returnTo))}`;
}
