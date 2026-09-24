import test from "node:test";
import assert from "node:assert/strict";
import { OrshipFoundationProvider } from "./modules/foundation/provider.js";

test("orship API declares its owned health contract", () => {
  const provider = new OrshipFoundationProvider();
  assert.deepEqual(provider.manifest.contracts, ["orship.health"]);
  assert.equal(provider.manifest.owner, "devkits/orship/api/modules/foundation");
});
