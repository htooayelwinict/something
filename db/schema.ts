import { sql } from "drizzle-orm";
import { index, integer, real, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core";

const timestamps = {
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
};

export const profiles = sqliteTable("profiles", {
  id: text("id").primaryKey(),
  displayName: text("display_name").notNull(),
  email: text("email").notNull(),
  locale: text("locale").notNull().default("my"),
  authProvider: text("auth_provider", { enum: ["chatgpt", "google"] }).notNull().default("chatgpt"),
  authSubject: text("auth_subject"),
  ...timestamps,
}, (table) => [
  uniqueIndex("profiles_auth_idx").on(table.authProvider, table.authSubject),
  index("profiles_email_idx").on(table.email),
]);

export const birthProfiles = sqliteTable("birth_profiles", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => profiles.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  birthDate: text("birth_date").notNull(),
  birthTime: text("birth_time").notNull(),
  birthCity: text("birth_city").notNull(),
  latitude: real("latitude").notNull(),
  longitude: real("longitude").notNull(),
  timezone: text("timezone").notNull(),
  isActive: integer("is_active", { mode: "boolean" }).notNull().default(true),
  ...timestamps,
}, (table) => [uniqueIndex("birth_profiles_active_user_idx").on(table.userId)]);

export const readings = sqliteTable("readings", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => profiles.id, { onDelete: "cascade" }),
  birthProfileId: text("birth_profile_id").notNull().references(() => birthProfiles.id, { onDelete: "cascade" }),
  kind: text("kind", { enum: ["daily", "janma", "prashna", "muhurta"] }).notNull(),
  question: text("question"),
  periodStart: text("period_start").notNull(),
  periodEnd: text("period_end").notNull(),
  chartSnapshot: text("chart_snapshot", { mode: "json" }).$type<Record<string, unknown>>().notNull(),
  calculationVersion: text("calculation_version").notNull(),
  promptVersion: text("prompt_version").notNull(),
  responseText: text("response_text"),
  interpretationMode: text("interpretation_mode", { enum: ["deterministic", "model"] }).notNull().default("deterministic"),
  feedback: text("feedback", { enum: ["useful", "not_useful"] }),
  status: text("status", { enum: ["calculating", "generating", "complete", "failed"] }).notNull(),
  errorCode: text("error_code"),
  ...timestamps,
}, (table) => [
  index("readings_user_created_idx").on(table.userId, table.createdAt),
  index("readings_owner_id_idx").on(table.userId, table.id),
]);

export const tarotSpecialists = sqliteTable("tarot_specialists", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  initials: text("initials").notNull(),
  specialty: text("specialty").notNull(),
  experience: text("experience").notNull(),
  displayRate: text("display_rate").notNull(),
  availabilityLabel: text("availability_label").notNull(),
  tags: text("tags", { mode: "json" }).$type<string[]>().notNull(),
  location: text("location").notNull().default(""),
  sessionMinutes: integer("session_minutes").notNull().default(30),
  sortOrder: integer("sort_order").notNull().default(0),
  loginEmail: text("login_email"),
  bio: text("bio").notNull().default(""),
  photoUrl: text("photo_url"),
  isActive: integer("is_active", { mode: "boolean" }).notNull().default(true),
  ...timestamps,
}, (table) => [
  index("tarot_specialists_sort_idx").on(table.sortOrder),
  uniqueIndex("tarot_specialists_login_email_idx").on(table.loginEmail),
]);

export const tarotBookings = sqliteTable("tarot_bookings", {
  id: text("id").primaryKey(),
  userId: text("user_id").references(() => profiles.id, { onDelete: "set null" }),
  ipHash: text("ip_hash"),
  // Not a foreign key: demo specialists are bookable before the directory is seeded.
  specialistId: text("specialist_id").notNull(),
  name: text("name").notNull(),
  phone: text("phone").notNull(),
  contactChannel: text("contact_channel", { enum: ["phone", "viber", "telegram", "messenger"] }).notNull(),
  preferredDate: text("preferred_date").notNull(),
  preferredTime: text("preferred_time", { enum: ["morning", "afternoon", "evening"] }).notNull(),
  topic: text("topic", { enum: ["love", "career", "direction", "other"] }).notNull(),
  note: text("note"),
  status: text("status", { enum: ["requested", "confirmed", "completed", "cancelled"] }).notNull().default("requested"),
  staffNote: text("staff_note"),
  ...timestamps,
}, (table) => [
  index("tarot_bookings_specialist_idx").on(table.specialistId, table.createdAt),
  index("tarot_bookings_user_idx").on(table.userId, table.createdAt),
  index("tarot_bookings_ip_idx").on(table.ipHash, table.createdAt),
]);

export const periodReadings = sqliteTable("period_readings", {
  id: text("id").primaryKey(),
  // "demo" for guests; no FK so shared demo rows are allowed.
  userId: text("user_id").notNull(),
  kind: text("kind", { enum: ["daily", "weekly", "monthly"] }).notNull(),
  periodKey: text("period_key").notNull(),
  periodStart: text("period_start").notNull(),
  periodEnd: text("period_end").notNull(),
  evidence: text("evidence", { mode: "json" }).$type<Record<string, unknown>>().notNull(),
  calculationVersion: text("calculation_version").notNull(),
  rulesetVersion: text("ruleset_version").notNull(),
  promptVersion: text("prompt_version").notNull(),
  responseText: text("response_text"),
  interpretationMode: text("interpretation_mode", { enum: ["deterministic", "model"] }).notNull().default("deterministic"),
  status: text("status", { enum: ["generating", "complete", "failed"] }).notNull(),
  errorCode: text("error_code"),
  ...timestamps,
}, (table) => [
  uniqueIndex("period_readings_key_idx").on(table.userId, table.kind, table.periodKey, table.promptVersion),
  index("period_readings_user_idx").on(table.userId, table.createdAt),
]);

export type ProfileRow = typeof profiles.$inferSelect;
export type BirthProfileRow = typeof birthProfiles.$inferSelect;
export type ReadingRow = typeof readings.$inferSelect;
export type TarotSpecialistRow = typeof tarotSpecialists.$inferSelect;
export type TarotBookingRow = typeof tarotBookings.$inferSelect;
export type PeriodReadingRow = typeof periodReadings.$inferSelect;
