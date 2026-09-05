import { isSameOriginRequest } from "@/lib/auth/csrf";
import { getCurrentUser } from "@/lib/auth/current-user";
import { staffForUser, type Staff } from "@/lib/auth/staff";

export { firstIssueMessage, isUniqueViolation } from "./errors";

export const noStore = { "cache-control": "private, no-store" };

export function jsonError(error: string, status: number) {
  return Response.json({ error }, { status, headers: noStore });
}

/** Authenticate (401), authorise (403), and same-origin check (403) a Studio mutation. */
export async function authorizeStudioRequest(request: Request): Promise<{ staff: Staff } | { response: Response }> {
  const user = await getCurrentUser();
  if (!user) return { response: jsonError("unauthorized", 401) };
  const staff = await staffForUser(user);
  if (!staff) return { response: jsonError("forbidden", 403) };
  if (!isSameOriginRequest(request.headers, request.url)) return { response: jsonError("forbidden", 403) };
  return { staff };
}
