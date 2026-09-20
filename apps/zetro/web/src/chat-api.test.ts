import assert from "node:assert/strict";
import test from "node:test";
import { configureZetroApiRequest, getChatRuntime, listConversations } from "./chat-api.js";

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
          model: "gpt-5.6-terra",
          models: ["gpt-5.6-terra", "gpt-5.6-sol"],
          provider: "Codex",
          providers: ["Codex"],
          reasoning: "Medium",
          reasoningLevels: ["Low", "Medium"],
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

test("uses the authenticated request configured by the session boundary", async () => {
  let requested = false;
  configureZetroApiRequest(async (_input, init) => {
    requested = true;
    const headers = new Headers(init?.headers);
    headers.set("authorization", "Bearer zetro-session");
    assert.equal(headers.get("authorization"), "Bearer zetro-session");
    return new Response(JSON.stringify({ data: { conversations: [] }, version: "v1" }), { status: 200, headers: { "content-type": "application/json" } });
  });

  await listConversations();
  assert.equal(requested, true);
  configureZetroApiRequest((input, init) => fetch(input, init));
});
