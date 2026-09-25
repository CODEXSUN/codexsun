import assert from "node:assert/strict";
import test from "node:test";
import { WikizModuleProvider } from "../provider.js";

test("declares the wikiz module owner and events", () => {
  const provider = new WikizModuleProvider();
  assert.equal(provider.manifest.owner, "packages/addons/wikiz/modules/wikiz");
  assert.equal(provider.manifest.contracts[0], "wikiz.v1");
});
