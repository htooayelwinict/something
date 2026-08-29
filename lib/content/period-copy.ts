import type { PeriodKind } from "@/lib/readings/period";

export const periodCopy: Record<PeriodKind, { eyebrow: string; title: string; lede: string; readingTitle: string; metaTitle: string }> = {
  daily: {
    eyebrow: "နေ့စဉ်ဖတ်စာ",
    title: "ယနေ့အတွက် သင့်အမြင်",
    lede: "ယနေ့ ဂြိုဟ်ရွေ့လျားမှု၊ လက်ရှိဒဿာနှင့် Panchanga ကို သင့်မွေးဇာတာနှင့် တိုက်ဆိုင်၍ တွက်ချက်ထားသော လက်တွေ့လမ်းညွှန်။",
    readingTitle: "သုရိယ၏ ယနေ့အမြင်",
    metaTitle: "နေ့စဉ်ဖတ်စာ",
  },
  weekly: {
    eyebrow: "အပတ်စဉ်ဖတ်စာ",
    title: "ဤအပတ်အတွက် သင့်အမြင်",
    lede: "ဤအပတ် ခုနစ်ရက်စလုံးကို သင့်မွေးဇာတာနှင့် တစ်ရက်ချင်း တွက်ချက်ပြီး အကောင်းဆုံးရက်နှင့် သတိထားရမည့်ရက်များကို ဖော်ပြထားပါသည်။",
    readingTitle: "သုရိယ၏ ဤအပတ်အမြင်",
    metaTitle: "အပတ်စဉ်ဖတ်စာ",
  },
  monthly: {
    eyebrow: "လစဉ်ဖတ်စာ",
    title: "ဤလအတွက် သင့်အမြင်",
    lede: "ဤလ တစ်လလုံးကို သင့်မွေးဇာတာနှင့် တစ်ရက်ချင်း တွက်ချက်ပြီး ရက်သတ္တပတ်အလိုက် အရှိန်နှင့် ဒဿာပြောင်းလဲမှုကို ဖော်ပြထားပါသည်။",
    readingTitle: "သုရိယ၏ ဤလအမြင်",
    metaTitle: "လစဉ်ဖတ်စာ",
  },
};
