import test from "node:test";
import assert from "node:assert/strict";
import { SitesFoundationProvider } from "./modules/foundation/provider.js";

test("sites API declares its owned health contract", () => {
  const provider = new SitesFoundationProvider();
  assert.deepEqual(provider.manifest.contracts, ["sites.health"]);
  assert.equal(provider.manifest.owner, "apps/sites/api/modules/foundation");
});
