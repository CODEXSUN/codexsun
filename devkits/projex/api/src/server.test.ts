import test from "node:test";
import assert from "node:assert/strict";
import { ProjexFoundationProvider } from "./modules/foundation/provider.js";
import { ProjexWorkspaceProvider } from "./modules/workspace/provider.js";
import { ProjexAddonsProvider } from "./modules/addons/provider.js";

test("projex API declares its owned health contract", () => {
  const provider = new ProjexFoundationProvider();
  assert.deepEqual(provider.manifest.contracts, ["projex.health"]);
  assert.equal(provider.manifest.owner, "devkits/projex/api/modules/foundation");
});

test("projex API declares its workspace snapshot contract", () => {
  const provider = new ProjexWorkspaceProvider();
  assert.deepEqual(provider.manifest.contracts, ["projex.workspace.snapshot"]);
  assert.equal(provider.manifest.owner, "devkits/projex/api/modules/workspace");
});

test("projex API declares its add-ons catalog contract", () => {
  const provider = new ProjexAddonsProvider();
  assert.deepEqual(provider.manifest.contracts, ["projex.addons.catalog"]);
  assert.equal(provider.manifest.owner, "devkits/projex/api/modules/addons");
});
