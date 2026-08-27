import { z } from "zod";

const questionSchema = z.string().trim().min(5, "မေးခွန်းကို ပိုမိုပြည့်စုံစွာ ရေးပါ").max(500, "မေးခွန်းသည် စာလုံး ၅၀၀ မကျော်ရပါ");
const isoDateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "ရက်စွဲ မမှန်ပါ").refine((value) => {
  const date = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(date.valueOf()) && date.toISOString().slice(0, 10) === value;
}, "ရက်စွဲ မမှန်ပါ");

export const readingTechniqueSchema = z.enum(["janma", "prashna", "muhurta"]);
export const muhurtaEventTypeSchema = z.enum(["general", "work", "relationship", "travel"]);

export const janmaReadingRequestSchema = z.object({
  kind: z.literal("janma"),
  question: questionSchema,
});

export const prashnaReadingRequestSchema = z.object({
  kind: z.literal("prashna"),
  question: questionSchema,
});

export const muhurtaReadingRequestSchema = z.object({
  kind: z.literal("muhurta"),
  question: questionSchema,
  targetDate: isoDateSchema,
  eventType: muhurtaEventTypeSchema,
});

export const readingRequestSchema = z.discriminatedUnion("kind", [
  janmaReadingRequestSchema,
  prashnaReadingRequestSchema,
  muhurtaReadingRequestSchema,
]);

// Stored v1 readings do not contain the new Muhurta request fields.
export const readingInterpretationSchema = z.object({
  kind: readingTechniqueSchema,
  question: questionSchema,
});

export type ReadingTechniqueId = z.infer<typeof readingTechniqueSchema>;
export type MuhurtaEventTypeInput = z.infer<typeof muhurtaEventTypeSchema>;
export type JanmaReadingRequestInput = z.infer<typeof janmaReadingRequestSchema>;
export type PrashnaReadingRequestInput = z.infer<typeof prashnaReadingRequestSchema>;
export type MuhurtaReadingRequestInput = z.infer<typeof muhurtaReadingRequestSchema>;
export type ReadingRequestInput = z.infer<typeof readingRequestSchema>;
export type ReadingInterpretationInput = z.infer<typeof readingInterpretationSchema>;
