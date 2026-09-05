import { z } from "zod";

const tagList = z.union([z.array(z.string()), z.string()])
  .transform((value) => (Array.isArray(value) ? value : value.split(/[,၊]/)).map((tag) => tag.trim()).filter(Boolean))
  .pipe(z.array(z.string().max(24, "အကြောင်းအရာ ရှည်လွန်းပါသည်")).min(1, "အကြောင်းအရာ တစ်ခုအနည်းဆုံး ထည့်ပါ").max(6, "အကြောင်းအရာ ၆ ခုအထိသာ"));

const httpsUrl = z.string().trim().max(500, "ဓာတ်ပုံလင့်ခ် ရှည်လွန်းပါသည်")
  .refine((value) => value === "" || /^https:\/\/\S+$/.test(value), "ဓာတ်ပုံလင့်ခ်သည် https:// ဖြင့် စရပါမည်")
  .transform((value) => value || null);

const optionalEmail = z.string().trim().toLowerCase().max(120, "အီးမေးလ် ရှည်လွန်းပါသည်")
  .refine((value) => value === "" || z.email().safeParse(value).success, "အီးမေးလ် မမှန်ပါ")
  .transform((value) => value || null);

export const tellerProfileSchema = z.object({
  name: z.string().trim().min(2, "အမည်ကို ရေးပါ").max(80, "အမည် ရှည်လွန်းပါသည်"),
  initials: z.string().trim().min(1, "အတိုကောက် ၁–၃ လုံး ရေးပါ").max(3, "အတိုကောက် ၁–၃ လုံး ရေးပါ"),
  specialty: z.string().trim().min(1, "အထူးပြုကို ရေးပါ").max(80, "အထူးပြု ရှည်လွန်းပါသည်"),
  experience: z.string().trim().min(1, "အတွေ့အကြုံကို ရေးပါ").max(60, "အတွေ့အကြုံ ရှည်လွန်းပါသည်"),
  displayRate: z.string().trim().min(1, "ပြသနှုန်းကို ရေးပါ").max(60, "ပြသနှုန်း ရှည်လွန်းပါသည်"),
  availabilityLabel: z.string().trim().min(1, "ရနိုင်သောရက်များကို ရေးပါ").max(80, "ရနိုင်သောရက် ရှည်လွန်းပါသည်"),
  tags: tagList,
  location: z.string().trim().max(80, "နေရာ ရှည်လွန်းပါသည်"),
  sessionMinutes: z.number().int().min(15, "ကြာချိန် ၁၅–၁၈၀ မိနစ်").max(180, "ကြာချိန် ၁၅–၁၈၀ မိနစ်"),
  bio: z.string().trim().max(600, "မိတ်ဆက် စာလုံး ၆၀၀ မကျော်ရပါ"),
  photoUrl: httpsUrl,
}).strict();

export const tellerEditorSchema = tellerProfileSchema.extend({
  loginEmail: optionalEmail,
  isActive: z.boolean(),
  sortOrder: z.number().int().min(0, "အစီအစဉ် ၀–၉၉၉").max(999, "အစီအစဉ် ၀–၉၉၉"),
}).strict();

export const tellerCreateSchema = tellerEditorSchema.extend({
  id: z.string().trim().regex(/^[a-z0-9][a-z0-9_-]{1,39}$/, "ID တွင် စာလုံးသေး a-z၊ ဂဏန်း၊ - နှင့် _ သာ ပါရပြီး ၂–၄၀ လုံး ဖြစ်ရပါမည်"),
}).strict();

export type TellerProfileInput = z.infer<typeof tellerProfileSchema>;
export type TellerEditorInput = z.infer<typeof tellerEditorSchema>;
export type TellerCreateInput = z.infer<typeof tellerCreateSchema>;
