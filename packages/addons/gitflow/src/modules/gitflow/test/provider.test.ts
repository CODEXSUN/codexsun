import assert from "node:assert/strict";
import test from "node:test";
import { GitflowModuleProvider } from "../provider.js";

test("declares the gitflow module owner and events", () => {
  const provider = new GitflowModuleProvider();
  assert.equal(provider.manifest.owner, "packages/addons/gitflow/modules/gitflow");
  assert.equal(provider.manifest.contracts[0], "gitflow.v1");
});
