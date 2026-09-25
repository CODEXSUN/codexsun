import assert from "node:assert/strict";
import test from "node:test";
import { createAddonProvider, createChattyService, definition, routes } from "../src/index.js";

test("declares the chatty provider contract", () => {
  const provider = createAddonProvider();
  assert.equal(provider.manifest.id, "chatty.provider");
  assert.deepEqual(provider.manifest.contracts, ["chatty.v1"]);
  assert.equal(routes[0].contract, "chatty.v1");
});

test("runs the chatty purpose-specific backend action", () => {
  const record = createChattyService().createMessage({ channelId: "general", senderId: "actor-1", text: "Hello" });
  assert.equal(record.status, "draft");
  assert.equal(record.text, "Hello");
});
