import assert from 'node:assert/strict';
import { once } from 'node:events';
import test from 'node:test';
import { createApp } from '../src/app.mjs';
import { createTestClock } from './fixtures/clock.mjs';
import {
  createAccessModule,
  createSecretsProvider,
  createWorkspaceAccessStore,
  createWorkspaceAccessService,
  createWorkspaceAuthorizationGuard,
  createEventSubscriptionHub,
  createRunCancellationCoordinator,
  createApprovalBindingManager,
} from '../src/modules/workspace-access/index.mjs';

async function setupTestEnvironment() {
  const clock = createTestClock(new Date('2026-09-24T12:00:00Z'));
  const secrets = createSecretsProvider({
    ZETRO2_JWT_SECRET: 'test-security-matrix-secret-999',
  });
  const accessModule = createAccessModule({
    env: { ZETRO2_JWT_SECRET: 'test-security-matrix-secret-999' },
    clock,
  });
  const store = await createWorkspaceAccessStore({
    sqliteFilename: ':memory:',
    secretsProvider: secrets,
  });
  const service = createWorkspaceAccessService({
    store,
    accessModule,
    clock,
  });
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

test('Task 1.10: Denied access for unauthenticated, non-member, and insufficient-capability requests', async (t) => {
  const { store, service, guard, cancellationCoordinator, approvalManager } =
    await setupTestEnvironment();

  const server = createApp({
    accessService: service,
    guard,
    cancellationCoordinator,
    approvalManager,
  }).listen(0, '127.0.0.1');

  t.after(() => new Promise((resolve) => server.close(resolve)));
  t.after(() => store.close());
  await once(server, 'listening');

  const origin = `http://127.0.0.1:${server.address().port}`;

  // 1. Unauthenticated requests to protected endpoints -> 401
  const res1 = await fetch(`${origin}/api/v1/zetro2/auth/me`);
  assert.equal(res1.status, 401);

  const res2 = await fetch(`${origin}/api/v1/zetro2/workspaces`);
  assert.equal(res2.status, 401);

  const res3 = await fetch(`${origin}/api/v1/zetro2/workspaces/ws-default/members`);
  assert.equal(res3.status, 401);

  // 2. Non-member access -> 403
  const adminLogin = await fetch(`${origin}/api/v1/zetro2/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId: 'usr-admin' }),
  });
  const adminToken = (await adminLogin.json()).token;

  // Create isolated workspace
  const secWsRes = await fetch(`${origin}/api/v1/zetro2/workspaces`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${adminToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      slug: 'isolated-ws',
      name: 'Isolated WS',
      rootPath: 'storage/apps/private/zetro2/workspaces/isolated',
    }),
  });
  const secWs = (await secWsRes.json()).workspace;

  // Add outsider ONLY to isolated-ws
  await fetch(`${origin}/api/v1/zetro2/workspaces/${secWs.id}/members`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${adminToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ userId: 'usr-outsider', role: 'Viewer' }),
  });

  const outsiderLogin = await fetch(`${origin}/api/v1/zetro2/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId: 'usr-outsider', workspaceId: secWs.id }),
  });
  const outsiderToken = (await outsiderLogin.json()).token;

  // Outsider has NO membership in ws-default -> 403 Forbidden!
  const res4 = await fetch(`${origin}/api/v1/zetro2/workspaces/ws-default/members`, {
    headers: { Authorization: `Bearer ${outsiderToken}` },
  });
  assert.equal(res4.status, 403);
  const err4 = await res4.json();
  assert.ok(err4.error.includes('does not hold membership'));

  // 3. Viewer capability limits -> 403 on write

  await fetch(`${origin}/api/v1/zetro2/workspaces/ws-default/members`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${adminToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ userId: 'usr-viewer', role: 'Viewer' }),
  });

  const viewerLogin = await fetch(`${origin}/api/v1/zetro2/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId: 'usr-viewer', workspaceId: 'ws-default' }),
  });
  const viewerToken = (await viewerLogin.json()).token;

  // Viewer reading is allowed (200)
  const readRes = await fetch(
    `${origin}/api/v1/zetro2/workspaces/ws-default/resources/config`,
    {
      headers: { Authorization: `Bearer ${viewerToken}` },
    }
  );
  assert.equal(readRes.status, 200);

  // Viewer writing is rejected (403)
  const writeRes = await fetch(
    `${origin}/api/v1/zetro2/workspaces/ws-default/resources/config`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${viewerToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ settings: { mode: 'exploit' } }),
    }
  );
  assert.equal(writeRes.status, 403);
  const writeErr = await writeRes.json();
  assert.ok(writeErr.error.includes('lacks required capability "workspace.write"'));
});

test('Task 1.10: ID substitution rejection ignores client-injected headers and enforces server actor ID', async (t) => {
  const { store, service, guard } = await setupTestEnvironment();

  const server = createApp({ accessService: service, guard }).listen(0, '127.0.0.1');
  t.after(() => new Promise((resolve) => server.close(resolve)));
  t.after(() => store.close());
  await once(server, 'listening');

  const origin = `http://127.0.0.1:${server.address().port}`;

  const adminLogin = await fetch(`${origin}/api/v1/zetro2/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId: 'usr-admin' }),
  });
  const adminToken = (await adminLogin.json()).token;

  // Add Developer Bob
  await fetch(`${origin}/api/v1/zetro2/workspaces/ws-default/members`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${adminToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ userId: 'usr-bob', role: 'Developer' }),
  });

  const bobLogin = await fetch(`${origin}/api/v1/zetro2/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId: 'usr-bob', workspaceId: 'ws-default' }),
  });
  const bobToken = (await bobLogin.json()).token;

  // Bob sends request claiming to be usr-admin or usr-alice via spoofed headers
  const spoofRes = await fetch(
    `${origin}/api/v1/zetro2/workspaces/ws-default/resources/test-spoof`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${bobToken}`,
        'Content-Type': 'application/json',
        'x-zetro2-actor-id': 'usr-admin',
        'x-zetro2-role': 'Owner',
      },
      body: JSON.stringify({ action: 'create' }),
    }
  );
  assert.equal(spoofRes.status, 200);
  const spoofData = await spoofRes.json();
  // Server-resolved actor ID MUST remain usr-bob, completely ignoring x-zetro2-actor-id
  assert.equal(spoofData.writtenBy, 'usr-bob');
});

test('Task 1.10: Session expiry prevents access once TTL elapsed under controlled clock', async () => {
  const { clock, store, service } = await setupTestEnvironment();

  try {
    const login = await service.login({
      userId: 'usr-admin',
      workspaceId: 'ws-default',
      ttlSeconds: 300,
    });
    const token = login.token;

    // Verify token works immediately
    const validAuth = await service.authenticateToken(token);
    assert.equal(validAuth.actor.id, 'usr-admin');

    // Advance clock past TTL (301 seconds)
    clock.advance(301 * 1000);

    // Verify token is rejected due to expiry
    await assert.rejects(async () => {
      await service.authenticateToken(token);
    }, /Session has expired or was revoked/);
  } finally {
    await store.close();
  }
});

test('Task 1.10: Dynamic role changes immediately take effect from server-resolved membership without re-login', async (t) => {
  const { store, service, guard } = await setupTestEnvironment();

  const server = createApp({ accessService: service, guard }).listen(0, '127.0.0.1');
  t.after(() => new Promise((resolve) => server.close(resolve)));
  t.after(() => store.close());
  await once(server, 'listening');

  const origin = `http://127.0.0.1:${server.address().port}`;

  const adminLogin = await fetch(`${origin}/api/v1/zetro2/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId: 'usr-admin' }),
  });
  const adminToken = (await adminLogin.json()).token;

  // Add Charlie as Developer
  await fetch(`${origin}/api/v1/zetro2/workspaces/ws-default/members`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${adminToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ userId: 'usr-charlie', role: 'Developer' }),
  });

  const charlieLogin = await fetch(`${origin}/api/v1/zetro2/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId: 'usr-charlie', workspaceId: 'ws-default' }),
  });
  const charlieToken = (await charlieLogin.json()).token;

  // 1. Charlie writes as Developer -> 200 OK
  const write1 = await fetch(
    `${origin}/api/v1/zetro2/workspaces/ws-default/resources/file.js`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${charlieToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ code: 'const x = 1;' }),
    }
  );
  assert.equal(write1.status, 200);

  // 2. Admin downgrades Charlie to Viewer in database
  const downgradeRes = await fetch(
    `${origin}/api/v1/zetro2/workspaces/ws-default/members/usr-charlie`,
    {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${adminToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ role: 'Viewer' }),
    }
  );
  assert.equal(downgradeRes.status, 200);

  // 3. Charlie attempts write with SAME token -> 403 Forbidden!
  // Because authorization resolves live membership from SQLite on every request!
  const write2 = await fetch(
    `${origin}/api/v1/zetro2/workspaces/ws-default/resources/file.js`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${charlieToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ code: 'const x = 2;' }),
    }
  );
  assert.equal(write2.status, 403);

  // 4. Admin restores Charlie to Developer
  await fetch(`${origin}/api/v1/zetro2/workspaces/ws-default/members/usr-charlie`, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${adminToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ role: 'Developer' }),
  });

  // 5. Charlie writes again with SAME token -> 200 OK immediately
  const write3 = await fetch(
    `${origin}/api/v1/zetro2/workspaces/ws-default/resources/file.js`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${charlieToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ code: 'const x = 3;' }),
    }
  );
  assert.equal(write3.status, 200);
});

