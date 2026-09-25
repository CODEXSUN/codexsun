import assert from "node:assert/strict";
import test from "node:test";
import { createAddonProvider, createFlowixService, definition, routes } from "../src/index.js";

test("declares the flowix provider contract", () => {
  const provider = createAddonProvider();
  assert.equal(provider.manifest.id, "flowix.provider");
  assert.deepEqual(provider.manifest.contracts, ["flowix.v1"]);
  assert.equal(routes[0].contract, "flowix.v1");
});

test("runs the flowix purpose-specific backend action", () => {
  const record = createFlowixService().createWorkflow({ ownerId: "actor-1", name: "Notify", trigger: "task.completed" });
  assert.equal(record.status, "draft");
  assert.equal(record.trigger, "task.completed");
});
