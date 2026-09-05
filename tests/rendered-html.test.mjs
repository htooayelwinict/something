import assert from "node:assert/strict";
import test from "node:test";

async function render(pathname = "/") {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);

  return worker.fetch(
    new Request(`http://localhost${pathname}`, {
      headers: { accept: "text/html" },
    }),
    {
      ASSETS: {
        fetch: async () => new Response("Not found", { status: 404 }),
      },
    },
    {
      waitUntil() {},
      passThroughOnException() {},
    },
  );
}

test("server-renders the Suriya home experience", async () => {
  const response = await render();
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);

  const html = await response.text();
  assert.match(html, /<html[^>]*lang=["']my["']/i);
  assert.match(html, /<title>[^<]*သုရိယ[^<]*<\/title>/i);
  assert.match(html, /<main\b/i);
  assert.match(html, /SURIYA/);
  assert.match(html, /နေ့စဉ်ဖတ်စာ/);
  assert.match(html, /Tarot ဆွေးနွေးမှု/);
  assert.match(html, /ယနေ့အတွက် လမ်းညွှန်/);
  assert.match(html, /ပင်မ/);
  assert.match(html, /daily-brief/);
  assert.match(html, /star-field/);
  assert.match(html, /site-footer/);
  assert.match(html, /zodiac-glyph/);
  assert.match(html, /moon-phase/);
  assert.doesNotMatch(html.slice(html.indexOf("<main")), /class="eyebrow"[^>]*>[A-Z]{4,}[^<]*<\/p>/);
  assert.match(html, /href=["']\/daily["'][\s\S]*href=["']\/ask["'][\s\S]*href=["']\/tarot["'][\s\S]*href=["']\/chart["']/);
  assert.doesNotMatch(html, /hero-insight|TODAY’S POWER NUMBER|JYOTISH CALCULATION|TODAY’S RITUAL|METHODS COMBINED|မြန်မာဗေဒင်/);
  assert.match(html, /manifest\.webmanifest/);
  assert.match(html, /property=["']og:image["'][^>]*og\.png/i);
  assert.match(html, /<nav\b[^>]*aria-label=["']အဓိက လမ်းညွှန်["']/i);
  assert.doesNotMatch(html, /codex-preview|react-loading-skeleton/i);
  assert.doesNotMatch(html, /Your site is taking shape|Building your site/i);

  assert.doesNotMatch(html, /identity-rail/, "guest Home must not present a fake birth identity");
  assert.equal((html.match(/class="[^"]*\bprimary-button\b[^"]*"/g) ?? []).length, 1, "guest Home primary CTA count");
  assert.equal((html.match(/class="route-card(?:\s|")/g) ?? []).length, 2, "guest Home task-card count");
  assert.doesNotMatch(html, /href=["']\/daily\/(?:week|month)["']/, "period shortcuts belong on Daily");
  assert.match(html, /နမူနာဖတ်စာ[\s\S]*သင့်ကိုယ်ပိုင်ဖတ်စာ/, "guest Home explains how to personalize the demo");
});

test("serves an installable Burmese manifest", async () => {
  const response = await render("/manifest.webmanifest");
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /application\/manifest\+json/i);
  const manifest = await response.json();
  assert.equal(manifest.lang, "my");
  assert.equal(manifest.display, "standalone");
  assert.equal(manifest.icons.length, 2);
});

test("server-renders the designed public product routes", async () => {
  const expectations = [
    ["/daily", /ယနေ့၏ မင်္ဂလာလမ်းညွှန်[\s\S]*လ၏နေ့စဉ်ရွေ့လျားမှု[\s\S]*ဂုရုဂြိုဟ် ဂေါစရ[\s\S]*စနေဂြိုဟ်[\s\S]*တွက်ချက်ထားသော အချိန်[\s\S]*Rahu Kalam[\s\S]*အလုပ်အကိုင်[\s\S]*ယနေ့ Panchanga[\s\S]*href=["']\/chart["']/],
    ["/chart", /သင့်မွေးဇာတာ[\s\S]*chart-cell[\s\S]*လဂ်[\s\S]*ဂြိုဟ်တည်နေရာများ[\s\S]*လက်ရှိ ဒဿာကာလ[\s\S]*ယနေ့ ဤဇာတာနှင့်[\s\S]*D9 · နဝံသ[\s\S]*D10 · ဒသံသ/],
    ["/ask", /သုရိယကို မေးပါ[\s\S]*တစ်နေ့ ၃ ကြိမ် အခမဲ့[\s\S]*တွက်ချက်နည်းကို သင်ရွေးနိုင်သည်[\s\S]*ask-method-disclosure[\s\S]*အဖြေတွက်ချက်ပုံ/],
    ["/profile", /သင့်ကောင်းကင် ကိုယ်ရေး[\s\S]*အကောင့်ဖွင့်\/ဝင်ရောက်မည် \(Google\)/],
    ["/tarot", /လူချင်းတွေ့ ဆွေးနွေးပါ[\s\S]*ဘယ်လို အလုပ်လုပ်သလဲ[\s\S]*သီရိလမင်း[\s\S]*href=["']\/tarot\/thiri#booking["'][\s\S]*ရက်ချိန်းယူရန်/],
    ["/tarot/thiri", /သီရိလမင်း[\s\S]*id="booking"[\s\S]*id="booking-phone"[\s\S]*ရက်ချိန်း တောင်းဆိုမည်/],
    ["/login", /ပြန်လည်ကြိုဆိုပါတယ်/],
  ];

  for (const [pathname, copy] of expectations) {
    const response = await render(pathname);
    assert.equal(response.status, 200, pathname);
    const html = await response.text();
    assert.match(html, copy, pathname);
    if (pathname === "/daily") {
      assert.match(html, /tarot-upsell[\s\S]*href=["']\/tarot["']/, pathname);
      assert.doesNotMatch(html, /ယုံကြည်မှုအဆင့်/, pathname);
      assert.doesNotMatch(html, /href=["']\/daily["'][^>]*>အသေးစိတ်ဖတ်ရန်/, pathname);
      assert.match(html, /<details class=["']daily-evidence-disclosure/, pathname);
      assert.match(html, /<details class=["']daily-data-disclosure/, pathname);
      assert.doesNotMatch(html, /class=["']metrics-grid["']/, pathname);
      assert.doesNotMatch(html, /CAREER|RELATIONSHIPS|FOCUS|ENERGY|CAUTION/, pathname);
      assert.match(html, /class=["']score-value["']>[၀-၉]+<small>\/၁၀၀<\/small>/, pathname);
      assert.match(html, /၂၀–၉၅ အတွင်း/, pathname);
      assert.doesNotMatch(html, /၀–၁၀၀ အတွင်း/, pathname);
      assert.match(html, /class=["']primary-button["'] href=["']\/ask["']/, pathname);
      assert.doesNotMatch(html, /identity-rail/, pathname);
    }
    if (pathname === "/chart") {
      assert.doesNotMatch(html, /hero-insight/, pathname);
      const burmeseSigns = ["မိဿ", "ပြိဿ", "မေထုန်", "ကရကဋ်", "သိဟ်", "ကန်", "တူ", "ဗြိစ္ဆာ", "ဓနု", "မကာရ", "ကုံ", "မိန်"];
      for (const sign of burmeseSigns) assert.match(html, new RegExp(`chart-sign[^<]*>${sign}<`), `${pathname} ${sign}`);
      assert.doesNotMatch(html, /<span class="chart-cell"[^>]*>[^<]*—/, pathname);
      assert.match(html, /chart-cell" data-lagna="true"/, pathname);
      assert.match(html, /aria-describedby="chart-key-facts"/, pathname);
      assert.match(html, /id="chart-key-facts"/, pathname);
      assert.match(html, /\d{1,2}°\d{2}′/, pathname);
    }
    if (pathname === "/ask") {
      assert.match(html, /<details class=["']ask-method-disclosure/, pathname);
      assert.doesNotMatch(html, /tarot-upsell/, pathname);
      assert.doesNotMatch(html, /identity-rail/, pathname);
      assert.match(html, /ရွေးထားသည်/, pathname);
      assert.match(html, /ဝင်ရောက်ပြီး မေးမည်/, pathname);
    }
    if (pathname.startsWith("/tarot")) assert.doesNotMatch(html, /Preview|PREVIEW|မကြာမီ ရနိုင်မည်|booking မဖွင့်ရသေးပါ/, pathname);
    if (pathname === "/login") assert.doesNotMatch(html, /ChatGPT စကားဝိုင်း/, pathname);
  }
});

test("progressively discloses reference detail and standardizes guest entry", async () => {
  const chart = await (await render("/chart")).text();
  assert.match(chart, /<details class=["']chart-data-disclosure/);
  assert.match(chart, /class=["']primary-button["'] href=["']\/ask["']/);
  assert.doesNotMatch(chart, /identity-rail/);

  for (const path of ["/today", "/rasi/mesha", "/readings"]) {
    const html = await (await render(path)).text();
    assert.doesNotMatch(html, /tarot-upsell/, path);
  }

  const guestPattern = /သင့်မွေးချိန်အတိုင်း တွက်ချက်ပေးမည်[\s\S]*အကောင့်ဖွင့်\/ဝင်ရောက်မည် \(Google\)[\s\S]*ယနေ့ဖတ်စာသို့ ပြန်သွားရန်/;
  for (const path of ["/profile", "/readings", "/daily/week", "/daily/month"]) {
    const html = await (await render(path)).text();
    assert.match(html, guestPattern, path);
  }
});

test("redirects the legacy chart route to /chart", async () => {
  const response = await render("/daily/details");
  assert.ok([301, 302, 307, 308].includes(response.status), String(response.status));
  assert.match(response.headers.get("location") ?? "", /\/chart$/);
});

test("unknown booking confirmations are not found", async () => {
  const response = await render("/tarot/bookings/bkg_missing");
  assert.equal(response.status, 404);
});

test("period reading routes render tabs, readings and guest gating", async () => {
  const daily = await (await render("/daily")).text();
  assert.match(daily, /period-tabs[\s\S]*aria-current="page"[^>]*>ယနေ့</);
  assert.match(daily, /သုရိယ၏ ယနေ့အမြင်/);
  for (const [path, tab] of [["/daily/week", "ဤအပတ်"], ["/daily/month", "ဤလ"]]) {
    const response = await render(path);
    assert.equal(response.status, 200, path);
    const html = await response.text();
    assert.match(html, new RegExp(`aria-current="page"[^>]*>${tab}<`), path);
    assert.match(html, /ဝင်ရောက်ပြီး အပတ်စဉ်နှင့် လစဉ်/, path);
    assert.doesNotMatch(html, /tarot-upsell/, path);
  }
  const home = await (await render("/")).text();
  assert.doesNotMatch(home, /href=["']\/daily\/(?:week|month)["']/);
  assert.equal((await render("/api/period-readings/yearly/stream")).status, 404);
  assert.equal((await render("/api/period-readings/weekly/stream")).status, 401);
  const dailyStream = await render("/api/period-readings/daily/stream");
  assert.equal(dailyStream.status, 200);
  assert.ok(["deterministic", "model"].includes(dailyStream.headers.get("x-interpretation-mode") ?? ""));
  const text = await dailyStream.text();
  assert.match(text, /[က-႟]/);
  assert.match(text, /လက်တွေ့လုပ်ဆောင်ရန်/);
});

test("public SEO pages carry structured data and crawl files", async () => {
  const productionOrigin = "https://suriya-myanmar.htoo368095.chatgpt.site";
  for (const [path, needle] of [["/rasi", /CollectionPage/], ["/rasi/mesha", /"@type":"Article"[\s\S]*မိဿရာသီ/], ["/today", /FAQPage[\s\S]*hora-table/], ["/tarot", /LocalBusiness[\s\S]*FAQPage/]]) {
    const response = await render(path);
    assert.equal(response.status, 200, path);
    const html = await response.text();
    assert.match(html, needle, path);
    const blocks = [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)];
    assert.ok(blocks.length >= 2, `${path} json-ld blocks`);
    for (const block of blocks) JSON.parse(block[1]);
    assert.ok(html.includes(`rel="canonical" href="${productionOrigin}`), path);
  }
  assert.equal((await render("/rasi/nope")).status, 404);
  const robots = await render("/robots.txt");
  assert.equal(robots.status, 200);
  const robotsText = await robots.text();
  assert.match(robotsText, /Disallow: \/readings/);
  assert.ok(robotsText.includes(`Sitemap: ${productionOrigin}/sitemap.xml`));
  const sitemap = await render("/sitemap.xml");
  assert.equal(sitemap.status, 200);
  const xml = await sitemap.text();
  assert.ok(xml.includes(`<loc>${productionOrigin}/`));
  for (const slug of ["mesha", "meena"]) assert.match(xml, new RegExp(`/rasi/${slug}<`));
  assert.match(xml, /\/today</);
  const readings = await (await render("/readings")).text();
  assert.match(readings, /noindex/);
  const { readFileSync } = await import("node:fs");
  assert.ok(readFileSync(new URL("../public/llms.txt", import.meta.url), "utf8").includes(`${productionOrigin}/today`));
});

test("google sign-in routes redirect safely without configuration", async () => {
  const start = await render("/auth/google/start?return_to=%2Fprofile");
  assert.equal(start.status, 302);
  assert.equal(start.headers.get("location"), "/login?error=unconfigured");
  assert.match(start.headers.get("cache-control") ?? "", /no-store/);

  const callback = await render("/auth/google/callback?code=x&state=y");
  assert.equal(callback.status, 302);
  assert.match(callback.headers.get("location") ?? "", /^\/login\?error=(?:google|unconfigured)$/);

  const signout = await render("/auth/signout?return_to=%2F%2Fevil.example");
  assert.equal(signout.status, 302);
  assert.equal(signout.headers.get("location"), "/");
  assert.match(signout.headers.get("set-cookie") ?? "", /suriya_session=;[^]*Max-Age=0/);

  const onboarding = await render("/onboarding");
  assert.ok([302, 307, 308].includes(onboarding.status), String(onboarding.status));
  assert.match(onboarding.headers.get("location") ?? "", /\/login\?return_to=%2Fonboarding$/);

  const login = await (await render("/login")).text();
  assert.match(login, /href="\/auth\/google\/start\?return_to=%2Fonboarding"/);
  assert.match(login, /Google ဖြင့် အကောင့်ဖွင့်\/ဝင်ရောက်မည်/);
  assert.doesNotMatch(login, /signin-with-chatgpt|ChatGPT/);
  const loginError = await (await render("/login?error=unconfigured")).text();
  assert.match(loginError, /ဝင်ရောက်ခြင်းကို ခဏ ရပ်ထားပါသည်/);
});
