import test from "node:test";
import assert from "node:assert/strict";
import { createSiteWorker } from "./worker.mjs";

test("each Worker serves only its own host and published projection", async () => {
  for (const slug of ["logicx", "ramutex"]) {
    const origin = `https://${slug}.codexsun.com`;
    const worker = createSiteWorker(
      { routes: ["/", "/contact"], sequence: 1, content: { siteSlug: slug } },
      origin
    );
    const response = await worker.fetch(new Request(origin + "/__sites-content"), {});
    assert.equal((await response.json()).data.siteSlug, slug);
    const other = slug === "logicx" ? "ramutex" : "logicx";
    assert.equal(
      (await worker.fetch(new Request(`https://${other}.codexsun.com/__sites-content`), {})).status,
      421
    );
    const rejected = await worker.fetch(
      new Request(origin + "/content/v1/enquiries", {
        method: "POST",
        headers: { origin: `https://${other}.codexsun.com`, "content-type": "application/json" },
        body: "{}"
      }),
      {}
    );
    assert.equal(rejected.status, 403);
  }
});

test("Worker preserves rendered route selection, missing-page status, and HEAD semantics", async () => {
  const worker = createSiteWorker(
    { routes: ["/", "/contact"], content: { siteSlug: "ramutex" } },
    "https://ramutex.codexsun.com"
  );
  const seen = [];
  const env = {
    ASSETS: {
      async fetch(request) {
        seen.push(new URL(request.url).pathname);
        return new Response("Rendered page", { headers: { "content-type": "text/html" } });
      }
    }
  };
  assert.equal(
    (await worker.fetch(new Request("https://ramutex.codexsun.com/contact"), env)).status,
    200
  );
  assert.equal(seen.pop(), "/contact/index.html");
  assert.equal(
    (await worker.fetch(new Request("https://ramutex.codexsun.com/missing"), env)).status,
    404
  );
  assert.equal(seen.pop(), "/404.html");
  const head = await worker.fetch(
    new Request("https://ramutex.codexsun.com/", { method: "HEAD" }),
    env
  );
  assert.equal(await head.text(), "");
  assert.equal(head.headers.get("x-content-type-options"), "nosniff");
});
