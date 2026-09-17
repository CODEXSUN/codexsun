import assert from "node:assert/strict";
import test from "node:test";
import { listConversations } from "./chat-api.js";

test("reads a chat conversation list from the Zetro API", async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () =>
    new Response(
      JSON.stringify({ data: { conversations: [] }, version: "v1" }),
      { status: 200, headers: { "content-type": "application/json" } },
    );

  try {
    assert.deepEqual(await listConversations(), []);
  } finally {
    globalThis.fetch = originalFetch;
  }
});
