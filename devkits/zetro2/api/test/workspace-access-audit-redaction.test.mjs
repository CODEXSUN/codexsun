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
  createRunCancellationCoordinator,
  createApprovalBindingManager,
} from '../src/modules/workspace-access/index.mjs';

async function setupTestEnvironment() {
  const clock = createTestClock(new Date('2026-09-24T12:00:00Z'));
  const secrets = createSecretsProvider({
    ZETRO2_JWT_SECRET: 'super-secret-production-signing-key-98765',
    API_TOKEN: 'token-xyz-sensitive-bearer-value',
  });
  const accessModule = createAccessModule({
    env: { ZETRO2_JWT_SECRET: 'super-secret-production-signing-key-98765' },
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
  const cancellationCoordinator = createRunCancellationCoordinator({ store });
  const approvalManager = createApprovalBindingManager({ store, clock });

  return {
    clock,
    secrets,
    accessModule,
    store,
    service,
    guard,
    cancellationCoordinator,
    approvalManager,
  };
}

test('Task 1.10a: Automatic secret and credential redaction prevents sensitive data persistence in audit logs', async () => {
  const { store, secrets } = await setupTestEnvironment();

  try {
    // Record audit log with details containing known secrets and sensitive keys
    const log = await store.repository.recordAuditLog({
      workspaceId: 'ws-default',
      actorId: 'usr-admin',
      action: 'security.credential_provisioned',
      targetType: 'secret',
      targetId: 'sec-1',
      details: {
        signingSecret: 'super-secret-production-signing-key-98765',
        bearerToken: 'token-xyz-sensitive-bearer-value',
        notes: 'Provisioned new signing secret for integration',
      },
    });

    assert.ok(log.id);
    assert.equal(log.action, 'security.credential_provisioned');

    // Retrieve raw row directly from SQLite database to verify physical persistence
    const rawRows = await store.database
      .selectFrom('zetro_access_audit_logs')
      .selectAll()
      .where('id', '=', log.id)
      .execute();

    assert.equal(rawRows.length, 1);
    const rawDetails = rawRows[0].details_json;

    // Must NOT contain the plaintext secret values
    assert.equal(
      rawDetails.includes('super-secret-production-signing-key-98765'),
      false,
      'Raw details must not contain plaintext signing key'
    );
    assert.equal(
      rawDetails.includes('token-xyz-sensitive-bearer-value'),
      false,
      'Raw details must not contain plaintext bearer token'
    );

    // Must contain [REDACTED]
    assert.ok(rawDetails.includes('[REDACTED]'));
  } finally {
    await store.close();
  }
});

test('Task 1.10a: Comprehensive action audit coverage across auth, membership, approvals, and runs', async () => {
  const { store, service, approvalManager, cancellationCoordinator } = await setupTestEnvironment();

  try {
    // 1. Auth Login
    await service.login({ userId: 'usr-admin' });

    // 2. Add Member
    const member = await service.addMember({
      actorId: 'usr-admin',
      workspaceId: 'ws-default',
      targetUserId: 'usr-dev-bob',
      role: 'Developer',
    });

    // 3. Update Member Role
    await service.updateMemberRole({
      actorId: 'usr-admin',
      workspaceId: 'ws-default',
      targetUserId: 'usr-dev-bob',
      newRole: 'Maintainer',
    });

    // 4. Request Approval
    await approvalManager.requestApproval({
      workspaceId: 'ws-default',
      actorId: 'usr-dev-bob',
      action: 'change.apply',
      targetResource: 'src/main.js',
      content: 'console.log("hello");',
    });

    // 5. Run Cancellation
    cancellationCoordinator.registerRun({
      runId: 'run-909',
      workspaceId: 'ws-default',
      actorId: 'usr-dev-bob',
      cancelHook: () => {},
    });
    await cancellationCoordinator.cancelRun('run-909', {
      reason: 'manual_abort',
      cancelledBy: 'usr-admin',
    });

    // 6. Member Removal
    await service.removeMember({
      actorId: 'usr-admin',
      workspaceId: 'ws-default',
      targetUserId: 'usr-dev-bob',
    });

    // Verify all lifecycle actions were recorded
    const allLogs = await store.repository.listAuditLogs('ws-default', 100);
    const recordedActions = allLogs.map((l) => l.action);

    assert.ok(recordedActions.includes('auth.login'));
    assert.ok(recordedActions.includes('membership.add'));
    assert.ok(recordedActions.includes('membership.update_role'));
    assert.ok(recordedActions.includes('approval.requested'));
    assert.ok(recordedActions.includes('run.cancelled'));
    assert.ok(recordedActions.includes('membership.remove'));

    // Filter verification
    const runLogs = await store.repository.listAuditLogs({
      workspaceId: 'ws-default',
      action: 'run.cancelled',
    });
    assert.equal(runLogs.length, 1);
    assert.equal(runLogs[0].target_id, 'run-909');
  } finally {
    await store.close();
  }
});

test('Task 1.10a: HTTP API audit logs endpoint requires workspace.admin capability', async (t) => {
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

  // Admin login (Owner has workspace.admin)
  const adminLogin = await fetch(`${origin}/api/v1/zetro2/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId: 'usr-admin' }),
  });
  const adminToken = (await adminLogin.json()).token;

  // Add Developer Frank
  await fetch(`${origin}/api/v1/zetro2/workspaces/ws-default/members`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${adminToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ userId: 'usr-frank', role: 'Developer' }),
  });

  const frankLogin = await fetch(`${origin}/api/v1/zetro2/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId: 'usr-frank', workspaceId: 'ws-default' }),
  });
  const frankToken = (await frankLogin.json()).token;

  // 1. Developer Frank attempts to read audit logs -> 403 Forbidden!
  const frankAuditRes = await fetch(`${origin}/api/v1/zetro2/workspaces/ws-default/audit-logs`, {
    headers: { Authorization: `Bearer ${frankToken}` },
  });
  assert.equal(frankAuditRes.status, 403);
  const frankErr = await frankAuditRes.json();
  assert.ok(frankErr.error.includes('lacks required capability "workspace.admin"'));

  // 2. Owner Admin reads audit logs -> 200 OK
  const adminAuditRes = await fetch(
    `${origin}/api/v1/zetro2/workspaces/ws-default/audit-logs?action=membership.add`,
    {
      headers: { Authorization: `Bearer ${adminToken}` },
    }
  );
  assert.equal(adminAuditRes.status, 200);
  const adminAuditData = await adminAuditRes.json();
  assert.ok(Array.isArray(adminAuditData.auditLogs));
  assert.ok(adminAuditData.auditLogs.length >= 1);
  assert.equal(adminAuditData.auditLogs[0].action, 'membership.add');
});
