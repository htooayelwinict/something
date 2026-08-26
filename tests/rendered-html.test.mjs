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
  assert.match(html, /နည်းလမ်းများ/);
  assert.match(html, /မင်္ဂလာပါ/);
  assert.match(html, /ယနေ့၏ မင်္ဂလာလမ်းညွှန်/);
  assert.match(html, /manifest\.webmanifest/);
  assert.match(html, /property=["']og:image["'][^>]*og\.png/i);
  assert.match(html, /<nav\b[^>]*aria-label=["']အဓိက လမ်းညွှန်["']/i);
  assert.doesNotMatch(html, /codex-preview|react-loading-skeleton/i);
  assert.doesNotMatch(html, /Your site is taking shape|Building your site/i);
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
    ["/daily", /ယနေ့အတွက် သင့်အမြင်/],
    ["/ask", /သင့်မေးခွန်းကို ရေးပါ/],
    ["/tarot", /Tarot တိုက်ရိုက်ဆွေးနွေး/],
    ["/login", /ပြန်လည်ကြိုဆိုပါတယ်/],
  ];

  for (const [pathname, copy] of expectations) {
    const response = await render(pathname);
    assert.equal(response.status, 200, pathname);
    assert.match(await response.text(), copy, pathname);
  }
});
