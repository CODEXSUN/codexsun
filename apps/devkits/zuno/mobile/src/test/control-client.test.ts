import assert from "node:assert/strict";
import test from "node:test";
import { readZunoMobileHealth, readZunoMobileOverview } from "../control-client";

test("Zuno mobile reads CXForge health", async () => {
  const health = await readZunoMobileHealth(async (url) => {
    assert.match(String(url), /\/api\/v1\/cxforge\/health$/u);
    return new Response(JSON.stringify({ status: "ok", providers: [] }));
  });
  assert.equal(health.status, "ok");
});

test("Zuno mobile reads the task overview without writes", async () => {
  const overview = await readZunoMobileOverview(async (url, init) => {
    assert.match(String(url), /\/api\/v1\/cxforge\/control\/overview$/u);
    assert.equal(init?.method, undefined);
    return new Response(JSON.stringify({ mode: "local-edge", runnerUrl: "http://runner.local", tasks: [] }));
  });
  assert.equal(overview.mode, "local-edge");
});
