import test from "node:test";
import assert from "node:assert/strict";
import { HimsxFoundationProvider } from "./modules/foundation/provider.js";

test("himsx API declares its owned health contract", () => {
  const provider = new HimsxFoundationProvider();
  assert.deepEqual(provider.manifest.contracts, ["himsx.health"]);
  assert.equal(provider.manifest.owner, "apps/himsx/api/modules/foundation");
});
