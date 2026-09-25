import assert from "node:assert/strict";
import test from "node:test";
import { NotezModuleProvider } from "../provider.js";

test("declares the notez module owner and events", () => {
  const provider = new NotezModuleProvider();
  assert.equal(provider.manifest.owner, "packages/addons/notez/modules/notez");
  assert.equal(provider.manifest.contracts[0], "notez.v1");
});
