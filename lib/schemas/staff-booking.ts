import { z } from "zod";

export const bookingStatusSchema = z.enum(["requested", "confirmed", "completed", "cancelled"]);

export const bookingStaffPatchSchema = z.object({
  status: bookingStatusSchema.optional(),
  staffNote: z.string().trim().max(500, "မှတ်ချက် စာလုံး ၅၀၀ မကျော်ရပါ").transform((value) => value || null).optional(),
}).strict().refine((value) => value.status !== undefined || value.staffNote !== undefined, { message: "ပြောင်းလဲမှု မရှိပါ" });

export type BookingStaffPatch = z.infer<typeof bookingStaffPatchSchema>;
