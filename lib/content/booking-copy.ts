import { toBurmeseDigits } from "@/lib/content/burmese-digits";

export const bookingLabels = {
  contactChannel: { phone: "ဖုန်းခေါ်ဆိုမှု", viber: "Viber", telegram: "Telegram", messenger: "Messenger" },
  preferredTime: { morning: "နံနက် (၉–၁၂)", afternoon: "နေ့လယ် (၁–၄)", evening: "ညနေ (၅–၈)" },
  topic: { love: "ချစ်ရေး", career: "အလုပ်အကိုင်", direction: "ဘဝလမ်းကြောင်း", other: "အခြား" },
} as const;

const weekdays = ["တနင်္ဂနွေ", "တနင်္လာ", "အင်္ဂါ", "ဗုဒ္ဓဟူး", "ကြာသပတေး", "သောကြာ", "စနေ"];

export function maskPhone(phone: string) {
  const digits = phone.replace(/\D/g, "");
  return `•••• ${digits.slice(-3)}`;
}

export function formatBookingDate(isoDate: string) {
  const weekday = weekdays[new Date(`${isoDate}T12:00:00.000Z`).getUTCDay()];
  return `${weekday} · ${toBurmeseDigits(isoDate)}`;
}

export const bookingErrorMessages: Record<string, string> = {
  specialist_not_found: "ပညာရှင်ကို ရှာမတွေ့ပါ။",
  too_many_bookings: "တောင်းဆိုမှု များလွန်းနေပါတယ်။ ခဏနားပြီး ပြန်စမ်းပါ။",
  booking_service_unavailable: "လောလောဆယ် မသိမ်းနိုင်သေးပါ။ နောက်တစ်ကြိမ် ပြန်စမ်းပါ။",
  invalid_booking: "ဖြည့်ထားသော အချက်အလက်ကို ပြန်စစ်ပါ။",
};
