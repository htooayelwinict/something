import { and, eq } from "drizzle-orm";
import type { ChatGPTUser } from "@/app/chatgpt-auth";
import type { BirthProfileInput } from "@/lib/schemas/profile";
import { newId } from "@/lib/ids";
import { getDb } from "@/db";
import { birthProfiles, profiles } from "@/db/schema";

export async function upsertProfile(user: ChatGPTUser) {
  const db = await getDb();
  await db.insert(profiles).values({ id: user.userId, displayName: user.displayName, email: user.email })
    .onConflictDoUpdate({ target: profiles.id, set: { displayName: user.displayName, email: user.email, updatedAt: new Date().toISOString() } });
}

export async function getBirthProfile(userId: string) {
  const db = await getDb();
  return db.query.birthProfiles.findFirst({ where: and(eq(birthProfiles.userId, userId), eq(birthProfiles.isActive, true)) });
}

export async function saveBirthProfile(userId: string, input: BirthProfileInput) {
  const db = await getDb();
  const existing = await getBirthProfile(userId);
  const values = {
    userId, name: input.name, birthDate: input.birthDate, birthTime: input.birthTime, birthCity: input.birthCity,
    latitude: input.latitude, longitude: input.longitude, timezone: input.timezone, isActive: true, updatedAt: new Date().toISOString(),
  };
  if (existing) {
    const [updated] = await db.update(birthProfiles).set(values)
      .where(and(eq(birthProfiles.id, existing.id), eq(birthProfiles.userId, userId))).returning();
    return updated;
  }
  const [created] = await db.insert(birthProfiles).values({ id: newId("bpr"), ...values }).returning();
  return created;
}

export async function deleteAccountData(userId: string) {
  const db = await getDb();
  await db.delete(profiles).where(eq(profiles.id, userId));
}
