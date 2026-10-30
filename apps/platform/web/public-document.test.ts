import assert from "node:assert/strict";
import test from "node:test";
import { createWorkspaceDocument } from "./public-document";

test("workspace entry preserves boot scripts and avoids homepage image downloads", () => {
  const html =
    '<html><head><link id="public-home-hero-preload" rel="preload" as="image" href="/marketing/hero.jpg"><script type="module" src="/assets/entry.js"></script><style id="codexsun-public-home-style">.hero{height:520px}</style></head><body><div id="root"><figure><img src="/marketing/hero.jpg"></figure></div></body></html>';
  const workspace = createWorkspaceDocument(html);
  assert.ok(workspace.includes('src="/assets/entry.js"'));
  assert.ok(workspace.includes('<div id="root"></div>'));
  assert.ok(!workspace.includes("<img"));
  assert.ok(!workspace.includes("/marketing/"));
  assert.ok(!workspace.includes("codexsun-public-home-style"));
  assert.ok(html.includes("/marketing/hero.jpg"));
});

test("workspace generation rejects a document whose bootstrap would be lost", () => {
  assert.throws(
    () =>
      createWorkspaceDocument(
        '<html><head></head><body><script type="module" src="/entry.js"></script></body></html>'
      ),
    /application entry/
  );
});
