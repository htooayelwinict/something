import { and, eq } from "drizzle-orm";
import { getDb } from "@/db";
import { periodReadings } from "@/db/schema";
import { newId } from "@/lib/ids";

export type PeriodReadingInsert = Omit<typeof periodReadings.$inferInsert, "id" | "createdAt" | "updatedAt" | "status" | "responseText" | "errorCode">;

export async function findPeriodReading(userId: string, kind: "daily" | "weekly" | "monthly", periodKey: string, promptVersion: string) {
  const db = await getDb();
  return db.query.periodReadings.findFirst({
    where: and(eq(periodReadings.userId, userId), eq(periodReadings.kind, kind), eq(periodReadings.periodKey, periodKey), eq(periodReadings.promptVersion, promptVersion)),
  });
}

/** Insert a generating row; if another request won the race, return its row instead. */
export async function createPeriodReading(input: PeriodReadingInsert) {
  const db = await getDb();
  const now = new Date().toISOString();
  await db.insert(periodReadings).values({ id: newId("prd"), ...input, status: "generating", createdAt: now, updatedAt: now }).onConflictDoNothing();
  return findPeriodReading(input.userId, input.kind, input.periodKey, input.promptVersion);
}

export async function resetPeriodReading(id: string) {
  const db = await getDb();
  await db.update(periodReadings).set({ status: "generating", responseText: null, errorCode: null, updatedAt: new Date().toISOString() }).where(eq(periodReadings.id, id));
}

export async function completePeriodReading(id: string, responseText: string, interpretationMode: "deterministic" | "model") {
  const db = await getDb();
  await db.update(periodReadings).set({ status: "complete", responseText, interpretationMode, errorCode: null, updatedAt: new Date().toISOString() }).where(eq(periodReadings.id, id));
}

export async function failPeriodReading(id: string, errorCode: string) {
  const db = await getDb();
  await db.update(periodReadings).set({ status: "failed", errorCode, updatedAt: new Date().toISOString() }).where(eq(periodReadings.id, id));
}
