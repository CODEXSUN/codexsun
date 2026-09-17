import assert from "node:assert/strict";
import test from "node:test";
import { docsLibraryWebProvider } from "../provider.js";

test("declares the Docs web module owner and synchronous event contract", () => {
  assert.equal(docsLibraryWebProvider.owner, "apps/docs/web/modules/docs-library");
  assert.deepEqual(docsLibraryWebProvider.events, { published: [], consumed: [] });
});
