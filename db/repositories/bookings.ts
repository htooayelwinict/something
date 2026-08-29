import { and, eq, gte, sql } from "drizzle-orm";
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
