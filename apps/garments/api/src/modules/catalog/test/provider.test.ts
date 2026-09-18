import assert from "node:assert/strict";
import test from "node:test";
import { GarmentsCatalogProvider } from "../provider.js";

test("declares the Garments catalog owner and synchronous event contract", () => {
  const provider = new GarmentsCatalogProvider();

  assert.equal(provider.manifest.owner, "apps/garments/api/modules/catalog");
  assert.deepEqual(provider.manifest.events, { published: [], consumed: [] });
});
