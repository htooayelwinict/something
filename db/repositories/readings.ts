import { and, desc, eq } from "drizzle-orm";
import { getDb } from "@/db";
import { readings } from "@/db/schema";
import { newId } from "@/lib/ids";

export type CreateReadingInput = Omit<typeof readings.$inferInsert, "id" | "userId" | "createdAt" | "updatedAt">;

export async function createReading(userId: string, input: CreateReadingInput) {
  const db = await getDb();
  const [row] = await db.insert(readings).values({ id: newId("rdg"), userId, ...input }).returning();
  return row;
}

export async function getReading(userId: string, id: string) {
  const db = await getDb();
  return db.query.readings.findFirst({ where: and(eq(readings.userId, userId), eq(readings.id, id)) });
}

export async function listReadings(userId: string) {
  const db = await getDb();
  return db.select().from(readings).where(eq(readings.userId, userId)).orderBy(desc(readings.createdAt)).limit(40);
}

export async function completeReading(userId: string, id: string, responseText: string) {
  const db = await getDb();
  const [row] = await db.update(readings).set({ status: "complete", responseText, errorCode: null, updatedAt: new Date().toISOString() })
    .where(and(eq(readings.userId, userId), eq(readings.id, id))).returning();
  return row;
}

export async function failReading(userId: string, id: string, errorCode: string) {
  const db = await getDb();
  const [row] = await db.update(readings).set({ status: "failed", errorCode, updatedAt: new Date().toISOString() })
    .where(and(eq(readings.userId, userId), eq(readings.id, id))).returning();
  return row;
}

export async function deleteReading(userId: string, id: string) {
  const db = await getDb();
  await db.delete(readings).where(and(eq(readings.userId, userId), eq(readings.id, id)));
}
