import test from "node:test";
import assert from "node:assert/strict";
import { GarmentsFoundationProvider } from "./modules/foundation/provider.js";

test("garments API declares its owned health contract", () => {
  const provider = new GarmentsFoundationProvider();
  assert.deepEqual(provider.manifest.contracts, ["garments.health"]);
  assert.equal(provider.manifest.owner, "apps/garments/api/modules/foundation");
});
