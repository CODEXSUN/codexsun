import assert from 'node:assert/strict';
import { once } from 'node:events';
import test from 'node:test';
import { createApp } from '../src/app.mjs';
import { createTestClock } from './fixtures/clock.mjs';
import { createTestBackendFixture } from './fixtures/backend.mjs';
import {
  createAccessModule,
  createSecretsProvider,
  createWorkspaceAccessStore,
  createWorkspaceAccessService,
  createWorkspaceAuthorizationGuard,
  createEventSubscriptionHub,
  createRunCancellationCoordinator,
} from '../src/modules/workspace-access/index.mjs';

async function setupTestEnvironment() {
  const clock = createTestClock(new Date('2026-09-24T12:00:00Z'));
  const secrets = createSecretsProvider({
    ZETRO2_JWT_SECRET: 'test-cancellation-secret-key-12345',
  });
  const accessModule = createAccessModule({
    env: { ZETRO2_JWT_SECRET: 'test-cancellation-secret-key-12345' },
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
  const backendFixture = createTestBackendFixture();

  return {
    clock,
    secrets,
    accessModule,
    store,
    service,
    guard,
    hub,
    cancellationCoordinator,
    backendFixture,
  };
}

test('Task 1.9: Run-cancellation hooks invoked deterministically via backend fixture', async () => {
  const { store, service, cancellationCoordinator, backendFixture } = await setupTestEnvironment();

  try {
    await service.login({ userId: 'usr-admin' });
    await service.addMember({
      actorId: 'usr-admin',
      workspaceId: 'ws-default',
      targetUserId: 'usr-coder',
      role: 'Developer',
    });

    // 1. Backend fixture starts an agent run
    const simRun = backendFixture.startRun({
      runId: 'run-job-101',
      taskId: 'task-42',
      workspaceId: 'ws-default',
      actorId: 'usr-coder',
      prompt: 'Refactor user authentication',
    });
    assert.equal(simRun.status, 'running');

    // 2. Register run with cancellation hook in coordinator
    let hookInvoked = false;
    cancellationCoordinator.registerRun({
      runId: 'run-job-101',
      workspaceId: 'ws-default',
      actorId: 'usr-coder',
      sessionId: 'ses-coder-1',
      cancelHook: ({ reason, cancelledBy }) => {
        hookInvoked = true;
        backendFixture.cancelRun('run-job-101', reason);
      },
    });

    assert.equal(cancellationCoordinator.hasActiveRun('run-job-101'), true);
    assert.equal(cancellationCoordinator.listActiveRuns({ workspaceId: 'ws-default' }).length, 1);

    // 3. Cancel run explicitly
    const result = await cancellationCoordinator.cancelRun('run-job-101', {
      reason: 'aborted_by_reviewer',
      cancelledBy: 'usr-admin',
    });

    assert.equal(result.cancelled, true);
    assert.equal(hookInvoked, true);

    // Backend fixture verified cancelled
    const updatedSimRun = backendFixture.getRun('run-job-101');
    assert.equal(updatedSimRun.status, 'cancelled');
    assert.equal(updatedSimRun.cancelReason, 'aborted_by_reviewer');

    // Coordinator no longer holds active run
    assert.equal(cancellationCoordinator.hasActiveRun('run-job-101'), false);
    assert.equal(cancellationCoordinator.listActiveRuns({ workspaceId: 'ws-default' }).length, 0);

    // Audit log was recorded
    const logs = await store.repository.listAuditLogs('ws-default');
    const cancelLog = logs.find((l) => l.action === 'run.cancelled');
    assert.ok(cancelLog, 'Audit log for run.cancelled must exist');
    assert.equal(cancelLog.target_id, 'run-job-101');
  } finally {
    await store.close();
  }
});

test('Task 1.9: Session logout revokes subscriptions and cancels active runs', async () => {
  const { store, service, hub, cancellationCoordinator, backendFixture } =
    await setupTestEnvironment();

  try {
    // Setup membership
    await service.login({ userId: 'usr-admin' });
    await service.addMember({
      actorId: 'usr-admin',
      workspaceId: 'ws-default',
      targetUserId: 'usr-dev-1',
      role: 'Developer',
    });

    // Dev logs in
    const login = await service.login({ userId: 'usr-dev-1', workspaceId: 'ws-default' });
    const sessionId = login.session.id;
    const token = login.token;

    // Dev subscribes to SSE channel
    let subscriptionClosed = false;
    const sub = await hub.subscribe({
      token,
      channel: 'workspace:ws-default:events',
      listener: () => {},
    });
    // Override unsubscribe to detect closure
    const originalUnsub = sub.unsubscribe.bind(sub);
    sub.unsubscribe = () => {
      subscriptionClosed = true;
      originalUnsub();
    };

    assert.equal(hub.getActiveSubscriptionCount(), 1);

    // Dev starts 2 simulated runs under this session
    backendFixture.startRun({
      runId: 'run-job-201',
      taskId: 'task-1',
      workspaceId: 'ws-default',
      actorId: 'usr-dev-1',
    });
    backendFixture.startRun({
      runId: 'run-job-202',
      taskId: 'task-2',
      workspaceId: 'ws-default',
      actorId: 'usr-dev-1',
    });

    cancellationCoordinator.registerRun({
      runId: 'run-job-201',
      workspaceId: 'ws-default',
      actorId: 'usr-dev-1',
      sessionId,
      cancelHook: ({ reason }) => backendFixture.cancelRun('run-job-201', reason),
    });

    cancellationCoordinator.registerRun({
      runId: 'run-job-202',
      workspaceId: 'ws-default',
      actorId: 'usr-dev-1',
      sessionId,
      cancelHook: ({ reason }) => backendFixture.cancelRun('run-job-202', reason),
    });

    assert.equal(cancellationCoordinator.listActiveRuns({ sessionId }).length, 2);

    // Log out dev session
    await service.logout({ sessionId, actorId: 'usr-dev-1' });
    hub.revokeSubscriptionsForSession(sessionId);
    await cancellationCoordinator.cancelRunsForSession(sessionId, {
      reason: 'session_logout',
      cancelledBy: 'usr-dev-1',
    });

    // 1. Session is invalidated
    await assert.rejects(async () => {
      await service.authenticateToken(token);
    }, /Session has expired or was revoked/);

    // 2. Subscriptions purged
    assert.equal(hub.getActiveSubscriptionCount(), 0);

    // 3. Runs cancelled in backend fixture
    assert.equal(backendFixture.getRun('run-job-201').status, 'cancelled');
    assert.equal(backendFixture.getRun('run-job-202').status, 'cancelled');
    assert.equal(cancellationCoordinator.listActiveRuns({ sessionId }).length, 0);
  } finally {
    await store.close();
  }
});

test('Task 1.9: Workspace member removal cancels all active runs for that actor', async () => {
  const { store, service, cancellationCoordinator, backendFixture } = await setupTestEnvironment();

  try {
    await service.login({ userId: 'usr-admin' });
    await service.addMember({
      actorId: 'usr-admin',
      workspaceId: 'ws-default',
      targetUserId: 'usr-contractor',
      role: 'Developer',
    });

    backendFixture.startRun({
      runId: 'run-contractor-99',
      taskId: 'task-audit',
      workspaceId: 'ws-default',
      actorId: 'usr-contractor',
    });

    cancellationCoordinator.registerRun({
      runId: 'run-contractor-99',
      workspaceId: 'ws-default',
      actorId: 'usr-contractor',
      sessionId: 'ses-contractor-1',
      cancelHook: ({ reason }) => backendFixture.cancelRun('run-contractor-99', reason),
    });

    assert.equal(cancellationCoordinator.hasActiveRun('run-contractor-99'), true);

    // Admin removes contractor from workspace
    await service.removeMember({
      actorId: 'usr-admin',
      workspaceId: 'ws-default',
      targetUserId: 'usr-contractor',
    });
    await cancellationCoordinator.cancelRunsForActor('usr-contractor', {
      workspaceId: 'ws-default',
      reason: 'membership_removed',
      cancelledBy: 'usr-admin',
    });

    // Verify run cancelled
    assert.equal(backendFixture.getRun('run-contractor-99').status, 'cancelled');
    assert.equal(cancellationCoordinator.hasActiveRun('run-contractor-99'), false);
  } finally {
    await store.close();
  }
});

test('Task 1.9: HTTP REST API exposes run listing and cancellation endpoints', async (t) => {
  const { store, service, guard, cancellationCoordinator, backendFixture } =
    await setupTestEnvironment();

  const server = createApp({
    accessService: service,
    guard,
    cancellationCoordinator,
  }).listen(0, '127.0.0.1');

  t.after(() => new Promise((resolve) => server.close(resolve)));
  t.after(() => store.close());
  await once(server, 'listening');

  const origin = `http://127.0.0.1:${server.address().port}`;

  // Admin logs in
  const adminLoginRes = await fetch(`${origin}/api/v1/zetro2/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId: 'usr-admin' }),
  });
  const adminToken = (await adminLoginRes.json()).token;

  // Add Developer Alice
  await fetch(`${origin}/api/v1/zetro2/workspaces/ws-default/members`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${adminToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ userId: 'usr-alice', role: 'Developer' }),
  });

  const aliceLoginRes = await fetch(`${origin}/api/v1/zetro2/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId: 'usr-alice', workspaceId: 'ws-default' }),
  });
  const aliceToken = (await aliceLoginRes.json()).token;

  // Register an active run for Alice
  backendFixture.startRun({
    runId: 'run-alice-1',
    taskId: 'task-ui',
    workspaceId: 'ws-default',
    actorId: 'usr-alice',
  });

  cancellationCoordinator.registerRun({
    runId: 'run-alice-1',
    workspaceId: 'ws-default',
    actorId: 'usr-alice',
    sessionId: 'ses-alice',
    cancelHook: ({ reason }) => backendFixture.cancelRun('run-alice-1', reason),
  });

  // 1. List active runs via GET /api/v1/zetro2/workspaces/ws-default/runs
  const listRes = await fetch(`${origin}/api/v1/zetro2/workspaces/ws-default/runs`, {
    headers: { Authorization: `Bearer ${aliceToken}` },
  });
  assert.equal(listRes.status, 200);
  const listData = await listRes.json();
  assert.equal(listData.runs.length, 1);
  assert.equal(listData.runs[0].runId, 'run-alice-1');

  // 2. Cancel run via POST /api/v1/zetro2/workspaces/ws-default/runs/run-alice-1/cancel
  const cancelRes = await fetch(
    `${origin}/api/v1/zetro2/workspaces/ws-default/runs/run-alice-1/cancel`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${aliceToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ reason: 'Stop execution' }),
    }
  );
  assert.equal(cancelRes.status, 200);
  const cancelData = await cancelRes.json();
  assert.equal(cancelData.cancelled, true);

  // Fixture verifies cancelled
  assert.equal(backendFixture.getRun('run-alice-1').status, 'cancelled');

  // Second cancel returns { cancelled: false }
  const secondCancelRes = await fetch(
    `${origin}/api/v1/zetro2/workspaces/ws-default/runs/run-alice-1/cancel`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${aliceToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ reason: 'Stop execution again' }),
    }
  );
  assert.equal(secondCancelRes.status, 200);
  const secondCancelData = await secondCancelRes.json();
  assert.equal(secondCancelData.cancelled, false);
});
