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
} from '../src/modules/workspace-access/index.mjs';

async function setupTestEnvironment() {
  const clock = createTestClock(new Date('2026-09-24T12:00:00Z'));
  const secrets = createSecretsProvider({
    ZETRO2_JWT_SECRET: 'test-guard-and-subscriptions-secret-key-12345',
  });
  const accessModule = createAccessModule({
    env: { ZETRO2_JWT_SECRET: 'test-guard-and-subscriptions-secret-key-12345' },
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

  return { clock, secrets, accessModule, store, service, guard, hub };
}

test('Task 1.6: Server-resolved membership prevents unauthorized and cross-workspace access', async () => {
  const { store, service, guard } = await setupTestEnvironment();

  try {
    // 1. Admin logs in and creates workspace-2
    const adminLogin = await service.login({ userId: 'usr-admin' });
    const { workspace: ws2 } = await service.createWorkspace({
      actorId: 'usr-admin',
      slug: 'isolated-alpha',
      name: 'Isolated Alpha Workspace',
      rootPath: 'storage/apps/private/zetro2/workspaces/isolated-alpha',
    });

    // 2. Add Developer Bob to ws-default only
    await service.addMember({
      actorId: 'usr-admin',
      workspaceId: 'ws-default',
      targetUserId: 'usr-bob',
      role: 'Developer',
    });

    // Bob logs in
    const bobLogin = await service.login({ userId: 'usr-bob', workspaceId: 'ws-default' });

    // Bob can access ws-default
    const bobWsDefaultAuth = await guard.authorizeRequest(bobLogin.token, {
      workspaceId: 'ws-default',
      requiredCapability: 'workspace.read',
    });
    assert.equal(bobWsDefaultAuth.actorId, 'usr-bob');
    assert.equal(bobWsDefaultAuth.role, 'Developer');

    // Bob CANNOT access ws2 (isolated-alpha) where he holds no membership
    await assert.rejects(async () => {
      await guard.authorizeRequest(bobLogin.token, {
        workspaceId: ws2.id,
        requiredCapability: 'workspace.read',
      });
    }, /Forbidden: User "usr-bob" does not hold membership in workspace/);

    // Non-existent workspace returns 403 or 404
    await assert.rejects(async () => {
      await guard.authorizeRequest(bobLogin.token, {
        workspaceId: 'ws-fake-nonexistent',
      });
    }, /Forbidden: User "usr-bob" does not hold membership/);
  } finally {
    await store.close();
  }
});

test('Task 1.6: Server-enforced capability checks restrict Viewer from modifying resources', async () => {
  const { store, service, guard } = await setupTestEnvironment();

  try {
    await service.login({ userId: 'usr-admin' });

    // Add Charlie as Viewer
    await service.addMember({
      actorId: 'usr-admin',
      workspaceId: 'ws-default',
      targetUserId: 'usr-charlie',
      role: 'Viewer',
    });

    const charlieLogin = await service.login({
      userId: 'usr-charlie',
      workspaceId: 'ws-default',
    });

    // Charlie has workspace.read
    const readAuth = await guard.authorizeRequest(charlieLogin.token, {
      workspaceId: 'ws-default',
      requiredCapability: 'workspace.read',
    });
    assert.equal(readAuth.role, 'Viewer');

    // Charlie LACKS workspace.write
    await assert.rejects(async () => {
      await guard.authorizeRequest(charlieLogin.token, {
        workspaceId: 'ws-default',
        requiredCapability: 'workspace.write',
      });
    }, /Forbidden: Role "Viewer" lacks required capability "workspace.write"/);

    // Charlie LACKS membership.manage
    await assert.rejects(async () => {
      await guard.authorizeRequest(charlieLogin.token, {
        workspaceId: 'ws-default',
        requiredCapability: 'membership.manage',
      });
    }, /Forbidden: Role "Viewer" lacks required capability "membership.manage"/);
  } finally {
    await store.close();
  }
});

test('Task 1.6: Event subscription authorizer restricts channel subscriptions to members', async () => {
  const { store, service, guard, hub } = await setupTestEnvironment();

  try {
    await service.login({ userId: 'usr-admin' });

    // Workspace 2
    const { workspace: wsBeta } = await service.createWorkspace({
      actorId: 'usr-admin',
      slug: 'beta-ws',
      name: 'Beta Workspace',
      rootPath: 'storage/apps/private/zetro2/workspaces/beta-ws',
    });

    // Add Alice to beta-ws only
    await service.addMember({
      actorId: 'usr-admin',
      workspaceId: wsBeta.id,
      targetUserId: 'usr-alice',
      role: 'Developer',
    });

    const aliceLogin = await service.login({
      userId: 'usr-alice',
      workspaceId: wsBeta.id,
    });

    // Alice can subscribe to beta-ws events
    const receivedEvents = [];
    const sub = await hub.subscribe({
      token: aliceLogin.token,
      channel: `workspace:${wsBeta.id}:events`,
      listener: (evt) => receivedEvents.push(evt),
    });
    assert.ok(sub.subscriptionId);
    assert.equal(hub.getActiveSubscriberCount(`workspace:${wsBeta.id}:events`), 1);

    // Publishing event to beta-ws reaches Alice
    const delivered = hub.publish(`workspace:${wsBeta.id}:events`, {
      type: 'task.updated',
      taskId: 'TASK-101',
    });
    assert.equal(delivered, 1);
    assert.equal(receivedEvents.length, 1);
    assert.equal(receivedEvents[0].taskId, 'TASK-101');

    // Alice CANNOT subscribe to ws-default events (she is not a member of ws-default)
    await assert.rejects(async () => {
      await hub.subscribe({
        token: aliceLogin.token,
        channel: 'workspace:ws-default:events',
        listener: () => {},
      });
    }, /Forbidden: User "usr-alice" does not hold membership in workspace "ws-default"/);

    // Unsubscribe removes listener
    sub.unsubscribe();
    assert.equal(hub.getActiveSubscriberCount(`workspace:${wsBeta.id}:events`), 0);
  } finally {
    await store.close();
  }
});

test('Task 1.6: HTTP API enforces server-resolved membership and rejects unauthorized access', async (t) => {
  const { store, service, guard, hub } = await setupTestEnvironment();
  const server = createApp({ accessService: service, guard, subscriptionHub: hub }).listen(
    0,
    '127.0.0.1'
  );
  t.after(() => new Promise((resolve) => server.close(resolve)));
  t.after(() => store.close());
  await once(server, 'listening');

  const origin = `http://127.0.0.1:${server.address().port}`;

  // 1. Admin logs in and creates a project workspace
  const adminLoginRes = await fetch(`${origin}/api/v1/zetro2/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId: 'usr-admin' }),
  });
  const adminData = await adminLoginRes.json();
  const adminToken = adminData.token;

  const createWsRes = await fetch(`${origin}/api/v1/zetro2/workspaces`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${adminToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      slug: 'project-titan',
      name: 'Project Titan',
      rootPath: 'storage/apps/private/zetro2/workspaces/project-titan',
    }),
  });
  const titanWs = (await createWsRes.json()).workspace;

  // Add Developer Dave to titanWs
  await fetch(`${origin}/api/v1/zetro2/workspaces/${titanWs.id}/members`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${adminToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ userId: 'usr-dave', role: 'Developer' }),
  });

  // Add Viewer Eve to titanWs
  await fetch(`${origin}/api/v1/zetro2/workspaces/${titanWs.id}/members`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${adminToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ userId: 'usr-eve', role: 'Viewer' }),
  });

  // Login as Dave (Developer) and Eve (Viewer)
  const daveLoginRes = await fetch(`${origin}/api/v1/zetro2/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId: 'usr-dave', workspaceId: titanWs.id }),
  });
  const daveToken = (await daveLoginRes.json()).token;

  const eveLoginRes = await fetch(`${origin}/api/v1/zetro2/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId: 'usr-eve', workspaceId: titanWs.id }),
  });
  const eveToken = (await eveLoginRes.json()).token;

  // 2. Both Dave and Eve can read resources in titanWs (GET requires workspace.read)
  const daveReadRes = await fetch(
    `${origin}/api/v1/zetro2/workspaces/${titanWs.id}/resources/config`,
    {
      headers: { Authorization: `Bearer ${daveToken}` },
    }
  );
  assert.equal(daveReadRes.status, 200);

  const eveReadRes = await fetch(
    `${origin}/api/v1/zetro2/workspaces/${titanWs.id}/resources/config`,
    {
      headers: { Authorization: `Bearer ${eveToken}` },
    }
  );
  assert.equal(eveReadRes.status, 200);

  // 3. Dave (Developer) can write resources (POST requires workspace.write)
  const daveWriteRes = await fetch(
    `${origin}/api/v1/zetro2/workspaces/${titanWs.id}/resources/notes`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${daveToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ content: 'Architecture update' }),
    }
  );
  assert.equal(daveWriteRes.status, 200);

  // 4. Eve (Viewer) CANNOT write resources (403 Forbidden)
  const eveWriteRes = await fetch(
    `${origin}/api/v1/zetro2/workspaces/${titanWs.id}/resources/notes`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${eveToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ content: 'Malicious overwrite attempt' }),
    }
  );
  assert.equal(eveWriteRes.status, 403);

  // 5. Dave (Developer) CANNOT invite members to titanWs (403 Forbidden)
  const daveInviteRes = await fetch(
    `${origin}/api/v1/zetro2/workspaces/${titanWs.id}/members`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${daveToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ userId: 'usr-intruder', role: 'Owner' }),
    }
  );
  assert.equal(daveInviteRes.status, 403);

  // 6. Cross-workspace access attempt: Dave tries to access ws-default (where he is NOT a member) -> 403 Forbidden
  const daveCrossWsRes = await fetch(
    `${origin}/api/v1/zetro2/workspaces/ws-default/resources/secret-data`,
    {
      headers: { Authorization: `Bearer ${daveToken}` },
    }
  );
  assert.equal(daveCrossWsRes.status, 403);
});
