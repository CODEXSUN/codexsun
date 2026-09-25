import assert from "node:assert/strict";
import test from "node:test";
import { createAddonProvider, createWikizService, definition, routes } from "../src/index.js";

test("declares the wikiz provider contract", () => {
  const provider = createAddonProvider();
  assert.equal(provider.manifest.id, "wikiz.provider");
  assert.deepEqual(provider.manifest.contracts, ["wikiz.v1"]);
  assert.equal(routes[0].contract, "wikiz.v1");
});

test("runs the wikiz purpose-specific backend action", () => {
  const record = createWikizService().publishPage({ authorId: "actor-1", slug: "guide", title: "Guide", body: "Body" });
  assert.equal(record.status, "draft");
  assert.equal(record.slug, "guide");
});
