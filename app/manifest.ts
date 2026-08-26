import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "သုရိယ — နေ့စဉ် ကြယ်တာရာလမ်းညွှန်",
    short_name: "သုရိယ",
    description: "ကိုယ့်နေ့ရက်ကို ကြယ်တာရာများနှင့်အတူ နားလည်ပါ။",
    start_url: "/",
    display: "standalone",
    background_color: "#F4F2EF",
    theme_color: "#F4F2EF",
    lang: "my",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
  };
}
