import assert from "node:assert/strict";
import test from "node:test";
import { ChattyModuleProvider } from "../provider.js";

test("declares the chatty module owner and events", () => {
  const provider = new ChattyModuleProvider();
  assert.equal(provider.manifest.owner, "packages/addons/chatty/modules/chatty");
  assert.equal(provider.manifest.contracts[0], "chatty.v1");
});
