import assert from "node:assert/strict";
import { once } from "node:events";
import http from "node:http";
import test from "node:test";
import { createApp } from "../src/app.mjs";
import { createTestClock } from "./fixtures/clock.mjs";
import {
  createAccessModule,
  createSecretsProvider,
  createWorkspaceAccessStore,
  createWorkspaceAccessService,
  createWorkspaceAuthorizationGuard,
  createEventSubscriptionHub,
  createRunCancellationCoordinator,
  createApprovalBindingManager,
  createUpstreamGateway,
} from "../src/modules/workspace-access/index.mjs";

async function setupTestEnvironment() {
  const clock = createTestClock(new Date("2026-09-24T12:00:00Z"));
  const secrets = createSecretsProvider({
    ZETRO2_JWT_SECRET: "phase1-exit-test-secret-424242",
  });
  const accessModule = createAccessModule({
    env: { ZETRO2_JWT_SECRET: "phase1-exit-test-secret-424242" },
    clock,
  });
  const store = await createWorkspaceAccessStore({
    sqliteFilename: ":memory:",
    secretsProvider: secrets,
  });
  const service = createWorkspaceAccessService({ store, accessModule, clock });
  const guard = createWorkspaceAuthorizationGuard({ service, store, accessModule });
  const hub = createEventSubscriptionHub({ guard });
  const cancellationCoordinator = createRunCancellationCoordinator({ store });
  const approvalManager = createApprovalBindingManager({ store, clock });

  return {
    clock,
    secrets,
    accessModule,
    store,
    service,
    guard,
    hub,
    cancellationCoordinator,
    approvalManager,
  };
}

function createMockUpstream() {
  const receivedRequests = [];
  const server = http.createServer((req, res) => {
    receivedRequests.push({ method: req.method, url: req.url, headers: req.headers });
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(
      JSON.stringify({
        status: "ok",
        actorId: req.headers["x-zetro2-actor-id"],
        role: req.headers["x-zetro2-role"],
        readonly: req.headers["x-zetro2-readonly"],
      }),
    );
  });
  return { server, receivedRequests };
}

