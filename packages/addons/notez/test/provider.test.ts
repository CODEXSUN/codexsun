import assert from "node:assert/strict";
import test from "node:test";
import { createAddonProvider, createNotezService, definition, routes } from "../src/index.js";

test("declares the notez provider contract", () => {
  const provider = createAddonProvider();
  assert.equal(provider.manifest.id, "notez.provider");
  assert.deepEqual(provider.manifest.contracts, ["notez.v1"]);
  assert.equal(routes[0].contract, "notez.v1");
});

test("runs the notez purpose-specific backend action", () => {
  const record = createNotezService().createNote({ authorId: "actor-1", title: "Note", body: "Body" });
  assert.equal(record.status, "draft");
  assert.equal(record.body, "Body");
});
