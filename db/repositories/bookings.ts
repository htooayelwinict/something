import { and, asc, desc, eq, gte, inArray, sql } from "drizzle-orm";
import { getDb } from "@/db";
import { tarotBookings } from "@/db/schema";
import { newId } from "@/lib/ids";

export type BookingInsert = Omit<typeof tarotBookings.$inferInsert, "id" | "createdAt" | "updatedAt" | "status">;

export async function createBooking(input: BookingInsert) {
  const db = await getDb();
  const now = new Date().toISOString();
  const [row] = await db.insert(tarotBookings).values({ id: newId("bkg"), ...input, createdAt: now, updatedAt: now }).returning();
  return row;
}

export async function getBooking(id: string) {
  const db = await getDb();
  return db.query.tarotBookings.findFirst({ where: eq(tarotBookings.id, id) });
}

/** Count bookings made by a signed-in user or, for guests, a hashed IP since `sinceIso`. */
export async function countRecentBookings(key: { userId?: string; ipHash?: string }, sinceIso: string) {
  const db = await getDb();
  const owner = key.userId ? eq(tarotBookings.userId, key.userId) : eq(tarotBookings.ipHash, key.ipHash ?? "");
  const [row] = await db.select({ count: sql<number>`count(*)` }).from(tarotBookings)
    .where(and(owner, gte(tarotBookings.createdAt, sinceIso)));
  return Number(row?.count ?? 0);
}

export type BookingStatus = (typeof tarotBookings.$inferSelect)["status"];
export type BookingScope = { kind: "all" } | { kind: "specialist"; specialistId: string };
export type BookingFilters = { statuses?: BookingStatus[]; specialistId?: string; fromDate?: string; limit?: number };

function scopePredicate(scope: BookingScope) {
  return scope.kind === "specialist" ? eq(tarotBookings.specialistId, scope.specialistId) : undefined;
}

export async function listBookingsForStaff(scope: BookingScope, filters: BookingFilters = {}) {
  const db = await getDb();
  return db.select().from(tarotBookings)
    .where(and(
      scopePredicate(scope),
      filters.statuses && filters.statuses.length > 0 ? inArray(tarotBookings.status, filters.statuses) : undefined,
      scope.kind === "all" && filters.specialistId ? eq(tarotBookings.specialistId, filters.specialistId) : undefined,
      filters.fromDate ? gte(tarotBookings.preferredDate, filters.fromDate) : undefined,
    ))
    .orderBy(asc(tarotBookings.preferredDate), desc(tarotBookings.createdAt))
    .limit(filters.limit ?? 200);
}

export async function getBookingForStaff(id: string, scope: BookingScope) {
  const db = await getDb();
  return db.query.tarotBookings.findFirst({ where: and(eq(tarotBookings.id, id), scopePredicate(scope)) });
}

export async function updateBookingForStaff(id: string, scope: BookingScope, patch: { status?: BookingStatus; staffNote?: string | null }) {
  const db = await getDb();
  const [row] = await db.update(tarotBookings).set({ ...patch, updatedAt: new Date().toISOString() })
    .where(and(eq(tarotBookings.id, id), scopePredicate(scope))).returning();
  return row ?? null;
}

export async function countBookingsByStatus(scope: BookingScope): Promise<Record<BookingStatus, number>> {
  const db = await getDb();
  const rows = await db.select({ status: tarotBookings.status, count: sql<number>`count(*)` }).from(tarotBookings)
    .where(scopePredicate(scope)).groupBy(tarotBookings.status);
  const counts: Record<BookingStatus, number> = { requested: 0, confirmed: 0, completed: 0, cancelled: 0 };
  for (const row of rows) counts[row.status] = Number(row.count);
  return counts;
}
