import assert from "node:assert/strict";
import test from "node:test";
import { garmentsLibraryApiProvider } from "../provider.js";

test("declares the Garments API module owner and synchronous event contract", () => {
  assert.equal(garmentsLibraryApiProvider.owner, "apps/garments/api/modules/garments-library");
  assert.deepEqual(garmentsLibraryApiProvider.events, { published: [], consumed: [] });
});
