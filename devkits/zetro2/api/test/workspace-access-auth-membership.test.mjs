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
} from '../src/modules/workspace-access/index.mjs';

async function setupTestEnvironment(initialDate = '2026-09-24T12:00:00Z') {
  const clock = createTestClock(new Date(initialDate));
  const secrets = createSecretsProvider({
    ZETRO2_JWT_SECRET: 'test-auth-membership-secret-key-12345',
  });
  const accessModule = createAccessModule({
    env: { ZETRO2_JWT_SECRET: 'test-auth-membership-secret-key-12345' },
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

  return { clock, secrets, accessModule, store, service };
}

test('Authentication: login, session verification, logout, and token invalidation', async () => {
  const { store, service } = await setupTestEnvironment();

  try {
    // 1. Initial login for admin (seeded as Owner of ws-default)
    const loginResult = await service.login({
      userId: 'usr-admin',
      email: 'admin@codexsun.local',
    });

    assert.ok(loginResult.token, 'Must return JWT token');
    assert.equal(loginResult.user.id, 'usr-admin');
    assert.equal(loginResult.user.role, 'Owner');
    assert.equal(loginResult.workspace.id, 'ws-default');

    // 2. Authenticate token
    const authMe = await service.authenticateToken(loginResult.token);
    assert.equal(authMe.actor.id, 'usr-admin');
    assert.equal(authMe.actor.role, 'Owner');
    assert.equal(authMe.session.status, 'active');

    // 3. Logout
    const logoutResult = await service.logout({
      sessionId: loginResult.session.id,
      actorId: 'usr-admin',
      workspaceId: 'ws-default',
    });
    assert.equal(logoutResult.success, true);

    // 4. Token is now invalid because session is revoked
    await assert.rejects(async () => {
      await service.authenticateToken(loginResult.token);
    }, /Session (has )?expired or (was )?revoked/);
  } finally {
    await store.close();
  }
});

test('Session Expiration: sessions expire past TTL using controlled clock', async () => {
  const { clock, store, service } = await setupTestEnvironment();

  try {
    const loginResult = await service.login({
      userId: 'usr-admin',
      ttlSeconds: 600, // 10 minutes
    });

    // Valid immediately
    const immediate = await service.authenticateToken(loginResult.token);
    assert.equal(immediate.actor.id, 'usr-admin');

    // Advance clock by 11 minutes (660 seconds)
    clock.advanceMinutes(11);

    // Should now reject as expired
    await assert.rejects(async () => {
      await service.authenticateToken(loginResult.token);
    }, /Session (has )?expired or (was )?revoked/);
  } finally {
    await store.close();
  }
});

test('Workspace Selection: users switch between authorized workspaces and receive scoped tokens', async () => {
  const { store, service } = await setupTestEnvironment();

  try {
    // Login as admin and create a second workspace
    const adminLogin = await service.login({ userId: 'usr-admin' });
    const { workspace: ws2 } = await service.createWorkspace({
      actorId: 'usr-admin',
      slug: 'mobile-app',
      name: 'Mobile Application',
      rootPath: 'storage/apps/private/zetro2/workspaces/mobile-app',
    });

    // Add a developer to both workspaces
    await service.addMember({
      actorId: 'usr-admin',
      workspaceId: 'ws-default',
      targetUserId: 'usr-dev-bob',
      role: 'Developer',
    });
    await service.addMember({
      actorId: 'usr-admin',
      workspaceId: ws2.id,
      targetUserId: 'usr-dev-bob',
      role: 'Reviewer', // Bob is Reviewer in mobile-app
    });

    // Bob logs in initially (gets ws-default with Developer role)
    const bobLogin = await service.login({ userId: 'usr-dev-bob', workspaceId: 'ws-default' });
    assert.equal(bobLogin.workspace.id, 'ws-default');
    assert.equal(bobLogin.user.role, 'Developer');

    // Bob selects workspace mobile-app
    const selectResult = await service.selectWorkspace({
      actorId: 'usr-dev-bob',
      currentSessionId: bobLogin.session.id,
      targetWorkspaceId: ws2.id,
    });
    assert.equal(selectResult.workspace.id, ws2.id);
    assert.equal(selectResult.role, 'Reviewer');

    // Verify Bob's new token reflects Reviewer role in ws2
    const verifyBobWs2 = await service.authenticateToken(selectResult.token);
    assert.equal(verifyBobWs2.actor.role, 'Reviewer');
    assert.equal(verifyBobWs2.actor.workspaceId, ws2.id);

    // Bob cannot select a workspace he is not a member of
    await assert.rejects(async () => {
      await service.selectWorkspace({
        actorId: 'usr-dev-bob',
        targetWorkspaceId: 'ws-non-existent',
      });
    }, /Workspace "ws-non-existent" not found/);
  } finally {
    await store.close();
  }
});

test('Membership Management: enforces hierarchy, invitations, role updates, and removal', async () => {
  const { store, service } = await setupTestEnvironment();

  try {
    await service.login({ userId: 'usr-admin' });

    // 1. Owner invites Developer
    const devMem = await service.addMember({
      actorId: 'usr-admin',
      workspaceId: 'ws-default',
      targetUserId: 'usr-alice',
      role: 'Developer',
    });
    assert.equal(devMem.role, 'Developer');

    // 2. Developer cannot manage memberships (Forbidden)
    await assert.rejects(async () => {
      await service.addMember({
        actorId: 'usr-alice',
        workspaceId: 'ws-default',
        targetUserId: 'usr-charlie',
        role: 'Viewer',
      });
    }, /Forbidden: Role "Developer" cannot manage workspace memberships/);

    // 3. Owner updates Alice to Maintainer
    const updated = await service.updateMemberRole({
      actorId: 'usr-admin',
      workspaceId: 'ws-default',
      targetUserId: 'usr-alice',
      newRole: 'Maintainer',
    });
    assert.equal(updated.role, 'Maintainer');

    // 4. Maintainer cannot assign Owner role (Rank hierarchy violation / membership management restriction)
    await assert.rejects(async () => {
      await service.updateMemberRole({
        actorId: 'usr-alice',
        workspaceId: 'ws-default',
        targetUserId: 'usr-alice',
        newRole: 'Owner',
      });
    }, /Forbidden: Role "Maintainer" cannot/);

    // 5. Owner removes Alice
    const removal = await service.removeMember({
      actorId: 'usr-admin',
      workspaceId: 'ws-default',
      targetUserId: 'usr-alice',
    });
    assert.equal(removal.removed, true);

    // 6. Cannot remove the last Owner
    await assert.rejects(async () => {
      await service.removeMember({
        actorId: 'usr-admin',
        workspaceId: 'ws-default',
        targetUserId: 'usr-admin',
      });
    }, /Forbidden: Cannot remove the last Owner/);
  } finally {
    await store.close();
  }
});

test('HTTP API: login, me, workspace creation, membership endpoints, and logout', async (t) => {
  const { store, service } = await setupTestEnvironment();
  const server = createApp({ accessService: service }).listen(0, '127.0.0.1');
  t.after(() => new Promise((resolve) => server.close(resolve)));
  t.after(() => store.close());
  await once(server, 'listening');

  const origin = `http://127.0.0.1:${server.address().port}`;

  // 1. Health check still functions
  const healthRes = await fetch(`${origin}/api/v1/zetro2/health`);
  assert.equal(healthRes.status, 200);

  // 2. Unfinished application routes still 404
  const taskRes = await fetch(`${origin}/api/v1/zetro2/tasks`);
  assert.equal(taskRes.status, 404);

  // 3. Login via API
  const loginRes = await fetch(`${origin}/api/v1/zetro2/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId: 'usr-admin' }),
  });
  assert.equal(loginRes.status, 200);
  const loginData = await loginRes.json();
  assert.ok(loginData.token);
  const token = loginData.token;

  // 4. GET /api/v1/zetro2/auth/me
  const meRes = await fetch(`${origin}/api/v1/zetro2/auth/me`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  assert.equal(meRes.status, 200);
  const meData = await meRes.json();
  assert.equal(meData.actor.id, 'usr-admin');
  assert.equal(meData.actor.role, 'Owner');

  // 5. POST /api/v1/zetro2/workspaces
  const createWsRes = await fetch(`${origin}/api/v1/zetro2/workspaces`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      slug: 'backend-services',
      name: 'Backend Services',
      rootPath: 'storage/apps/private/zetro2/workspaces/backend-services',
    }),
  });
  assert.equal(createWsRes.status, 201);
  const newWsData = await createWsRes.json();
  assert.equal(newWsData.workspace.slug, 'backend-services');

  // 6. POST /api/v1/zetro2/workspaces/:id/members (invite member)
  const inviteRes = await fetch(
    `${origin}/api/v1/zetro2/workspaces/${newWsData.workspace.id}/members`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userId: 'usr-engineer-1',
        role: 'Developer',
      }),
    }
  );
  assert.equal(inviteRes.status, 201);

  // 7. GET /api/v1/zetro2/workspaces/:id/members
  const listMembersRes = await fetch(
    `${origin}/api/v1/zetro2/workspaces/${newWsData.workspace.id}/members`,
    {
      headers: { Authorization: `Bearer ${token}` },
    }
  );
  assert.equal(listMembersRes.status, 200);
  const membersList = await listMembersRes.json();
  assert.equal(membersList.members.length, 2); // Owner + invited Developer

  // 8. PUT /api/v1/zetro2/workspaces/:id/members/:userId (update role)
  const updateRes = await fetch(
    `${origin}/api/v1/zetro2/workspaces/${newWsData.workspace.id}/members/usr-engineer-1`,
    {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ role: 'Reviewer' }),
    }
  );
  assert.equal(updateRes.status, 200);

  // 9. Logout
  const logoutRes = await fetch(`${origin}/api/v1/zetro2/auth/logout`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ sessionId: loginData.session.id }),
  });
  assert.equal(logoutRes.status, 200);

  // 10. Subsequent authenticated call rejected with 401
  const postLogoutMe = await fetch(`${origin}/api/v1/zetro2/auth/me`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  assert.equal(postLogoutMe.status, 401);
});
