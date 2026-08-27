import { z } from "zod";
import { localDateInTimezone } from "@/lib/astrology/time";

function isRealDate(value: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return false;
  const date = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(date.valueOf()) && date.toISOString().slice(0, 10) === value;
}

function isIanaTimezone(value: string) {
  try {
    new Intl.DateTimeFormat("en-US", { timeZone: value }).format();
    return value.includes("/") || value === "UTC";
  } catch {
    return false;
  }
}

export const birthProfileSchema = z.object({
  name: z.string().trim().min(1, "အမည်ထည့်ပါ").max(80),
  birthDate: z.string().refine(isRealDate, "မွေးသက္ကရာဇ် မမှန်ပါ"),
  birthTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "မွေးချိန်အတိအကျ ထည့်ပါ"),
  birthCity: z.string().trim().min(2, "မွေးဖွားရာမြို့ ထည့်ပါ").max(100),
  latitude: z.coerce.number().finite().min(-90).max(90),
  longitude: z.coerce.number().finite().min(-180).max(180),
  timezone: z.string().trim().refine(isIanaTimezone, "IANA အချိန်ဇုန် မမှန်ပါ"),
}).superRefine((value, context) => {
  if (isRealDate(value.birthDate) && isIanaTimezone(value.timezone)
    && value.birthDate > localDateInTimezone(new Date(), value.timezone)) {
    context.addIssue({ code: "custom", path: ["birthDate"], message: "အနာဂတ်ရက် မဖြစ်ရပါ" });
  }
});

export type BirthProfileInput = z.infer<typeof birthProfileSchema>;
