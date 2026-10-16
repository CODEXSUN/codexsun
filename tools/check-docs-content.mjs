import assert from "node:assert/strict";
import { readFile, writeFile, readdir } from "node:fs/promises";
import { existsSync } from "node:fs";
import { createHash } from "node:crypto";
import { resolve, sep, relative, dirname } from "node:path";
const root = resolve("apps/docs/content");
const catalog = JSON.parse(await readFile(resolve(root, "catalog.json"), "utf8"));
assert.equal(catalog.formatVersion, 1);
const keys = new Set();
const sources = new Set();
for (const page of catalog.pages) {
  assert.ok(!keys.has(page.pageKey), `Duplicate page key ${page.pageKey}`);
  keys.add(page.pageKey);
  assert.match(page.sourcePath, /^applications\/[a-z0-9-]+\/[a-z0-9/.-]+\.mdx?$/);
  const path = resolve(root, page.sourcePath);
  assert.ok(path.startsWith(root + sep));
  const body = await readFile(path, "utf8");
  const hash = createHash("sha256").update(body).digest("hex");
  if (process.argv.includes("--refresh-hashes")) page.sourceHash = hash;
  else
    assert.equal(
      hash,
      page.sourceHash,
      `Stale source hash: ${page.sourcePath}. Run npm run docs:catalog.`
    );
  assert.ok(body.startsWith("# "));
  sources.add(page.sourcePath);
}
async function walk(directory, visit) {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const path = resolve(directory, entry.name);
    if (entry.isDirectory()) await walk(path, visit);
    else await visit(path);
  }
}
await walk(resolve(root, "applications"), async (path) => {
  if (/\.mdx?$/.test(path))
    assert.ok(
      sources.has(relative(root, path).split(sep).join("/")),
      `Uncatalogued source ${path}`
    );
});
for (const area of ["apps", "devkits"]) {
  for (const entry of await readdir(area, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    for (const part of ["api", "web", "storefront"]) {
      const modules = resolve(area, entry.name, part, "src/modules");
      if (!existsSync(modules)) continue;
      await walk(modules, async (path) => {
        if (!/\.(module|routes|workspace)\.(ts|tsx)$/.test(path)) return;
        const key = relative(modules, dirname(path)).split(sep).join("/");
        assert.ok(
          catalog.pages.some((page) => page.appKey === entry.name && page.moduleKey === key),
          `Missing developer reference: ${entry.name}/${key}`
        );
      });
    }
  }
}
if (process.argv.includes("--refresh-hashes"))
  await writeFile(resolve(root, "catalog.json"), JSON.stringify(catalog, null, 2) + "\n");
console.log(
  `Docs content valid: ${keys.size} pages, ${new Set(catalog.pages.map((p) => p.appKey)).size} app groups; all local module entry points covered.`
);
