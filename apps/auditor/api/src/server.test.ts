import test from "node:test";
import assert from "node:assert/strict";
import { AuditorFoundationProvider } from "./modules/foundation/provider.js";

test("auditor API declares its owned health contract", () => {
  const provider = new AuditorFoundationProvider();
  assert.deepEqual(provider.manifest.contracts, ["auditor.health"]);
  assert.equal(provider.manifest.owner, "apps/auditor/api/modules/foundation");
});
