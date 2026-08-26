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
};

export const demoDailyInsight = {
  score: 78,
  title: "စိတ်ရှင်းလင်းပြီး ဆုံးဖြတ်ချက်ကောင်းများ ချနိုင်မည့်နေ့",
  summary: "လ၏တည်နေရာက အာရုံစူးစိုက်မှုကို အားပေးနေပါတယ်။ အလျင်စလို မဆုံးဖြတ်ဘဲ အရေးကြီးဆုံးအလုပ်တစ်ခုကို ဦးစားပေးပါ။",
  favorableWindow: "နံနက် ၉:၄၀ — ၁၁:၁၅",
  moonSign: "ဝृषभ · ပြိဿရာသီ",
  energy: "တည်ငြိမ်",
  focus: "စီမံကိန်းနှင့် ဆက်သွယ်ရေး",
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
    experience: "အတွေ့အကြုံ ၆ နှစ်", rate: "၁၅ မိနစ် · ၁၂,၀၀၀ ကျပ်", availability: "မကြာမီ ရနိုင်မည်",
    tags: ["ချစ်ရေး", "အလုပ်အကိုင်", "စိတ်ခံစားမှု"],
  },
  {
    id: "min-thu", name: "မင်းသူရ", initials: "MT", specialty: "Intuitive Tarot & Life Direction",
    experience: "အတွေ့အကြုံ ၉ နှစ်", rate: "၁၅ မိနစ် · ၁၅,၀၀၀ ကျပ်", availability: "မကြာမီ ရနိုင်မည်",
    tags: ["ဘဝလမ်းကြောင်း", "စီးပွားရေး", "ဆုံးဖြတ်ချက်"],
  },
];
