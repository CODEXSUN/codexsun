import assert from "node:assert/strict";
import test from "node:test";
import { PortalStore } from "../portal-store.js";

test("dropping a worker removes active credentials and retains its final report", () => {
  const store = new PortalStore(":memory:", "test-encryption-key");
  const server = store.saveServer({ name: "worker-alpha", apiUrl: "http://worker-alpha:6400", credential: "test-worker-key-long-enough" });
  store.set(`runtime:${server.id}`, { operationId: "request-123", containerId: "abc123", ports: [6400], previewUrl: "http://localhost:7300" });
  store.set(`snapshot:${server.id}`, { state: "ready" });
  store.set("provision-state:request-123", { status: "ready" });
  try {
    const dropped = store.dropServer(server.id, { name: server.name, apiUrl: server.apiUrl, containerId: "abc123", snapshot: { state: "ready" } });
    assert.equal(dropped.name, "worker-alpha");
    assert.throws(() => store.server(server.id));
    assert.equal(store.get(`runtime:${server.id}`), undefined);
    assert.equal(store.get(`snapshot:${server.id}`), undefined);
    assert.equal(store.get("provision-state:request-123"), undefined);
    assert.deepEqual(store.get(`dropped:${server.id}`), dropped);
  } finally { store.close(); }
});

test("workspace profiles retain setup defaults but exclude environment values", () => {
  const store = new PortalStore(":memory:", "test-encryption-key");
  try {
    const profile = store.saveWorkspaceProfile({ name: "Zuno", repositoryName: "codexsun", repositoryUrl: "https://github.com/CODEXSUN/codexsun.git", defaultBranch: "main", directory: "apps/devkits/zuno", databaseDriver: "sqlite", sqlitePath: ".cxforge/zuno.sqlite", installCommand: "npm ci", migrationStatusCommand: "npm run db:status", migrateCommand: "npm run db:migrate", migrationVerifyCommand: "npm run db:verify", previewCommand: "npm run dev" });
    assert.equal(store.workspaceProfiles()[0]?.id, profile.id);
    assert.equal("environment" in profile, false);
  } finally { store.close(); }
});
