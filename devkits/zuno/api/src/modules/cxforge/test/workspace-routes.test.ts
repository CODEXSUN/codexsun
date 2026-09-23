import assert from "node:assert/strict";
import test from "node:test";
import Fastify from "fastify";
import { PortalStore } from "../portal-store";
import { PortalService } from "../portal-service";
import { registerWorkspaceRoutes } from "../workspace-routes";
import { workspaceSetup } from "../workspace-contracts";
import { registerPortalRoutes } from "../portal-routes";

test("workspace routes require authentication, validate input and deduplicate commands", async () => {
  const store = new PortalStore(":memory:", "test-encryption-key");
  const server = store.saveServer({ name: "worker", apiUrl: "http://localhost:6400", credential: "test-worker-key-long-enough" });
  let calls = 0;
  const service = new PortalService(store, (async () => {
    calls++;
    return Response.json({ id: "command-123", title: "Check", status: "queued", revision: 1, tools: {} });
  }) as typeof fetch);
  const app = Fastify();
  registerWorkspaceRoutes(app, service, process.cwd(), (request) => request.headers.authorization === "Bearer test" ? "actor" : undefined);
  registerPortalRoutes(app, service, (request) => request.headers.authorization === "Bearer test" ? "actor" : undefined);
  const url = `/api/v1/zuno/control/servers/${server.id}/commands`;
  const headers = { authorization: "Bearer test" };
  const payload = { requestId: "command-123", title: "Check", steps: [{ argv: ["pwd"], directory: ".", timeoutSeconds: 30 }] };
  try {
    for (const suffix of ["tasks", "tasks/command-123/queue", "tasks/command-123/publish", "tasks/command-123/merge", "repositories/repo-123/sync"]) {
      assert.equal((await app.inject({ method: "POST", url: `/api/v1/zuno/control/servers/${server.id}/${suffix}`, headers, payload: {} })).statusCode, 404);
    }
    assert.equal((await app.inject({ method: "POST", url, payload })).statusCode, 401);
    assert.equal((await app.inject({ method: "POST", url, headers, payload: { ...payload, steps: [{ ...payload.steps[0], directory: "../escape" }] } })).statusCode, 400);
    assert.equal((await app.inject({ method: "POST", url, headers, payload })).statusCode, 202);
    assert.equal((await app.inject({ method: "POST", url, headers, payload })).statusCode, 202);
    assert.equal(calls, 1);
    assert.equal((await app.inject({ method: "POST", url, headers, payload: { ...payload, title: "Changed" } })).statusCode, 409);
    const profiles = "/api/v1/zuno/control/workspace-profiles";
    const profile = { name: "Zuno", repositoryName: "codexsun", repositoryUrl: "https://github.com/CODEXSUN/codexsun.git", defaultBranch: "main", directory: "devkits/zuno", databaseDriver: "sqlite", sqlitePath: ".cxforge/zuno.sqlite", installCommand: "npm ci", migrationStatusCommand: "npm run db:status", migrateCommand: "npm run db:migrate", migrationVerifyCommand: "npm run db:verify", previewCommand: "npm run dev" };
    assert.equal((await app.inject({ method: "GET", url: profiles })).statusCode, 401);
    assert.equal((await app.inject({ method: "POST", url: profiles, headers, payload: profile })).statusCode, 201);
    const profileList = await app.inject({ method: "GET", url: profiles, headers });
    assert.equal(profileList.statusCode, 200);
    assert.equal(JSON.parse(profileList.body)[0].name, "Zuno");
  } finally { await app.close(); store.close(); }
});

test("SQLite setup requires migration checks; database-free projects can skip them", () => {
  const input = { requestId: "setup-123", title: "Setup", approved: true, directory: ".", install: { argv: ["npm", "ci"], directory: ".", timeoutSeconds: 300 }, previewCommand: "npm run dev" };
  assert.equal(workspaceSetup.safeParse(input).success, false);
  assert.equal(workspaceSetup.safeParse({ ...input, databaseDriver: "none" }).success, true);
});
