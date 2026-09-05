import type { BookingScope } from "@/db/repositories/bookings";
import type { AppUser } from "./current-user";

export type Staff =
  | { role: "editor"; user: AppUser }
  | { role: "teller"; user: AppUser; specialistId: string };

export function parseAdminEmails(value: string | null | undefined): Set<string> {
  return new Set((value ?? "").split(",").map((item) => item.trim().toLowerCase()).filter(Boolean));
}

export function resolveStaff(user: AppUser | null, adminEmails: Set<string>, specialistId: string | null): Staff | null {
  if (!user) return null;
  if (adminEmails.has(user.email.trim().toLowerCase())) return { role: "editor", user };
  if (specialistId) return { role: "teller", user, specialistId };
  return null;
}

export function bookingScope(staff: Staff): BookingScope {
  return staff.role === "editor" ? { kind: "all" } : { kind: "specialist", specialistId: staff.specialistId };
}
