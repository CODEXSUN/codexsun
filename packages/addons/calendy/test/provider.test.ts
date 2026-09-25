import assert from "node:assert/strict";
import test from "node:test";
import { createAddonProvider, createCalendyService, definition, routes } from "../src/index.js";

test("declares the calendy provider contract", () => {
  const provider = createAddonProvider();
  assert.equal(provider.manifest.id, "calendy.provider");
  assert.deepEqual(provider.manifest.contracts, ["calendy.v1"]);
  assert.equal(routes[0].contract, "calendy.v1");
});

test("runs the calendy purpose-specific backend action", () => {
  const record = createCalendyService().scheduleEvent({ organizerId: "actor-1", startsAt: "2026-09-25T09:00:00Z", endsAt: "2026-09-25T10:00:00Z", title: "Review" });
  assert.equal(record.status, "draft");
  assert.equal(record.title, "Review");
});
