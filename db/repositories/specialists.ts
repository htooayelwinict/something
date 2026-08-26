import { asc } from "drizzle-orm";
import { getDb } from "@/db";
import { tarotSpecialists } from "@/db/schema";

export async function listSpecialists() {
  const db = await getDb();
  return db.select().from(tarotSpecialists).orderBy(asc(tarotSpecialists.sortOrder));
}
