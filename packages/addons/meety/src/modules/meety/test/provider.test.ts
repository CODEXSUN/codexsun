import assert from "node:assert/strict";
import test from "node:test";
import { MeetyModuleProvider } from "../provider.js";

test("declares the meety module owner and events", () => {
  const provider = new MeetyModuleProvider();
  assert.equal(provider.manifest.owner, "packages/addons/meety/modules/meety");
  assert.equal(provider.manifest.contracts[0], "meety.v1");
});
