import test from "node:test";
import assert from "node:assert/strict";
import { CrmFoundationProvider } from "./modules/foundation/provider.js";

test("crm API declares its owned health contract", () => {
  const provider = new CrmFoundationProvider();
  assert.deepEqual(provider.manifest.contracts, ["crm.health"]);
  assert.equal(provider.manifest.owner, "apps/crm/api/modules/foundation");
});
