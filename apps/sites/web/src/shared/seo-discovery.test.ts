import assert from "node:assert/strict";
import test from "node:test";
import { createAiTxt, createLlmsTxt, createRobots, createSitemap } from "./seo-discovery";

test("discovery files expose all public client spaces", () => {
  const origin = "https://sites.example";
  const sitemap = createSitemap(origin);
  assert.match(sitemap, /https:\/\/sites\.example\/clients\/skilloopz\/learning-path/);
  assert.match(sitemap, /https:\/\/sites\.example\/clients\/logicx\/contact/);
  assert.equal((sitemap.match(/<url>/g) ?? []).length, 26);
  assert.match(createRobots(origin), /Disallow: \/clients\/test/);
  assert.match(createAiTxt(origin), /\/clients\/codexsun/);
  assert.match(createLlmsTxt(origin), /\/clients\/skilloopz/);
});

test("standalone discovery files stay within the client runtime", () => {
  const sitemap = createSitemap("http://127.0.0.1:7004", "skilloopz");
  assert.match(sitemap, /<loc>http:\/\/127\.0\.0\.1:7004\/contact<\/loc>/);
  assert.doesNotMatch(sitemap, /\/clients\/codexsun/);
  assert.match(createRobots("http://127.0.0.1:7004", "skilloopz"), /Allow: \/\n/);
});
