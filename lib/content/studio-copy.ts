export const bookingStatusOrder = ["requested", "confirmed", "completed", "cancelled"] as const;
export type StudioBookingStatus = (typeof bookingStatusOrder)[number];

export const bookingStatusLabels: Record<StudioBookingStatus, string> = {
  requested: "တောင်းဆိုထား",
  confirmed: "အတည်ပြုပြီး",
  completed: "ပြီးဆုံး",
  cancelled: "ပယ်ဖျက်ထား",
};

export const studioRoleLabels = { editor: "တည်းဖြတ်သူ", teller: "ပညာရှင်" } as const;

export const studioNav = [
  { href: "/studio", label: "ခြုံငုံ" },
  { href: "/studio/bookings", label: "ရက်ချိန်းများ" },
  { href: "/studio/tellers", label: "ပညာရှင်များ" },
] as const;

export const tellerFieldLabels = {
  id: "ID (URL အတွက်၊ ဥပမာ thiri)",
  name: "အမည်",
  initials: "အတိုကောက် (၁–၃ လုံး)",
  specialty: "အထူးပြု",
  experience: "အတွေ့အကြုံ",
  displayRate: "ပြသနှုန်း",
  availabilityLabel: "ရနိုင်သောရက်များ",
  tags: "အကြောင်းအရာများ (၊ သို့မဟုတ် , ဖြင့် ခွဲပါ)",
  location: "နေရာ",
  sessionMinutes: "ကြာချိန် (မိနစ်)",
  bio: "မိတ်ဆက် (အများမြင်)",
  photoUrl: "ဓာတ်ပုံ လင့်ခ် (https)",
  loginEmail: "ဝင်ရောက်ရန် Gmail",
  isActive: "အများမြင် စာမျက်နှာတွင် ပြသမည်",
  sortOrder: "အစီအစဉ် (နည်းသည်က အရင်)",
} as const;

export const studioMessages = {
  saved: "သိမ်းပြီးပါပြီ။",
  unauthorized: "ဝင်ရောက်ရန် လိုအပ်ပါသည်။",
  forbidden: "ဤလုပ်ဆောင်ချက်ကို ခွင့်မပြုပါ။",
  duplicate: "ဤ ID သို့မဟုတ် Gmail ကို အသုံးပြုပြီး ဖြစ်ပါသည်။",
  not_found: "မတွေ့ပါ။",
  invalid_input: "ဖြည့်ထားသော အချက်အလက်ကို ပြန်စစ်ပါ။",
  service_unavailable: "ဝန်ဆောင်မှု ခေတ္တမရနိုင်ပါ။ ပြန်စမ်းပါ။",
  db_unavailable: "ဒေတာဘေ့စ် ခေတ္တမရနိုင်ပါ။",
  no_access_title: "ဤစာမျက်နှာကို ဝင်ရောက်ခွင့် မရှိပါ",
  no_access_body: "Studio ကို တည်းဖြတ်သူနှင့် စာရင်းသွင်းထားသော Tarot ပညာရှင်များသာ အသုံးပြုနိုင်ပါသည်။ အခြားအကောင့်ဖြင့် ဝင်ရောက်ရန် အောက်တွင် နှိပ်ပါ။",
  empty_bookings: "ရက်ချိန်း မရှိသေးပါ။",
} as const;

export function studioErrorMessage(code: string | undefined): string {
  if (code && code in studioMessages) return studioMessages[code as keyof typeof studioMessages];
  if (code && /[က-႟]/.test(code)) return code;
  return studioMessages.invalid_input;
}
