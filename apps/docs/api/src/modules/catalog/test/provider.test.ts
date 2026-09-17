import assert from "node:assert/strict";
import test from "node:test";
import { DocsCatalogProvider } from "../provider.js";

test("declares the Docs catalog owner and synchronous event contract", () => {
  const provider = new DocsCatalogProvider();

  assert.equal(provider.manifest.owner, "apps/docs/api/modules/catalog");
  assert.deepEqual(provider.manifest.events, { published: [], consumed: [] });
});
