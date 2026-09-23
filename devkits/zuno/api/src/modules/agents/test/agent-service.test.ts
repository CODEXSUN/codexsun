import assert from "node:assert/strict";
import test from "node:test";
import { AgentService } from "../agent-service.js";
import { AgentStore } from "../agent-store.js";

test("proxies ZXA connection status without exposing the control key", async () => {
  const store = new AgentStore(":memory:");
  store.register({ apiUrl: "http://zxa.test:7210", capacity: 1, id: "00000000-0000-4000-8000-000000000001", name: "ZXA", protocolVersion: 1 });
  const calls = [];
  const service = new AgentService(store, {} as never, "a".repeat(32), "b".repeat(32), async (url, init) => {
    calls.push({ headers: init?.headers, url });
    return new Response(JSON.stringify({ connected: true, status: "connected" }), { status: 200 });
  });
  assert.deepEqual(await service.connection("00000000-0000-4000-8000-000000000001"), { connected: true, status: "connected" });
  assert.deepEqual(calls, [{ headers: { "X-ZXA-Control-Key": "b".repeat(32) }, url: "http://zxa.test:7210/connect/status" }]);
  store.close();
});
