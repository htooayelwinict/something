import type { Metadata, Viewport } from "next";
import { Inter, Noto_Sans_Myanmar, Noto_Serif_Myanmar } from "next/font/google";
import "./globals.css";
import { JsonLd } from "@/components/suriya/json-ld";
import { organizationJsonLd, websiteJsonLd } from "@/lib/content/seo";

const myanmar = Noto_Sans_Myanmar({
  variable: "--font-myanmar",
  subsets: ["myanmar"],
});

const myanmarSerif = Noto_Serif_Myanmar({
  variable: "--font-myanmar-serif",
  subsets: ["myanmar"],
  weight: ["500", "600"],
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://suriya.openai.site"),
  title: {
    default: "သုရိယ — နေ့စဉ် ကြယ်တာရာလမ်းညွှန်",
    template: "%s | သုရိယ",
  },
  description:
    "သင့်မွေးဖွားချိန်နှင့် ကြယ်တာရာတွက်ချက်မှုအပေါ် အခြေခံသော မြန်မာဘာသာ ဗေဒင်လမ်းညွှန်။",
  applicationName: "သုရိယ",
  manifest: "/manifest.webmanifest",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
  openGraph: {
    title: "သုရိယ — နေ့စဉ် ကြယ်တာရာလမ်းညွှန်",
    description: "ကိုယ့်နေ့ရက်ကို ကြယ်တာရာများနှင့်အတူ နားလည်ပါ။",
    type: "website",
    locale: "my_MM",
    images: [{ url: "/og.png", width: 1731, height: 908, alt: "သုရိယ၏ နေ၊ လနှင့် ဇာတာပုံစံ" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "သုရိယ — နေ့စဉ် ကြယ်တာရာလမ်းညွှန်",
    description: "ကိုယ့်နေ့ရက်ကို ကြယ်တာရာများနှင့်အတူ နားလည်ပါ။",
    images: ["/og.png"],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#0b0f1e",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="my">
      <body className={`${myanmar.variable} ${myanmarSerif.variable} ${inter.variable}`}>
        <JsonLd data={[organizationJsonLd(), websiteJsonLd()]} />
        <a className="skip-link" href="#main-content">
          အဓိကအကြောင်းအရာသို့ ကျော်ရန်
        </a>
        {children}
      </body>
    </html>
  );
}