test("Task 1.11 exit: HTTP role matrix proves read, write, membership, approve, and admin capabilities per role", async (t) => {
  const { store, service, guard, cancellationCoordinator, approvalManager } = await setupTestEnvironment();

  const server = createApp({
    accessService: service,
    guard,
    cancellationCoordinator,
    approvalManager,
  }).listen(0, "127.0.0.1");
  t.after(() => new Promise((resolve) => server.close(resolve)));
  t.after(() => store.close());
  await once(server, "listening");
  const origin = `http://127.0.0.1:${server.address().port}`;

  // Seed workspace owned by usr-admin (Owner)
  const adminLogin = await fetch(`${origin}/api/v1/zetro2/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userId: "usr-admin" }),
  });
  const adminToken = (await adminLogin.json()).token;

  const createWsRes = await fetch(`${origin}/api/v1/zetro2/workspaces`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${adminToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      slug: "role-matrix-ws",
      name: "Role Matrix Workspace",
      rootPath: "storage/apps/private/zetro2/workspaces/role-matrix",
    }),
  });
  assert.equal(createWsRes.status, 201);
  const ws = (await createWsRes.json()).workspace;

  // Add the four non-Owner roles
  const roleUsers = {
    Maintainer: "usr-maint",
    Developer: "usr-dev",
    Reviewer: "usr-reviewer",
    Viewer: "usr-viewer",
  };
  for (const [role, userId] of Object.entries(roleUsers)) {
    const addRes = await fetch(`${origin}/api/v1/zetro2/workspaces/${ws.id}/members`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${adminToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ userId, role }),
    });
    assert.equal(addRes.status, 201, `adding ${role} member`);
  }

  const tokens = { Owner: adminToken };
  for (const [role, userId] of Object.entries(roleUsers)) {
    const loginRes = await fetch(`${origin}/api/v1/zetro2/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, workspaceId: ws.id }),
    });
    assert.equal(loginRes.status, 200, `${role} login`);
    tokens[role] = (await loginRes.json()).token;
  }

  const readResource = (token) =>
    fetch(`${origin}/api/v1/zetro2/workspaces/${ws.id}/resources/spec`, {
      headers: { Authorization: `Bearer ${token}` },
    });
  const writeResource = (token) =>
    fetch(`${origin}/api/v1/zetro2/workspaces/${ws.id}/resources/spec`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ code: "matrix-write" }),
    });
  const manageMembers = (token) =>
    fetch(`${origin}/api/v1/zetro2/workspaces/${ws.id}/members`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ userId: "usr-new-member", role: "Viewer" }),
    });
  const readAudit = (token) =>
    fetch(`${origin}/api/v1/zetro2/workspaces/${ws.id}/audit-logs`, {
      headers: { Authorization: `Bearer ${token}` },
    });

  const expected = {
    Owner: { read: 200, write: 200, members: "owner-or-403", admin: 200 },
    Maintainer: { read: 200, write: 200, members: 403, admin: 403 },
    Developer: { read: 200, write: 200, members: 403, admin: 403 },
    Reviewer: { read: 200, write: 403, members: 403, admin: 403 },
    Viewer: { read: 200, write: 403, members: 403, admin: 403 },
  };

  // workspace.read: all five roles allowed
  for (const [role, token] of Object.entries(tokens)) {
    const res = await readResource(token);
    assert.equal(res.status, expected[role].read, `${role} workspace.read`);
  }

  // workspace.write: Owner, Maintainer, Developer allowed; Reviewer, Viewer denied
  for (const [role, token] of Object.entries(tokens)) {
    const res = await writeResource(token);
    assert.equal(res.status, expected[role].write, `${role} workspace.write`);
    if (res.status === 403) {
      const err = await res.json();
      assert.ok(err.error.includes("workspace.write"), `${role} denial names capability`);
    }
  }

  // membership.manage: only Owner allowed
  for (const [role, token] of Object.entries(tokens)) {
    const res = await manageMembers(token);
    if (role === "Owner") {
      // Owner may succeed (201) if usr-new-member not yet present, or 400 if duplicate
      assert.ok(
        res.status === 201 || res.status === 400,
        `Owner membership.manage expected 201/400, got ${res.status}`,
      );
    } else {
      assert.equal(res.status, 403, `${role} membership.manage`);
      const err = await res.json();
      assert.ok(err.error.includes("membership.manage"), `${role} denial names capability`);
    }
  }

  // workspace.admin: only Owner allowed
  for (const [role, token] of Object.entries(tokens)) {
    const res = await readAudit(token);
    assert.equal(res.status, expected[role].admin, `${role} workspace.admin`);
    if (res.status === 403) {
      const err = await res.json();
      assert.ok(err.error.includes("workspace.admin"), `${role} denial names capability`);
    }
  }

  // change.approve: Owner, Maintainer, Developer, Reviewer allowed; Viewer denied
  // Developer pre-creates one pending approval per role attempt.
  const approvalIds = {};
  for (const role of Object.keys(tokens)) {
    const createRes = await fetch(`${origin}/api/v1/zetro2/workspaces/${ws.id}/approvals`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${tokens.Developer}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        action: "change.apply",
        targetResource: `role-matrix-${role}.js`,
        content: `content-for-${role}`,
      }),
    });
    assert.equal(createRes.status, 201, `approval creation for ${role}`);
    approvalIds[role] = (await createRes.json()).approval.id;
  }

  for (const [role, token] of Object.entries(tokens)) {
    const decisionRes = await fetch(
      `${origin}/api/v1/zetro2/workspaces/${ws.id}/approvals/${approvalIds[role]}/decision`,
      {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ decision: "approved" }),
      },
    );
    if (role === "Viewer") {
      assert.equal(decisionRes.status, 403, "Viewer change.approve");
      const err = await decisionRes.json();
      assert.ok(err.error.includes("change.approve"));
    } else {
      assert.equal(decisionRes.status, 200, `${role} change.approve`);
      const data = await decisionRes.json();
      assert.equal(data.approval.status, "approved");
    }
  }

  // Unauthenticated requests to every guarded surface return 401
  for (const path of [
    `/api/v1/zetro2/auth/me`,
    `/api/v1/zetro2/workspaces`,
    `/api/v1/zetro2/workspaces/${ws.id}/members`,
    `/api/v1/zetro2/workspaces/${ws.id}/resources/spec`,
    `/api/v1/zetro2/workspaces/${ws.id}/audit-logs`,
    `/api/v1/zetro2/workspaces/${ws.id}/approvals`,
    `/api/v1/zetro2/workspaces/${ws.id}/runs`,
    `/api/v1/zetro2/workspaces/${ws.id}/events`,
  ]) {
    const res = await fetch(`${origin}${path}`);
    assert.equal(res.status, 401, `unauthenticated ${path}`);
  }

  // Forged identity headers are ignored: server resolves actor from token
  const spoofRes = await fetch(`${origin}/api/v1/zetro2/workspaces/${ws.id}/resources/spoof`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${tokens.Viewer}`,
      "Content-Type": "application/json",
      "x-zetro2-actor-id": "usr-admin",
      "x-zetro2-role": "Owner",
    },
    body: JSON.stringify({ code: "spoof" }),
  });
  assert.equal(spoofRes.status, 403, "forged headers cannot bypass Viewer write denial");
});

test("Task 1.11 exit: no unauthenticated or invalid-token upstream bypass through editor or preview gateway", async (t) => {
  const mockEditor = createMockUpstream();
  const mockPreview = createMockUpstream();
  mockEditor.server.listen(0, "127.0.0.1");
  mockPreview.server.listen(0, "127.0.0.1");
  t.after(() => new Promise((resolve) => mockEditor.server.close(resolve)));
  t.after(() => new Promise((resolve) => mockPreview.server.close(resolve)));
  await Promise.all([once(mockEditor.server, "listening"), once(mockPreview.server, "listening")]);

  const { store, service, guard, cancellationCoordinator, approvalManager } = await setupTestEnvironment();

  const gateway = createUpstreamGateway({
    guard,
    service,
    editorUpstreamUrl: `http://127.0.0.1:${mockEditor.server.address().port}`,
    previewUpstreamUrl: `http://127.0.0.1:${mockPreview.server.address().port}`,
  });

  const appServer = createApp({
    accessService: service,
    guard,
    gateway,
    cancellationCoordinator,
    approvalManager,
    editorUpstreamUrl: `http://127.0.0.1:${mockEditor.server.address().port}`,
    previewUpstreamUrl: `http://127.0.0.1:${mockPreview.server.address().port}`,
  }).listen(0, "127.0.0.1");
  t.after(() => new Promise((resolve) => appServer.close(resolve)));
  await once(appServer, "listening");
  const origin = `http://127.0.0.1:${appServer.address().port}`;

  const adminLogin = await service.login({ userId: "usr-admin" });
  const { workspace: ws } = await service.createWorkspace({
    actorId: "usr-admin",
    slug: "exit-gateway-ws",
    name: "Exit Gateway Workspace",
    rootPath: "storage/apps/private/zetro2/workspaces/exit-gateway",
  });

  // 1. No token: editor and preview gateways return 401 and never reach upstream
  const editorUnauth = await fetch(`${origin}/api/v1/zetro2/gateways/editor/${ws.id}/workbench`);
  assert.equal(editorUnauth.status, 401);

  const previewUnauth = await fetch(`${origin}/api/v1/zetro2/gateways/preview/${ws.id}/dist/index.html`);
  assert.equal(previewUnauth.status, 401);

  // 2. Garbage bearer token: rejected before upstream
  const editorBadToken = await fetch(`${origin}/api/v1/zetro2/gateways/editor/${ws.id}/workbench`, {
    headers: { Authorization: "Bearer not-a-valid-token" },
  });
  assert.ok(editorBadToken.status === 401 || editorBadToken.status === 403);

  const previewBadToken = await fetch(`${origin}/api/v1/zetro2/gateways/preview/${ws.id}/dist/index.html`, {
    headers: { Authorization: "Bearer not-a-valid-token" },
  });
  assert.ok(previewBadToken.status === 401 || previewBadToken.status === 403);

  // 3. Empty and malformed tokens never reach upstream
  const editorUndefinedToken = await fetch(`${origin}/api/v1/zetro2/gateways/editor/${ws.id}/workbench`, {
    headers: { Authorization: "Bearer undefined" },
  });
  assert.ok(editorUndefinedToken.status === 401 || editorUndefinedToken.status === 403);

  assert.equal(
    mockEditor.receivedRequests.length,
    0,
    "editor upstream must receive zero unauthenticated/invalid requests",
  );
  assert.equal(
    mockPreview.receivedRequests.length,
    0,
    "preview upstream must receive zero unauthenticated/invalid requests",
  );

  // 4. Valid member still reaches upstream (control case proves the gateway is live)
  await service.addMember({
    actorId: "usr-admin",
    workspaceId: ws.id,
    targetUserId: "usr-dev",
    role: "Developer",
  });
  const devLogin = await service.login({ userId: "usr-dev", workspaceId: ws.id });
  const authedEditor = await fetch(`${origin}/api/v1/zetro2/gateways/editor/${ws.id}/workbench`, {
    headers: { Authorization: `Bearer ${devLogin.token}` },
  });
  assert.equal(authedEditor.status, 200);
  assert.equal(mockEditor.receivedRequests.length, 1);

  const authedPreview = await fetch(`${origin}/api/v1/zetro2/gateways/preview/${ws.id}/dist/index.html`, {
    headers: { Authorization: `Bearer ${devLogin.token}` },
  });
  assert.equal(authedPreview.status, 200);
  assert.equal(mockPreview.receivedRequests.length, 1);

  // 5. Non-member token never reaches upstream
  const outsiderLogin = await service.login({ userId: "usr-outsider" });
  const outsiderEditor = await fetch(`${origin}/api/v1/zetro2/gateways/editor/${ws.id}/workbench`, {
    headers: { Authorization: `Bearer ${outsiderLogin.token}` },
  });
  assert.equal(outsiderEditor.status, 403);
  assert.equal(mockEditor.receivedRequests.length, 1, "non-member must not reach editor upstream");
});
