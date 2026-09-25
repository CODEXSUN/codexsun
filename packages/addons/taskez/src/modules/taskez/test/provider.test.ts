import assert from "node:assert/strict";
import test from "node:test";
import { TaskezModuleProvider } from "../provider.js";

test("declares the taskez module owner and events", () => {
  const provider = new TaskezModuleProvider();
  assert.equal(provider.manifest.owner, "packages/addons/taskez/modules/taskez");
  assert.equal(provider.manifest.contracts[0], "taskez.v1");
});
