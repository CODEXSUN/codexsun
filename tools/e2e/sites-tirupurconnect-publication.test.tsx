import React from "react";
import assert from "node:assert/strict";
import test from "node:test";
import { mkdtempSync, writeFileSync, rmSync, mkdirSync } from "node:fs";
import { resolve } from "node:path";
import { renderToStaticMarkup } from "react-dom/server";
import { initialSitePage } from "../../apps/sites/api/src/modules/site/page/page.defaults.js";
import { pageContentSchema } from "../../apps/sites/api/src/modules/site/page/page.schema.js";
import { publicationChecksum } from "../../apps/sites/api/src/modules/site/publication/publication.integrity.js";
import { textilePublicationPlugin } from "../../apps/sites/clients/deploy/tirupurconnect.content.js";
import { PageTextileForm } from "../../apps/sites/web/src/modules/site/page/page.textile-form.js";
(globalThis as unknown as { React: typeof React }).React = React;
const content = initialSitePage({
  id: 0,
  uuid: "e303865e",
  slug: "tirupurconnect",
  status: "active"
});
test("textile editor contains content, image, banner and page controls", () => {
  const html = renderToStaticMarkup(<PageTextileForm value={content} onChange={() => {}} />);
  for (const label of [
    "Hero image",
    "Banner image",
    "Category 12 title",
    "Network pending message",
    "/privacy",
    "/contact"
  ])
    assert(html.includes(label), label);
  assert(pageContentSchema.safeParse(content).success);
  assert(
    !JSON.stringify(content).includes("\uFFFD"),
    "Published defaults must use valid UTF-8 text"
  );
  const bad = structuredClone(content);
  bad.textile!.heroImage = "data:image/svg+xml,dangerous";
  assert(!pageContentSchema.safeParse(bad).success);
});
test("deployment accepts only the pinned published client and escapes embedded text", () => {
  mkdirSync(resolve("dist/.cache"), { recursive: true });
  const directory = mkdtempSync(resolve("dist/.cache/textile-publication-"));
  try {
    const payload = {
      schemaVersion: 1,
      siteKey: "a".repeat(64),
      siteUuid: "e303865e",
      siteSlug: "tirupurconnect",
      content: structuredClone(content),
      blogs: []
    };
    payload.content.hero.title = "</script><script>unsafe</script>";
    const file = resolve(directory, "publication.json");
    const save = () =>
      writeFileSync(
        file,
        JSON.stringify({
          ...payload,
          sequence: 1,
          publishedAt: new Date().toISOString(),
          checksum: publicationChecksum(payload)
        })
      );
    save();
    const plugin = textilePublicationPlugin(file, "build");
    const transform = (plugin.transformIndexHtml as { handler: (html: string) => string }).handler;
    const html = transform("<head></head>");
    assert(!html.includes("</script><script>unsafe"));
    assert(html.includes("\\u003c/script>"));
    assert.throws(() => textilePublicationPlugin(undefined, "build"));
    payload.siteSlug = "ramutex";
    save();
    assert.throws(() => textilePublicationPlugin(file, "build"), /identity/);
    payload.siteSlug = "tirupurconnect";
    save();
    const tampered = JSON.parse(requireFile(file));
    tampered.content.hero.title = "tampered";
    writeFileSync(file, JSON.stringify(tampered));
    assert.throws(() => textilePublicationPlugin(file, "build"), /checksum/);
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
});
import { readFileSync } from "node:fs";
function requireFile(file: string) {
  return readFileSync(file, "utf8");
}
