import { z } from "zod";

export const readingFeedbackSchema = z.object({
  value: z.enum(["useful", "not_useful"]),
});

export type ReadingFeedback = z.infer<typeof readingFeedbackSchema>["value"];
