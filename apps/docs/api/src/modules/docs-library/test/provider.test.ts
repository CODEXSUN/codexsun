import assert from "node:assert/strict";
import test from "node:test";
import { docsLibraryApiProvider } from "../provider.js";

test("declares the Docs API module owner and synchronous event contract", () => {
  assert.equal(docsLibraryApiProvider.owner, "apps/docs/api/modules/docs-library");
  assert.deepEqual(docsLibraryApiProvider.events, { published: [], consumed: [] });
});
