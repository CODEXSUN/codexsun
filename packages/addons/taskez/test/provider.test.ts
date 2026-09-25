import assert from "node:assert/strict";
import test from "node:test";
import { createAddonProvider, createTaskezService, definition, routes } from "../src/index.js";

test("declares the taskez provider contract", () => {
  const provider = createAddonProvider();
  assert.equal(provider.manifest.id, "taskez.provider");
  assert.deepEqual(provider.manifest.contracts, ["taskez.v1"]);
  assert.equal(routes[0].contract, "taskez.v1");
});

test("runs the taskez purpose-specific backend action", () => {
  const record = createTaskezService().createTask({ assigneeId: "actor-1", priority: "high", title: "Ship" });
  assert.equal(record.status, "draft");
  assert.equal(record.title, "Ship");
});
