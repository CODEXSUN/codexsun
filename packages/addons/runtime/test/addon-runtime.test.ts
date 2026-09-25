import assert from "node:assert/strict";
import test from "node:test";
import { createAddonProvider, createAddonService, defineAddonRoutes, type AddonDefinition } from "../src/index.js";

const definition: AddonDefinition = { id: "sample", label: "Sample", purpose: "Test", areas: ["records"], contracts: ["sample.v1"], publishedEvents: ["sample.record.created"] };

test("creates and updates an add-on record", () => {
  const service = createAddonService(definition);
  const record = service.create({ title: "First record", ownerId: "actor-1" });
  assert.equal(service.list().length, 1);
  assert.equal(service.updateStatus(record.id, "active").status, "active");
});

test("publishes a platform-compatible provider", () => {
  const provider = createAddonProvider(definition);
  assert.equal(provider.manifest.id, "sample.provider");
  assert.deepEqual(provider.manifest.dependencies, ["platform.core"]);
});

test("defines protected API routes for an add-on", () => {
  const routes = defineAddonRoutes(definition.id);
  assert.equal(routes[0].path, "/api/v1/sample/records");
  assert.equal(routes[1].permission, "sample.write");
});
