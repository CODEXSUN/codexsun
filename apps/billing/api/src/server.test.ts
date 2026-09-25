import test from "node:test";
import assert from "node:assert/strict";
import { BillingFoundationProvider } from "./modules/foundation/provider.js";

test("billing API declares its owned health contract", () => {
  const provider = new BillingFoundationProvider();
  assert.deepEqual(provider.manifest.contracts, ["billing.health"]);
  assert.equal(provider.manifest.owner, "apps/billing/api/modules/foundation");
});
