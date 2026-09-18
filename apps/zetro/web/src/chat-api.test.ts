import assert from "node:assert/strict";
import test from "node:test";
import { getChatRuntime, listConversations } from "./chat-api.js";

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

test("reads the live Codex runtime settings from the dedicated runtime route", async () => {
  const originalFetch = globalThis.fetch;
  let requestedUrl = "";
  globalThis.fetch = async (input) => {
    requestedUrl = String(input);
    return new Response(
      JSON.stringify({
        data: {
          connected: true,
          message: "Local Codex CLI is ready.",
          model: "Default",
          models: ["Default", "gpt-5.6-sol"],
          provider: "Codex",
          providers: ["Codex"],
          reasoning: "Default",
          reasoningLevels: ["Default", "Low"],
        },
        version: "v1",
      }),
      { status: 200, headers: { "content-type": "application/json" } },
    );
  };

  try {
    assert.equal((await getChatRuntime()).connected, true);
    assert.equal(requestedUrl, "/api/zetro/v1/chat/runtime");
  } finally {
    globalThis.fetch = originalFetch;
  }
});
