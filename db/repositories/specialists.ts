import { and, asc, eq } from "drizzle-orm";
import { getDb } from "@/db";
import { tarotSpecialists } from "@/db/schema";

type Options = { includeInactive?: boolean };

export type SpecialistInsert = Omit<typeof tarotSpecialists.$inferInsert, "createdAt" | "updatedAt">;
export type SpecialistPatch = Partial<Omit<SpecialistInsert, "id">>;

export async function listSpecialists({ includeInactive = false }: Options = {}) {
  const db = await getDb();
  return db.select().from(tarotSpecialists)
    .where(includeInactive ? undefined : eq(tarotSpecialists.isActive, true))
    .orderBy(asc(tarotSpecialists.sortOrder), asc(tarotSpecialists.name));
}

export async function getSpecialist(id: string, { includeInactive = false }: Options = {}) {
  const db = await getDb();
  return db.query.tarotSpecialists.findFirst({
    where: includeInactive ? eq(tarotSpecialists.id, id) : and(eq(tarotSpecialists.id, id), eq(tarotSpecialists.isActive, true)),
  });
}

export async function findSpecialistByLoginEmail(email: string) {
  const db = await getDb();
  return db.query.tarotSpecialists.findFirst({ where: eq(tarotSpecialists.loginEmail, email.trim().toLowerCase()) });
}

export async function createSpecialist(input: SpecialistInsert) {
  const db = await getDb();
  const now = new Date().toISOString();
  const [row] = await db.insert(tarotSpecialists).values({ ...input, createdAt: now, updatedAt: now }).returning();
  return row;
}

export async function updateSpecialist(id: string, patch: SpecialistPatch) {
  const db = await getDb();
  const [row] = await db.update(tarotSpecialists).set({ ...patch, updatedAt: new Date().toISOString() })
    .where(eq(tarotSpecialists.id, id)).returning();
  return row ?? null;
}
