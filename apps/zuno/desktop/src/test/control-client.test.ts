import assert from "node:assert/strict";
import test from "node:test";
import { readZunoHealth, readZunoOverview } from "../control-client";

test("Zuno desktop reads CXForge health from its configured server", async () => {
  const health = await readZunoHealth(async (url) => {
    assert.match(String(url), /\/api\/v1\/cxforge\/health$/u);
    return new Response(JSON.stringify({ status: "ok", providers: ["cxforge.foundation"] }));
  });
  assert.equal(health.status, "ok");
});

test("Zuno desktop reads the worker overview without a write route", async () => {
  const overview = await readZunoOverview(async (url, init) => {
    assert.match(String(url), /\/api\/v1\/cxforge\/control\/overview$/u);
    assert.equal(init?.method, undefined);
    return new Response(JSON.stringify({ mode: "local-edge", runnerUrl: "http://runner.local", tasks: [] }));
  });
  assert.equal(overview.runnerUrl, "http://runner.local");
});
