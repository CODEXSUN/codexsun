import test from "node:test";
import assert from "node:assert/strict";
import { HrmsFoundationProvider } from "./modules/foundation/provider.js";

test("hrms API declares its owned health contract", () => {
  const provider = new HrmsFoundationProvider();
  assert.deepEqual(provider.manifest.contracts, ["hrms.health"]);
  assert.equal(provider.manifest.owner, "apps/hrms/api/modules/foundation");
});
