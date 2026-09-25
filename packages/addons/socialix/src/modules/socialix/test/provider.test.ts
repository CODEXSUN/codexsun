import assert from "node:assert/strict";
import test from "node:test";
import { SocialixModuleProvider } from "../provider.js";

test("declares the socialix module owner and events", () => {
  const provider = new SocialixModuleProvider();
  assert.equal(provider.manifest.owner, "packages/addons/socialix/modules/socialix");
  assert.equal(provider.manifest.contracts[0], "socialix.v1");
});
