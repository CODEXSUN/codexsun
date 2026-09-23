import test from "node:test";
import assert from "node:assert/strict";
import { ZunoFoundationProvider } from "./modules/foundation/provider";

test("zuno API declares its owned health contract", () => {
  const provider = new ZunoFoundationProvider();
  assert.deepEqual(provider.manifest.contracts, ["zuno.health"]);
  assert.equal(provider.manifest.owner, "devkits/zuno/api/modules/foundation");
});
