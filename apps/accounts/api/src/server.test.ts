import test from "node:test";
import assert from "node:assert/strict";
import { AccountsFoundationProvider } from "./modules/foundation/provider.js";

test("accounts API declares its owned health contract", () => {
  const provider = new AccountsFoundationProvider();
  assert.deepEqual(provider.manifest.contracts, ["accounts.health"]);
  assert.equal(provider.manifest.owner, "apps/accounts/api/modules/foundation");
});
