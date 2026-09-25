import assert from "node:assert/strict";
import test from "node:test";
import { createAddonProvider, createNotifyzService, definition, routes } from "../src/index.js";

test("declares the notifyz provider contract", () => {
  const provider = createAddonProvider();
  assert.equal(provider.manifest.id, "notifyz.provider");
  assert.deepEqual(provider.manifest.contracts, ["notifyz.v1"]);
  assert.equal(routes[0].contract, "notifyz.v1");
});

test("runs the notifyz purpose-specific backend action", () => {
  const record = createNotifyzService().createNotification({ recipientId: "actor-1", message: "Done" });
  assert.equal(record.status, "draft");
  assert.equal(record.recipientId, "actor-1");
});
