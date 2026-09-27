import test from "node:test";
import assert from "node:assert/strict";
import { CodeloopFoundationProvider } from "./modules/foundation/provider.js";

test("codeloop API declares its owned health contract", () => {
  const provider = new CodeloopFoundationProvider();
  assert.deepEqual(provider.manifest.contracts, ["codeloop.health"]);
  assert.equal(provider.manifest.owner, "devkits/codeloop/api/modules/foundation");
});
