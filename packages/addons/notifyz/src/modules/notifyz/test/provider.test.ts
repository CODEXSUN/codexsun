import assert from "node:assert/strict";
import test from "node:test";
import { NotifyzModuleProvider } from "../provider.js";

test("declares the notifyz module owner and events", () => {
  const provider = new NotifyzModuleProvider();
  assert.equal(provider.manifest.owner, "packages/addons/notifyz/modules/notifyz");
  assert.equal(provider.manifest.contracts[0], "notifyz.v1");
});
