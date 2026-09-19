import test from "node:test";
import assert from "node:assert/strict";
import { QcafeFoundationProvider } from "./modules/foundation/provider.js";

test("qcafe API declares its owned health contract", () => {
  const provider = new QcafeFoundationProvider();
  assert.deepEqual(provider.manifest.contracts, ["qcafe.health"]);
  assert.equal(provider.manifest.owner, "apps/qcafe/api/modules/foundation");
});
