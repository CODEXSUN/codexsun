import test from "node:test";
import assert from "node:assert/strict";
import { LmsFoundationProvider } from "./modules/foundation/provider.js";

test("lms API declares its owned health contract", () => {
  const provider = new LmsFoundationProvider();
  assert.deepEqual(provider.manifest.contracts, ["lms.health"]);
  assert.equal(provider.manifest.owner, "apps/lms/api/modules/foundation");
});
