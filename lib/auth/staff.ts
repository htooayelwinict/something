import { redirect } from "next/navigation";
import { findSpecialistByLoginEmail } from "@/db/repositories/specialists";
import { getCurrentUser, type AppUser } from "./current-user";
import { loginPath } from "./paths";
import { parseAdminEmails, resolveStaff, type Staff } from "./roles";

export { bookingScope, parseAdminEmails, resolveStaff, type Staff } from "./roles";

/** Roles are re-derived on every request; nothing role-related is trusted from the cookie. */
export async function staffForUser(user: AppUser): Promise<Staff | null> {
  const admins = parseAdminEmails(process.env.SITE_ADMIN_EMAILS);
  if (admins.has(user.email.trim().toLowerCase())) return { role: "editor", user };
  const specialist = await findSpecialistByLoginEmail(user.email).catch(() => null);
  return resolveStaff(user, admins, specialist?.id ?? null);
}

export async function getStaff(): Promise<Staff | null> {
  const user = await getCurrentUser();
  return user ? staffForUser(user) : null;
}

export async function requireStaff(returnTo: string): Promise<Staff | { role: "none"; user: AppUser }> {
  const user = await getCurrentUser();
  if (!user) redirect(loginPath(returnTo));
  return (await staffForUser(user)) ?? { role: "none", user };
}
