import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import Fastify from "fastify";
import { PortalStore } from "../portal-store";
import { PortalService } from "../portal-service";
import { registerWorkspaceRoutes } from "../workspace-routes";
import { registerPortalRoutes } from "../portal-routes";

// Opt-in integration test. Leaves its named workers running for inspection.
if (process.env.ZUNO_LIVE_DOCKER !== "1") throw new Error("Set ZUNO_LIVE_DOCKER=1 to create two test containers");
const store = new PortalStore(":memory:", randomUUID());
const service = new PortalService(store);
const app = Fastify();
let token = randomUUID();
const browserSession = randomUUID();
const actor = (request: { headers: { authorization?: string } }) => request.headers.authorization === `Bearer ${token}` ? "live-test" : undefined;
app.addHook("onRequest", async (request, reply) => { if (!actor(request)) return reply.code(401).send({ error: "Authentication required" }); });
registerWorkspaceRoutes(app, service, process.cwd(), actor);
registerPortalRoutes(app, service, actor);
const origin = process.env.ZUNO_LIVE_ORIGIN || await app.listen({ port: 0, host: "127.0.0.1" });
if (process.env.ZUNO_LIVE_ORIGIN) {
  const login = await fetch(`${origin}/api/v1/zuno/auth/development-login`, {
    method: "POST", headers: { "X-Codexsun-Browser-Session": browserSession, "X-Codexsun-Auto-Login-Desk": "user" },
  });
  assert.ok(login.ok, "Development login must be enabled on the local test deployment");
  token = (await login.json()).token;
}
const request = async (path: string, body?: unknown) => {
  const response = await fetch(`${origin}/api/v1/zuno/control${path}`, { method: body ? "POST" : "GET", headers: { Authorization: `Bearer ${token}`, "X-Codexsun-Browser-Session": browserSession, "Content-Type": "application/json" }, body: body ? JSON.stringify(body) : undefined });
  const result = await response.json();
  assert.ok(response.ok, JSON.stringify(result));
  return result;
};
const step = (command: string) => ({ argv: ["sh", "-lc", command], directory: ".", timeoutSeconds: 120 });
const preview = "node -e \"require('http').createServer((q,s)=>s.end(require('fs').readFileSync('.cxforge/page.html'))).listen({port},'0.0.0.0')\"";
const setup = (marker: string) => ({
  requestId: randomUUID(), title: `Development fixture ${marker}`, approved: true, directory: ".",
  repository: { name: "Public smoke repository", repository: "https://github.com/octocat/Hello-World.git", defaultBranch: "master" },
  environment: { SMOKE_MARKER: marker }, databaseDriver: "sqlite", sqlitePath: ".cxforge/smoke.sqlite",
  install: step(`npm init -y && npm install --ignore-scripts --no-audit --no-fund && printf '<h1>${marker}</h1>' > .cxforge/page.html`),
  migrationStatus: step('sqlite3 "$CXFORGE_SQLITE_PATH" "PRAGMA user_version;"'),
  migrate: step('sqlite3 "$CXFORGE_SQLITE_PATH" "CREATE TABLE IF NOT EXISTS smoke(id INTEGER PRIMARY KEY); PRAGMA user_version=1;"'),
  migrationVerify: step('test "$(sqlite3 "$CXFORGE_SQLITE_PATH" "PRAGMA user_version;")" = 1'), previewCommand: preview,
});
try {
  assert.equal((await fetch(`${origin}/api/v1/zuno/control/provisions`)).status, 401);
  const inputs = ["alpha", "beta"].map((marker) => ({ requestId: randomUUID(), name: `zuno-e2e-${marker}`, setup: setup(marker) }));
  const operations = await Promise.all(inputs.map((input) => request("/provisions", input)));
  const duplicate = await request("/provisions", inputs[0]);
  assert.equal(duplicate.id, operations[0].id);
  const ready = await Promise.all(operations.map(async (operation) => {
    const deadline = Date.now() + 300000;
    while (Date.now() < deadline) {
      const next = await request(`/provisions/${operation.id}`);
      if (next.status === "failed") {
        const report = next.serverId && next.taskId ? await request(`/servers/${next.serverId}/commands/${next.taskId}`) : next;
        throw new Error(JSON.stringify(report));
      }
      if (next.status === "ready") return next;
      await new Promise((resolve) => setTimeout(resolve, 1500));
    }
    throw new Error("Workspace timeout");
  }));
  assert.notEqual(ready[0].containerId, ready[1].containerId);
  assert.equal(new Set(ready.flatMap((operation) => operation.ports)).size, 10);
  for (const [index, operation] of ready.entries()) {
    const snapshot = await request(`/servers/${operation.serverId}/snapshot`);
    assert.equal(snapshot.state, "ready", JSON.stringify(snapshot));
    assert.equal(snapshot.overview.containerName, operation.name);
    const page = await fetch(`http://127.0.0.1:${operation.ports[1]}`);
    assert.match(await page.text(), new RegExp(index === 0 ? "alpha" : "beta"));
  }
  const first = ready[0];
  const edit = await request(`/servers/${first.serverId}/commands`, { requestId: randomUUID(), title: "Live edit verification", steps: [step("test \"$PWD\" = /workspace && test \"$SMOKE_MARKER\" = alpha && test -d .git && test ! -d repo && printf '<h1>alpha revised</h1>' > .cxforge/page.html && git status --short")] });
  for (let attempt = 0; attempt < 60; attempt++) {
    const result = await request(`/servers/${first.serverId}/commands/${edit.id}`);
    if (result.status === "review") break;
    assert.ok(!["blocked", "failed", "cancelled"].includes(result.status), JSON.stringify(result));
    if (attempt === 59) throw new Error("Edit timed out");
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }
  assert.match(await (await fetch(`http://127.0.0.1:${first.ports[1]}`)).text(), /alpha revised/u);
  assert.doesNotMatch(await (await fetch(`http://127.0.0.1:${ready[1].ports[1]}`)).text(), /revised/u);
  console.log(JSON.stringify({ result: "PASS", assertions: ["authentication", "two containers", "idempotent create", "10 distinct ports", "clone", "npm install", "SQLite migration", "preview", "snapshot contract", "same-workspace edit", "isolation"], workers: ready }, null, 2));
} finally { await app.close(); store.close(); }
