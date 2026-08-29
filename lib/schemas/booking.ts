import { z } from "zod";
import { localDateInTimezone } from "@/lib/astrology/time";

export const BOOKING_TIMEZONE = "Asia/Yangon";
export const BOOKING_WINDOW_DAYS = 60;

export const contactChannelSchema = z.enum(["phone", "viber", "telegram", "messenger"]);
export const preferredTimeSchema = z.enum(["morning", "afternoon", "evening"]);
export const bookingTopicSchema = z.enum(["love", "career", "direction", "other"]);

const isoDateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "ရက်စွဲ မမှန်ပါ");

export const bookingRequestSchema = z.object({
  specialistId: z.string().trim().min(1, "ပညာရှင်ကို ရွေးပါ").max(60),
  name: z.string().trim().min(2, "အမည်ကို ရေးပါ").max(80, "အမည် ရှည်လွန်းပါသည်"),
  phone: z.string().trim().regex(/^\+?[\d\s-]{7,20}$/, "ဖုန်းနံပါတ် မမှန်ပါ"),
  contactChannel: contactChannelSchema,
  preferredDate: isoDateSchema,
  preferredTime: preferredTimeSchema,
  topic: bookingTopicSchema,
  note: z.string().trim().max(500, "မှတ်ချက် စာလုံး ၅၀၀ မကျော်ရပါ").optional().transform((value) => (value ? value : undefined)),
});

export type BookingRequestInput = z.infer<typeof bookingRequestSchema>;
export type ContactChannel = z.infer<typeof contactChannelSchema>;
export type PreferredTime = z.infer<typeof preferredTimeSchema>;
export type BookingTopic = z.infer<typeof bookingTopicSchema>;

function addCalendarDays(localDate: string, days: number) {
  const date = new Date(`${localDate}T12:00:00.000Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

export function bookingDateBounds(now = new Date(), timezone = BOOKING_TIMEZONE) {
  const min = localDateInTimezone(now, timezone);
  return { min, max: addCalendarDays(min, BOOKING_WINDOW_DAYS) };
}

export function isBookingDateInRange(date: string, now = new Date(), timezone = BOOKING_TIMEZONE) {
  const { min, max } = bookingDateBounds(now, timezone);
  return date >= min && date <= max;
}
