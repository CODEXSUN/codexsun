import assert from "node:assert/strict";
import test from "node:test";
import { BillingWorkspaceProvider } from "../provider.js";

test("declares the billing workspace contract", () => {
  const provider = new BillingWorkspaceProvider();

  assert.equal(provider.manifest.id, "billing.workspace");
  assert.equal(provider.manifest.owner, "apps/billing/api/modules/workspace");
  assert.deepEqual(provider.manifest.dependencies, ["platform.core", "billing.foundation"]);
});
