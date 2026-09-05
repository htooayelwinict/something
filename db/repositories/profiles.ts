import { and, eq, sql } from "drizzle-orm";
import type { AppUser } from "@/lib/auth/current-user";
import { resolveGoogleProfile, type GoogleProfileInput } from "@/lib/auth/profile-resolution";
import type { BirthProfileInput } from "@/lib/schemas/profile";
import { newId } from "@/lib/ids";
import { getDb } from "@/db";
import { birthProfiles, profiles } from "@/db/schema";

export async function upsertProfile(user: AppUser) {
  const db = await getDb();
  await db.insert(profiles).values({ id: user.userId, displayName: user.displayName, email: user.email })
    .onConflictDoUpdate({ target: profiles.id, set: { displayName: user.displayName, email: user.email, updatedAt: new Date().toISOString() } });
}

/** Resolve the profile for a verified Google identity: reuse, adopt a legacy ChatGPT row by email, or create. */
export async function findOrCreateGoogleProfile(identity: GoogleProfileInput) {
  const db = await getDb();
  const bySubject = await db.query.profiles.findFirst({
    where: and(eq(profiles.authProvider, "google"), eq(profiles.authSubject, identity.sub)),
  });
  const legacyByEmail = bySubject ? null : await db.query.profiles.findFirst({
    where: and(eq(profiles.authProvider, "chatgpt"), sql`lower(${profiles.email}) = ${identity.email.toLowerCase()}`),
  });
  const resolution = resolveGoogleProfile(identity, { bySubject: bySubject ?? null, legacyByEmail: legacyByEmail ?? null });
  const now = new Date().toISOString();
  if (resolution.action === "create") {
    const [row] = await db.insert(profiles).values({
      id: newId("usr"), authProvider: "google", authSubject: resolution.authSubject,
      displayName: resolution.displayName, email: resolution.email, createdAt: now, updatedAt: now,
    }).returning();
    return row;
  }
  const patch = resolution.action === "adopt"
    ? { authProvider: "google" as const, authSubject: resolution.authSubject, displayName: resolution.displayName, email: resolution.email, updatedAt: now }
    : { displayName: resolution.displayName, email: resolution.email, updatedAt: now };
  const [row] = await db.update(profiles).set(patch).where(eq(profiles.id, resolution.id)).returning();
  return row;
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
