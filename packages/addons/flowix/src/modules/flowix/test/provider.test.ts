import assert from "node:assert/strict";
import test from "node:test";
import { FlowixModuleProvider } from "../provider.js";

test("declares the flowix module owner and events", () => {
  const provider = new FlowixModuleProvider();
  assert.equal(provider.manifest.owner, "packages/addons/flowix/modules/flowix");
  assert.equal(provider.manifest.contracts[0], "flowix.v1");
});
