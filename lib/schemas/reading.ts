import { z } from "zod";

export const readingRequestSchema = z.object({
  kind: z.enum(["janma", "prashna", "muhurta"]),
  question: z.string().trim().min(5, "မေးခွန်းကို ပိုမိုပြည့်စုံစွာ ရေးပါ").max(500, "မေးခွန်းသည် စာလုံး ၅၀၀ မကျော်ရပါ"),
});

export type ReadingRequestInput = z.infer<typeof readingRequestSchema>;
