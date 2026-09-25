import assert from "node:assert/strict";
import test from "node:test";
import { createAddonProvider, createMeetyService, definition, routes } from "../src/index.js";

test("declares the meety provider contract", () => {
  const provider = createAddonProvider();
  assert.equal(provider.manifest.id, "meety.provider");
  assert.deepEqual(provider.manifest.contracts, ["meety.v1"]);
  assert.equal(routes[0].contract, "meety.v1");
});

test("runs the meety purpose-specific backend action", () => {
  const record = createMeetyService().createMeeting({ organizerId: "actor-1", title: "Standup", startsAt: "2026-09-25T09:00:00Z", participantIds: ["actor-2"] });
  assert.equal(record.status, "draft");
  assert.equal(record.startsAt, "2026-09-25T09:00:00Z");
});
