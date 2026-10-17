import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

const slug = process.argv[2] || "logicx";
if (!["logicx", "ramutex"].includes(slug)) throw new Error("Select logicx or ramutex.");
const origin = `https://${slug}.codexsun.com`;
const publication = JSON.parse(
  await readFile(
    resolve(
      import.meta.dirname,
      "../../../../dist/apps/sites/cloudflare",
      slug,
      "publication.json"
    ),
    "utf8"
  )
);
let checked = 0;
for (const path of publication.routes) {
  const response = await fetch(origin + path);
  const html = await response.text();
  assert.equal(response.status, 200, path);
  assert.ok(
    html.includes(`<link rel="canonical" href="${origin}${path}">`),
    `Canonical missing: ${path}`
  );
  assert.ok(
    html.includes('id="codexsun-sites-publication"'),
    `Published bootstrap missing: ${path}`
  );
  assert.equal(response.headers.get("x-content-type-options"), "nosniff");
  checked++;
}
const home = await (await fetch(origin)).text();
const assets = [
  ...new Set(
    [...home.matchAll(/(?:src|href)="(\/[^"?#]+\.(?:js|css|svg|webp|png|woff2))"/g)].map(
      (match) => match[1]
    )
  )
];
for (const path of assets) assert.equal((await fetch(origin + path)).status, 200, path);
const health = await (await fetch(origin + "/health")).json();
assert.equal(health.sequence, publication.sequence);
assert.equal(health.client, slug);
const content = await (await fetch(origin + "/__sites-content")).json();
assert.equal(content.data.siteUuid, publication.content.siteUuid);
assert.equal(content.data.siteSlug, slug);
assert.equal((await fetch(origin + "/missing-deployment-test")).status, 404);
assert.equal(
  (
    await fetch(origin + "/content/v1/enquiries", {
      method: "POST",
      headers: { origin: "https://other.example", "content-type": "application/json" },
      body: "{}"
    })
  ).status,
  403
);
assert.equal(
  (
    await fetch(origin + "/content/v1/enquiries", {
      method: "POST",
      headers: { origin, "content-type": "application/json" },
      body: "{}"
    })
  ).status,
  422
);
const sitemap = await (await fetch(origin + "/sitemap.xml")).text();
assert.equal((sitemap.match(/<loc>/g) || []).length, publication.routes.length);
assert.ok(!sitemap.includes("127.0.0.1"));
const robots = await (await fetch(origin + "/robots.txt")).text();
assert.ok(robots.includes(origin + "/sitemap.xml"));
console.log(
  `Live verification passed: ${checked} published routes, ${assets.length} homepage assets, canonical URLs, content identity, health, sitemap, robots, 404, origin and validation rejection.`
);
