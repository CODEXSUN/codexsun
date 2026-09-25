import assert from "node:assert/strict";
import test from "node:test";
import { CalendyModuleProvider } from "../provider.js";

test("declares the calendy module owner and events", () => {
  const provider = new CalendyModuleProvider();
  assert.equal(provider.manifest.owner, "packages/addons/calendy/modules/calendy");
  assert.equal(provider.manifest.contracts[0], "calendy.v1");
});
