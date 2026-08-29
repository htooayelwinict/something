export type ReadingTechnique = {
  id: "janma" | "prashna" | "muhurta";
  title: string;
  description: string;
};

export type TarotSpecialist = {
  id: string;
  name: string;
  initials: string;
  specialty: string;
  experience: string;
  rate: string;
  availability: string;
  tags: string[];
  location: string;
  sessionMinutes: number;
};

export const demoDailyInsight = {
  score: 78,
  title: "စိတ်ရှင်းလင်းပြီး ဆုံးဖြတ်ချက်ကောင်းများ ချနိုင်မည့်နေ့",
  summary: "လ၏တည်နေရာက အာရုံစူးစိုက်မှုကို အားပေးနေပါတယ်။ အလျင်စလို မဆုံးဖြတ်ဘဲ အရေးကြီးဆုံးအလုပ်တစ်ခုကို ဦးစားပေးပါ။",
  favorableWindow: "နံနက် ၉:၄၀ — ၁၁:၁၅",
  moonSign: "ဝृषभ · ပြိဿရာသီ",
  energy: "တည်ငြိမ်",
  focus: "စီမံကိန်းနှင့် ဆက်သွယ်ရေး",
  categories: { career: 72, relationships: 66, focus: 78, energy: 70, caution: 38 },
  timingStatus: "တွက်ချက်ပြီး",
  horaLord: "Mercury",
  dateLabel: "ဗုဒ္ဓဟူး · ဩဂုတ် ၂၆",
} as const;

export const readingTechniques: ReadingTechnique[] = [
  { id: "janma", title: "မွေးဇာတာဖတ်ခြင်း", description: "မွေးချိန်ဇာတာကို အခြေခံ၍ ရေရှည်အမြင်ရယူရန်" },
  { id: "prashna", title: "မေးခွန်းဇာတာ", description: "ယခုမေးခွန်းနှင့် မေးသည့်အချိန်ကို အခြေခံ၍ ဖတ်ရန်" },
  { id: "muhurta", title: "အချိန်ကောင်းရွေးခြင်း", description: "လုပ်ငန်းတစ်ခုစတင်ရန် သင့်လျော်သောအချိန်ကို ကြည့်ရန်" },
];

export const demoSpecialists: TarotSpecialist[] = [
  {
    id: "thiri", name: "သီရိလမင်း", initials: "TL", specialty: "Tarot & Relationship Guidance",
    experience: "အတွေ့အကြုံ ၆ နှစ်", rate: "၃၀ မိနစ် · ၂၅,၀၀၀ ကျပ်", availability: "စနေ · တနင်္ဂနွေ",
    tags: ["ချစ်ရေး", "အလုပ်အကိုင်", "စိတ်ခံစားမှု"], location: "ရန်ကုန် · ကမာရွတ်", sessionMinutes: 30,
  },
  {
    id: "min-thu", name: "မင်းသူရ", initials: "MT", specialty: "Intuitive Tarot & Life Direction",
    experience: "အတွေ့အကြုံ ၉ နှစ်", rate: "၃၀ မိနစ် · ၃၀,၀၀၀ ကျပ်", availability: "အင်္ဂါ · ကြာသပတေး · စနေ",
    tags: ["ဘဝလမ်းကြောင်း", "စီးပွားရေး", "ဆုံးဖြတ်ချက်"], location: "ရန်ကုန် · လှိုင်", sessionMinutes: 30,
  },
];

export function findDemoSpecialist(id: string) {
  return demoSpecialists.find((item) => item.id === id) ?? null;
}

type SpecialistRowLike = {
  id: string; name: string; initials: string; specialty: string; experience: string;
  displayRate: string; availabilityLabel: string; tags: string[]; location: string; sessionMinutes: number;
};

export function specialistFromRow(row: SpecialistRowLike): TarotSpecialist {
  return {
    id: row.id, name: row.name, initials: row.initials, specialty: row.specialty, experience: row.experience,
    rate: row.displayRate, availability: row.availabilityLabel, tags: row.tags, location: row.location, sessionMinutes: row.sessionMinutes,
  };
}
