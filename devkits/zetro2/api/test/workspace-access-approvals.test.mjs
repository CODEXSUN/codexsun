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
  createApprovalBindingManager,
} from '../src/modules/workspace-access/index.mjs';

async function setupTestEnvironment() {
  const clock = createTestClock(new Date('2026-09-24T12:00:00Z'));
  const secrets = createSecretsProvider({
    ZETRO2_JWT_SECRET: 'test-approvals-secret-key-12345',
  });
  const accessModule = createAccessModule({
    env: { ZETRO2_JWT_SECRET: 'test-approvals-secret-key-12345' },
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
  const approvalManager = createApprovalBindingManager({ store, clock });

  return { clock, secrets, accessModule, store, service, guard, approvalManager };
}

test('Task 1.8: Approval lifecycle: request, decision, content verification, and single-use consumption', async () => {
  const { clock, store, service, approvalManager } = await setupTestEnvironment();

  try {
    // 1. Setup workspace & memberships
    await service.login({ userId: 'usr-admin' });
    await service.addMember({
      actorId: 'usr-admin',
      workspaceId: 'ws-default',
      targetUserId: 'usr-dev',
      role: 'Developer',
    });
    await service.addMember({
      actorId: 'usr-admin',
      workspaceId: 'ws-default',
      targetUserId: 'usr-lead',
      role: 'Reviewer',
    });

    const fileContent = 'export function calculateTotal(items) { return items.reduce((a, b) => a + b, 0); }';
    const contentDigest = approvalManager.computeContentDigest(fileContent);

    // 2. Dev requests approval for patching calculateTotal
    const approval = await approvalManager.requestApproval({
      workspaceId: 'ws-default',
      actorId: 'usr-dev',
      action: 'change.apply',
      targetResource: 'src/billing.js',
      content: fileContent,
      ttlSeconds: 1800,
    });
    assert.equal(approval.status, 'pending');
    assert.equal(approval.content_digest, contentDigest);
    assert.equal(approval.actor_id, 'usr-dev');
    assert.equal(approval.workspace_id, 'ws-default');

    // Attempting to consume while pending fails
    await assert.rejects(async () => {
      await approvalManager.verifyAndConsumeApproval({
        approvalId: approval.id,
        actorId: 'usr-dev',
        workspaceId: 'ws-default',
        action: 'change.apply',
        targetResource: 'src/billing.js',
        content: fileContent,
      });
    }, /Approval pending/);

    // 3. Reviewer decides and approves
    const approved = await approvalManager.decideApproval({
      approvalId: approval.id,
      approverId: 'usr-lead',
      decision: 'approved',
    });
    assert.equal(approved?.status, 'approved');
    assert.equal(approved?.approver_id, 'usr-lead');

    // 4. Dev verifies and consumes approval with matching content
    const result = await approvalManager.verifyAndConsumeApproval({
      approvalId: approval.id,
      actorId: 'usr-dev',
      workspaceId: 'ws-default',
      action: 'change.apply',
      targetResource: 'src/billing.js',
      content: fileContent,
    });
    assert.equal(result.verified, true);
    assert.equal(result.approval.status, 'consumed');
    assert.ok(result.approval.consumed_at > 0);

    // 5. Replay rejection: consuming a second time MUST fail
    await assert.rejects(async () => {
      await approvalManager.verifyAndConsumeApproval({
        approvalId: approval.id,
        actorId: 'usr-dev',
        workspaceId: 'ws-default',
        action: 'change.apply',
        targetResource: 'src/billing.js',
        content: fileContent,
      });
    }, /Approval replay rejected: Approval has already been consumed/);
  } finally {
    await store.close();
  }
});

test('Task 1.8: Approval bindings reject content tampering, ID substitution, cross-workspace, and action mismatches', async () => {
  const { store, service, approvalManager } = await setupTestEnvironment();

  try {
    await service.login({ userId: 'usr-admin' });
    await service.addMember({
      actorId: 'usr-admin',
      workspaceId: 'ws-default',
      targetUserId: 'usr-dev',
      role: 'Developer',
    });

    const originalContent = 'console.log("safe operation");';
    const tamperedContent = 'console.log("safe operation"); evilPayload();';

    const approval = await approvalManager.requestApproval({
      workspaceId: 'ws-default',
      actorId: 'usr-dev',
      action: 'change.apply',
      targetResource: 'src/index.js',
      content: originalContent,
      ttlSeconds: 3600,
    });

    await approvalManager.decideApproval({
      approvalId: approval.id,
      approverId: 'usr-admin',
      decision: 'approved',
    });

    // 1. Content Tamper Rejection
    await assert.rejects(async () => {
      await approvalManager.verifyAndConsumeApproval({
        approvalId: approval.id,
        actorId: 'usr-dev',
        workspaceId: 'ws-default',
        action: 'change.apply',
        targetResource: 'src/index.js',
        content: tamperedContent, // Modified content
      });
    }, /Content digest mismatch: Bound to digest/);

    // 2. Actor Substitution Rejection (Attacker Bob tries to use Dev's approval)
    await assert.rejects(async () => {
      await approvalManager.verifyAndConsumeApproval({
        approvalId: approval.id,
        actorId: 'usr-bob-attacker',
        workspaceId: 'ws-default',
        action: 'change.apply',
        targetResource: 'src/index.js',
        content: originalContent,
      });
    }, /Actor substitution rejected: Bound to actor "usr-dev"/);

    // 3. Cross-Workspace Rejection (Tried in ws-other)
    await assert.rejects(async () => {
      await approvalManager.verifyAndConsumeApproval({
        approvalId: approval.id,
        actorId: 'usr-dev',
        workspaceId: 'ws-other',
        action: 'change.apply',
        targetResource: 'src/index.js',
        content: originalContent,
      });
    }, /Cross-workspace approval rejected: Bound to workspace "ws-default"/);

    // 4. Action Mismatch Rejection
    await assert.rejects(async () => {
      await approvalManager.verifyAndConsumeApproval({
        approvalId: approval.id,
        actorId: 'usr-dev',
        workspaceId: 'ws-default',
        action: 'command.execute', // Wrong action
        targetResource: 'src/index.js',
        content: originalContent,
      });
    }, /Action mismatch: Bound to action "change.apply"/);

    // 5. Target Resource Mismatch Rejection
    await assert.rejects(async () => {
      await approvalManager.verifyAndConsumeApproval({
        approvalId: approval.id,
        actorId: 'usr-dev',
        workspaceId: 'ws-default',
        action: 'change.apply',
        targetResource: 'src/config.secret.js', // Wrong target
        content: originalContent,
      });
    }, /Target resource mismatch/);
  } finally {
    await store.close();
  }
});

test('Task 1.8: Approval expiration rejects stale approvals and prevents decision/consumption', async () => {
  const { clock, store, service, approvalManager } = await setupTestEnvironment();

  try {
    await service.login({ userId: 'usr-admin' });
    await service.addMember({
      actorId: 'usr-admin',
      workspaceId: 'ws-default',
      targetUserId: 'usr-dev',
      role: 'Developer',
    });

    const approval = await approvalManager.requestApproval({
      workspaceId: 'ws-default',
      actorId: 'usr-dev',
      action: 'process.execute',
      targetResource: 'npm run deploy',
      content: 'npm run deploy --stage=staging',
      ttlSeconds: 60, // Short 60-second window
    });

    await approvalManager.decideApproval({
      approvalId: approval.id,
      approverId: 'usr-admin',
      decision: 'approved',
    });

    // Advance clock past expiration (61 seconds)
    clock.advance(61 * 1000);

    // Attempt to consume expired approval
    await assert.rejects(async () => {
      await approvalManager.verifyAndConsumeApproval({
        approvalId: approval.id,
        actorId: 'usr-dev',
        workspaceId: 'ws-default',
        action: 'process.execute',
        targetResource: 'npm run deploy',
        content: 'npm run deploy --stage=staging',
      });
    }, /Approval expired: Approval validity window has expired/);
  } finally {
    await store.close();
  }
});

test('Task 1.8: HTTP REST endpoints for approval creation, listing, decision, and verification', async (t) => {
  const { store, service, guard, approvalManager } = await setupTestEnvironment();
  const server = createApp({
    accessService: service,
    guard,
    approvalManager,
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

  // Add Developer Sam
  await fetch(`${origin}/api/v1/zetro2/workspaces/ws-default/members`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${adminToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ userId: 'usr-sam', role: 'Developer' }),
  });

  const samLoginRes = await fetch(`${origin}/api/v1/zetro2/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId: 'usr-sam', workspaceId: 'ws-default' }),
  });
  const samToken = (await samLoginRes.json()).token;

  // Add Viewer Eve
  await fetch(`${origin}/api/v1/zetro2/workspaces/ws-default/members`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${adminToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ userId: 'usr-eve', role: 'Viewer' }),
  });

  const eveLoginRes = await fetch(`${origin}/api/v1/zetro2/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId: 'usr-eve', workspaceId: 'ws-default' }),
  });
  const eveToken = (await eveLoginRes.json()).token;

  // 1. Sam requests approval via POST /api/v1/zetro2/workspaces/ws-default/approvals
  const requestRes = await fetch(`${origin}/api/v1/zetro2/workspaces/ws-default/approvals`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${samToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      action: 'computer.use',
      targetResource: 'display-0',
      content: 'screen-click-coords(120,450)',
      ttlSeconds: 300,
    }),
  });
  assert.equal(requestRes.status, 201);
  const { approval } = await requestRes.json();
  assert.equal(approval.action, 'computer.use');
  assert.equal(approval.status, 'pending');

  // 2. Viewer Eve attempts to decide approval -> 403 Forbidden (Viewer lacks change.approve)
  const eveApproveRes = await fetch(
    `${origin}/api/v1/zetro2/workspaces/ws-default/approvals/${approval.id}/decision`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${eveToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ decision: 'approved' }),
    }
  );
  assert.equal(eveApproveRes.status, 403);

  // 3. Admin approves request
  const adminDecisionRes = await fetch(
    `${origin}/api/v1/zetro2/workspaces/ws-default/approvals/${approval.id}/decision`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${adminToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ decision: 'approved' }),
    }
  );
  assert.equal(adminDecisionRes.status, 200);

  // 4. Sam verifies and consumes approval
  const verifyRes = await fetch(
    `${origin}/api/v1/zetro2/workspaces/ws-default/approvals/${approval.id}/verify`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${samToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: 'computer.use',
        targetResource: 'display-0',
        content: 'screen-click-coords(120,450)',
      }),
    }
  );
  assert.equal(verifyRes.status, 200);
  const verifyData = await verifyRes.json();
  assert.equal(verifyData.verified, true);
  assert.equal(verifyData.approval.status, 'consumed');
});
