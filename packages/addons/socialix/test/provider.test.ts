import assert from "node:assert/strict";
import test from "node:test";
import { createAddonProvider, createSocialixService, definition, routes } from "../src/index.js";

test("declares the socialix provider contract", () => {
  const provider = createAddonProvider();
  assert.equal(provider.manifest.id, "socialix.provider");
  assert.deepEqual(provider.manifest.contracts, ["socialix.v1"]);
  assert.equal(routes[0].contract, "socialix.v1");
});

test("runs the socialix purpose-specific backend action", () => {
  const record = createSocialixService().schedulePost({ authorId: "actor-1", channelId: "linkedin", content: "Post", scheduledFor: "2026-09-25T09:00:00Z" });
  assert.equal(record.status, "draft");
  assert.equal(record.channelId, "linkedin");
});
