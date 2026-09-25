import test from "node:test";
import assert from "node:assert/strict";
import { EcommerceFoundationProvider } from "./modules/foundation/provider.js";

test("ecommerce API declares its owned health contract", () => {
  const provider = new EcommerceFoundationProvider();
  assert.deepEqual(provider.manifest.contracts, ["ecommerce.health"]);
  assert.equal(provider.manifest.owner, "apps/ecommerce/api/modules/foundation");
});
