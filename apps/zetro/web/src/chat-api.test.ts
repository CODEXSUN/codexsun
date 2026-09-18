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

test("reads the live Codex runtime settings from the Zetro API", async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () =>
    new Response(
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

  try {
    assert.equal((await getChatRuntime()).connected, true);
  } finally {
    globalThis.fetch = originalFetch;
  }
});