test('Task 1.10: Cross-user and cross-workspace isolation prevents unauthorized reads', async (t) => {
  const { store, service, guard } = await setupTestEnvironment();

  const server = createApp({ accessService: service, guard }).listen(0, '127.0.0.1');
  t.after(() => new Promise((resolve) => server.close(resolve)));
  t.after(() => store.close());
  await once(server, 'listening');

  const origin = `http://127.0.0.1:${server.address().port}`;

  // Admin creates second workspace ws-secret
  const adminLogin = await fetch(`${origin}/api/v1/zetro2/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId: 'usr-admin' }),
  });
  const adminToken = (await adminLogin.json()).token;

  const createWsRes = await fetch(`${origin}/api/v1/zetro2/workspaces`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${adminToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      slug: 'secret-ws',
      name: 'Secret Project',
      rootPath: 'storage/apps/private/zetro2/workspaces/secret',
    }),
  });
  assert.equal(createWsRes.status, 201);
  const secretWs = (await createWsRes.json()).workspace;

  // Add Developer Dave ONLY to ws-default
  await fetch(`${origin}/api/v1/zetro2/workspaces/ws-default/members`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${adminToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ userId: 'usr-dave', role: 'Developer' }),
  });

  const daveLogin = await fetch(`${origin}/api/v1/zetro2/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId: 'usr-dave', workspaceId: 'ws-default' }),
  });
  const daveToken = (await daveLogin.json()).token;

  // Dave can read ws-default resources
  const readDefaultRes = await fetch(
    `${origin}/api/v1/zetro2/workspaces/ws-default/resources/project-spec`,
    {
      headers: { Authorization: `Bearer ${daveToken}` },
    }
  );
  assert.equal(readDefaultRes.status, 200);

  // Dave attempts cross-workspace read on secretWs -> 403 Forbidden!
  const readSecretRes = await fetch(
    `${origin}/api/v1/zetro2/workspaces/${secretWs.id}/resources/secret-data`,
    {
      headers: { Authorization: `Bearer ${daveToken}` },
    }
  );
  assert.equal(readSecretRes.status, 403);
  const secretErr = await readSecretRes.json();
  assert.ok(secretErr.error.includes('does not hold membership in workspace'));

  // Dave attempts to list secretWs members -> 403 Forbidden!
  const listMembersRes = await fetch(
    `${origin}/api/v1/zetro2/workspaces/${secretWs.id}/members`,
    {
      headers: { Authorization: `Bearer ${daveToken}` },
    }
  );
  assert.equal(listMembersRes.status, 403);
});
