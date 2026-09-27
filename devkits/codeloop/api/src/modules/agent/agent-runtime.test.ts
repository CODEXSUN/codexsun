import assert from "node:assert/strict";
import test from "node:test";
import { runAgentChat } from "./agent-runtime.js";

test("agent runtime prefers the current AgentCrew token over a stale saved Ollama key", async () => {
  const originalFetch = globalThis.fetch;
  let authorization = "";
  globalThis.fetch = (async (_input, init) => {
    authorization = new Headers(init?.headers).get("authorization") ?? "";
    return new Response(JSON.stringify({ model: "qwen3:4b", message: { role: "assistant", content: "ok" } }), { status: 200, headers: { "content-type": "application/json" } });
  }) as typeof fetch;
  try {
    const result = await runAgentChat({ providerId: "ollama", enabled: true, endpoint: "http://127.0.0.1:6411", model: "qwen3:4b", apiKey: "stale-token" }, [{ role: "user", content: "hello" }], { agentCrewApiUrl: "http://127.0.0.1:6411", agentCrewToken: "current-token" }, { definitions: () => [], execute: async () => { throw new Error("not expected"); } } as never);
    assert.equal(result.status, "completed");
    assert.equal(authorization, "Bearer current-token");
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("agent runtime executes JSON tool requests returned as assistant content", async () => {
  const originalFetch = globalThis.fetch;
  let requestCount = 0;
  let executed = "";
  globalThis.fetch = (async (_input, init) => {
    const body = JSON.parse(String(init?.body)) as { messages: Array<{ role: string; content: string }> };
    assert.equal(body.messages[0]?.role, "system");
    requestCount += 1;
    const response = requestCount === 1
      ? { model: "qwen2.5-coder:7b", message: { role: "assistant", content: "```json\n" + JSON.stringify({ name: "fs.read", arguments: { path: "package.json" } }) + "\n```" } }
      : { model: "qwen2.5-coder:7b", message: { role: "assistant", content: "codexsun 1.0.43" } };
    return new Response(JSON.stringify(response), { status: 200, headers: { "content-type": "application/json" } });
  }) as typeof fetch;
  try {
    const result = await runAgentChat(
      { providerId: "ollama", enabled: true, endpoint: "http://127.0.0.1:6411", model: "qwen2.5-coder:7b" },
      [{ role: "user", content: "Use fs.read on package.json." }],
      { agentCrewApiUrl: "http://127.0.0.1:6411", agentCrewToken: "current-token" },
      {
        definitions: () => [{ type: "function", function: { name: "fs.read", description: "Read a file.", parameters: {} } }],
        execute: async (call: { name: string }) => { executed = call.name; return { tool: call.name, callId: "tool-1", status: "completed", durationMs: 1, result: { content: "{\\\"name\\\":\\\"codexsun\\\"}" } }; },
      } as never,
    );
    assert.equal(result.status, "completed");
    assert.equal(executed, "fs.read");
    assert.equal(result.content, "codexsun 1.0.43");
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("agent runtime retries a transient upstream response and reports non-JSON failures safely", async () => {
  const originalFetch = globalThis.fetch;
  let requestCount = 0;
  globalThis.fetch = (async () => {
    requestCount += 1;
    if (requestCount === 1) return new Response("<html>busy</html>", { status: 503, headers: { "content-type": "text/html" } });
    return new Response(JSON.stringify({ model: "qwen2.5-coder:7b", message: { role: "assistant", content: "recovered" } }), { status: 200, headers: { "content-type": "application/json" } });
  }) as typeof fetch;
  try {
    const result = await runAgentChat(
      { providerId: "ollama", enabled: true, endpoint: "http://127.0.0.1:6411", model: "qwen2.5-coder:7b" },
      [{ role: "user", content: "Reply briefly." }],
      { agentCrewApiUrl: "http://127.0.0.1:6411", agentCrewToken: "current-token" },
      { definitions: () => [], execute: async () => { throw new Error("not expected"); } } as never,
    );
    assert.equal(result.status, "completed");
    assert.equal(result.content, "recovered");
    assert.equal(requestCount, 2);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("agent runtime executes multiple JSON tool requests returned in one content block", async () => {
  const originalFetch = globalThis.fetch;
  let requestCount = 0;
  const executed: string[] = [];
  globalThis.fetch = (async () => {
    requestCount += 1;
    const response = requestCount === 1
      ? { model: "qwen2.5-coder:7b", message: { role: "assistant", content: JSON.stringify({ name: "fs.list", arguments: { path: "devkits" } }) + "\n" + JSON.stringify({ name: "project.scan", arguments: {} }) } }
      : { model: "qwen2.5-coder:7b", message: { role: "assistant", content: "inspection complete" } };
    return new Response(JSON.stringify(response), { status: 200, headers: { "content-type": "application/json" } });
  }) as typeof fetch;
  try {
    const result = await runAgentChat(
      { providerId: "ollama", enabled: true, endpoint: "http://127.0.0.1:6411", model: "qwen2.5-coder:7b" },
      [{ role: "user", content: "Inspect the project." }],
      { agentCrewApiUrl: "http://127.0.0.1:6411", agentCrewToken: "current-token" },
      {
        definitions: () => [
          { type: "function", function: { name: "fs.list", description: "List files.", parameters: {} } },
          { type: "function", function: { name: "project.scan", description: "Scan project.", parameters: {} } },
        ],
        execute: async (call: { name: string }) => { executed.push(call.name); return { tool: call.name, callId: call.name, status: "completed", durationMs: 1, result: {} }; },
      } as never,
    );
    assert.equal(result.status, "completed");
    assert.deepEqual(executed, ["fs.list", "project.scan"]);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("agent runtime recognizes a raw JSON write request with HTML content", async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = (async () => new Response(JSON.stringify({ model: "qwen3:4b", message: { role: "assistant", content: JSON.stringify({ name: "fs.write", arguments: { path: "mini-site/index.html", content: "<main><h1>Hello</h1><style>body { color: navy; }</style></main>" } }) } }), { status: 200, headers: { "content-type": "application/json" } })) as typeof fetch;
  try {
    const result = await runAgentChat(
      { providerId: "ollama", enabled: true, endpoint: "http://127.0.0.1:6411", model: "qwen3:4b" },
      [{ role: "user", content: "Create a mini site." }],
      { agentCrewApiUrl: "http://127.0.0.1:6411", agentCrewToken: "current-token" },
      { definitions: () => [{ type: "function", function: { name: "fs.write", description: "Write a file.", parameters: {} } }], execute: async () => ({ tool: "fs.write", callId: "write-1", status: "approval_required", durationMs: 1, result: {} }) } as never,
    );
    assert.equal(result.status, "error");
    assert.equal(result.pendingApprovals?.[0]?.tool, "fs.write");
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("agent runtime recovers an explicitly narrated read-only tool request", async () => {
  const originalFetch = globalThis.fetch;
  let requestCount = 0;
  let executed = "";
  globalThis.fetch = (async () => {
    requestCount += 1;
    const response = requestCount === 1
      ? { model: "qwen3:4b", message: { role: "assistant", content: "I should inspect the selected project to see what is in the workspace before continuing." } }
      : { model: "qwen3:4b", message: { role: "assistant", content: "Inspection complete." } };
    return new Response(JSON.stringify(response), { status: 200, headers: { "content-type": "application/json" } });
  }) as typeof fetch;
  try {
    const result = await runAgentChat(
      { providerId: "ollama", enabled: true, endpoint: "http://127.0.0.1:6411", model: "qwen3:4b" },
      [{ role: "user", content: "Inspect the project." }],
      { agentCrewApiUrl: "http://127.0.0.1:6411", agentCrewToken: "current-token" },
      { definitions: () => [{ type: "function", function: { name: "project.scan", description: "Scan project.", parameters: {} } }], execute: async (call: { name: string }) => { executed = call.name; return { tool: call.name, callId: "scan-1", status: "completed", durationMs: 1, result: { root: "project" } }; } } as never,
    );
    assert.equal(result.status, "completed");
    assert.equal(executed, "project.scan");
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("mini-site requests use the compact local-model protocol when project.scan is named", async () => {
  const originalFetch = globalThis.fetch;
  let toolNames: string[] = [];
  globalThis.fetch = (async (_input, init) => {
    const body = JSON.parse(String(init?.body)) as { tools?: { function?: { name?: string } }[] };
    toolNames = (body.tools ?? []).map((tool) => tool.function?.name ?? "");
    return new Response(JSON.stringify({ model: "qwen3:4b", message: { role: "assistant", content: "Ready." } }), { status: 200, headers: { "content-type": "application/json" } });
  }) as typeof fetch;
  try {
    const result = await runAgentChat(
      { providerId: "ollama", enabled: true, endpoint: "http://127.0.0.1:6411", model: "qwen3:4b" },
      [{ role: "user", content: "Create a mini site. First call project.scan." }],
      { agentCrewApiUrl: "http://127.0.0.1:6411", agentCrewToken: "current-token" },
      { definitions: () => ["project.scan", "fs.list", "fs.read", "fs.write", "validate", "terminal.exec"].map((name) => ({ type: "function", function: { name, description: name, parameters: {} } })), execute: async () => ({ tool: "", callId: "", status: "completed", durationMs: 1, result: {} }) } as never,
    );
    assert.equal(result.status, "completed");
    assert.deepEqual(toolNames, []);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("mini-site narration becomes an approval-gated write after project.scan", async () => {
  const originalFetch = globalThis.fetch;
  let requestCount = 0;
  let approvedCall = "";
  globalThis.fetch = (async () => {
    requestCount += 1;
    const content = requestCount === 1
      ? "I need to call project.scan to inspect the project."
      : "The project is inspected. I will create the mini site file now.";
    return new Response(JSON.stringify({ model: "qwen3:4b", message: { role: "assistant", content } }), { status: 200, headers: { "content-type": "application/json" } });
  }) as typeof fetch;
  try {
    const result = await runAgentChat(
      { providerId: "ollama", enabled: true, endpoint: "http://127.0.0.1:6411", model: "qwen3:4b" },
      [{ role: "user", content: "Create a mini site in manual-site/index.html." }],
      { agentCrewApiUrl: "http://127.0.0.1:6411", agentCrewToken: "current-token" },
      {
        definitions: () => ["project.scan", "fs.write"].map((name) => ({ type: "function", function: { name, description: name, parameters: {} } })),
        execute: async (call: { name: string; arguments: Record<string, unknown> }, approved: boolean) => { approvedCall = call.name; return { tool: call.name, callId: call.name, status: call.name === "project.scan" || approved ? "completed" : "approval_required", durationMs: 1, result: {} }; },
      } as never,
    );
    assert.equal(result.status, "error");
    assert.equal(result.pendingApprovals?.[0]?.tool, "fs.write");
    assert.equal(approvedCall, "project.scan");
    assert.equal(requestCount, 1);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("React component requests use the bounded approval workflow", async () => {
  const originalFetch = globalThis.fetch;
  let requestCount = 0;
  globalThis.fetch = (async () => {
    requestCount += 1;
    return new Response(JSON.stringify({ model: "qwen3:4b", message: { role: "assistant", content: "I should inspect the selected project before creating the component." } }), { status: 200, headers: { "content-type": "application/json" } });
  }) as typeof fetch;
  try {
    const result = await runAgentChat(
      { providerId: "ollama", enabled: true, endpoint: "http://127.0.0.1:6411", model: "qwen3:4b" },
      [{ role: "user", content: "Create a small React + TypeScript component in manual-site/src/components/StatusCard.tsx. First inspect the selected project and ask for approval before writing." }],
      { agentCrewApiUrl: "http://127.0.0.1:6411", agentCrewToken: "current-token" },
      {
        definitions: () => ["project.scan", "fs.write"].map((name) => ({ type: "function", function: { name, description: name, parameters: {} } })),
        execute: async (call: { name: string }, approved: boolean) => ({ tool: call.name, callId: call.name, status: call.name === "project.scan" || approved ? "completed" : "approval_required", durationMs: 1, result: {} }),
      } as never,
    );
    assert.equal(result.status, "error");
    assert.equal(result.pendingApprovals?.[0]?.tool, "fs.write");
    assert.equal(result.pendingApprovals?.[0]?.arguments.path, "manual-site/src/components/StatusCard.tsx");
    assert.match(String(result.pendingApprovals?.[0]?.arguments.content), /export function StatusCard/);
    assert.equal(requestCount, 1);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("bounded component generation preserves the requested component name", async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = (async () => new Response(JSON.stringify({ model: "qwen3:4b", message: { role: "assistant", content: "I should inspect the selected project first." } }), { status: 200, headers: { "content-type": "application/json" } })) as typeof fetch;
  try {
    const result = await runAgentChat(
      { providerId: "ollama", enabled: true, endpoint: "http://127.0.0.1:6411", model: "qwen3:4b" },
      [{ role: "user", content: "Create a React TypeScript component in manual-site/src/components/HealthPanel.tsx. Inspect first and ask for approval." }],
      { agentCrewApiUrl: "http://127.0.0.1:6411", agentCrewToken: "current-token" },
      { definitions: () => ["project.scan", "fs.write"].map((name) => ({ type: "function", function: { name, description: name, parameters: {} } })), execute: async (call: { name: string }, approved: boolean) => ({ tool: call.name, callId: call.name, status: call.name === "project.scan" || approved ? "completed" : "approval_required", durationMs: 1, result: {} }) } as never,
    );
    assert.equal(result.pendingApprovals?.[0]?.arguments.path, "manual-site/src/components/HealthPanel.tsx");
    assert.match(String(result.pendingApprovals?.[0]?.arguments.content), /export function HealthPanel/);
  } finally {
    globalThis.fetch = originalFetch;
  }
});
