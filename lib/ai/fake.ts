import type { AiProvider, AiStreamRequest } from "./provider";

export class FakeAiProvider implements AiProvider {
  async *stream({ signal }: AiStreamRequest): AsyncIterable<string> {
    const chunks = [
      "အကျဉ်းချုပ် — ယခုအချိန်မှာ အလျင်စလို အဖြေတစ်ခုရွေးခြင်းထက် ကိုယ့်ရည်ရွယ်ချက်ကို ပြတ်သားစွာ သတ်မှတ်ခြင်းက ပိုအရေးကြီးပါတယ်။\n\n",
      "သင့်ဇာတာထဲက လနှင့် လဂ်အနေအထားက စိတ်ခံစားချက်နှင့် လက်တွေ့လိုအပ်ချက်နှစ်ခုကို ညှိနှိုင်းဖို့ တိုက်တွန်းနေပါတယ်။ ဂုရုဂြိုဟ်၏ သက်ရောက်မှုက အကြံဉာဏ်ယူခြင်းနှင့် အမြင်သစ်ကို လက်ခံခြင်းကို အားပေးပါတယ်။\n\n",
      "လက်တွေ့လုပ်ဆောင်ရန် — ဒီနေ့မှာ ဆုံးဖြတ်ချက်အတွက် မပြောင်းလဲနိုင်သော သတ်မှတ်ချက်သုံးခုကို ရေးချပြီး ယုံကြည်ရသူတစ်ဦးနှင့် ပြန်လည်စစ်ဆေးပါ။",
    ];
    for (const chunk of chunks) {
      if (signal?.aborted) return;
      yield chunk;
    }
  }
}
