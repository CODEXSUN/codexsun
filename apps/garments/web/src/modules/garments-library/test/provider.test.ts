import assert from "node:assert/strict";
import test from "node:test";
import { garmentsLibraryWebProvider } from "../provider.js";

test("declares the Garments web module owner and synchronous event contract", () => {
  assert.equal(garmentsLibraryWebProvider.owner, "apps/garments/web/modules/garments-library");
  assert.deepEqual(garmentsLibraryWebProvider.events, { published: [], consumed: [] });
});
