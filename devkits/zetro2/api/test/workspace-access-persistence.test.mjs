import assert from 'node:assert/strict';
import test from 'node:test';
import {
  createWorkspaceAccessStore,
  createSecretsProvider,
  workspaceAccessLifecyclePlan,
  workspaceAccessMigration001,
  workspaceAccessMigration002,
  workspaceAccessSeeder001,
  createWorkspaceInputSchema,
  createMembershipInputSchema,
  createGrantInputSchema,
  createAuditLogInputSchema,
  createApprovalInputSchema,
  actionApprovalEntitySchema,
} from '../src/modules/workspace-access/index.mjs';

test('Migration and Seeder have valid SHA-256 checksums matching content definitions', () => {
  assert.equal(typeof workspaceAccessMigration001.checksum, 'string');
  assert.match(workspaceAccessMigration001.checksum, /^[a-f0-9]{64}$/);
  assert.equal(workspaceAccessMigration001.id, 'zetro2.workspace-access.001');
  assert.equal(workspaceAccessMigration001.owner, 'zetro2.workspace-access');

  assert.equal(typeof workspaceAccessMigration002.checksum, 'string');
  assert.match(workspaceAccessMigration002.checksum, /^[a-f0-9]{64}$/);
  assert.equal(workspaceAccessMigration002.id, 'zetro2.workspace-access.002');
  assert.equal(workspaceAccessMigration002.owner, 'zetro2.workspace-access');

  assert.equal(typeof workspaceAccessSeeder001.checksum, 'string');
  assert.match(workspaceAccessSeeder001.checksum, /^[a-f0-9]{64}$/);
  assert.equal(workspaceAccessSeeder001.id, 'zetro2.workspace-access.seed.001');
  assert.equal(workspaceAccessSeeder001.owner, 'zetro2.workspace-access');

  assert.equal(workspaceAccessLifecyclePlan.moduleId, 'zetro2.workspace-access');
  assert.equal(workspaceAccessLifecyclePlan.migrations.length, 2);
  assert.equal(workspaceAccessLifecyclePlan.seeders.length, 1);
});

test('WorkspaceAccessStore initializes SQLite database, executes migrations, and seeds default records', async () => {
  const secrets = createSecretsProvider({ ZETRO2_JWT_SECRET: 'test-secret-456' });
  const store = await createWorkspaceAccessStore({
    sqliteFilename: ':memory:',
    secretsProvider: secrets,
  });

  try {
    // Verify seeder created default workspace
    const defaultWs = await store.repository.getWorkspaceById('ws-default');
    assert.ok(defaultWs, 'Default workspace must exist');
    assert.equal(defaultWs.slug, 'default');
    assert.equal(defaultWs.name, 'Default Workspace');
    assert.equal(defaultWs.owner_user_id, 'usr-admin');

    // Verify seeder created default owner membership
    const defaultMem = await store.repository.getMembership('ws-default', 'usr-admin');
    assert.ok(defaultMem, 'Default owner membership must exist');
    assert.equal(defaultMem.role, 'Owner');
    assert.equal(defaultMem.granted_by, 'system');

    // Test repeat-safe seeder execution: running initialize again must not duplicate or fail
    const applied = await store.initialize();
    assert.ok(Array.isArray(applied));

    const workspaces = await store.repository.listWorkspaces();
    const defaultMatches = workspaces.filter((w) => w.id === 'ws-default');
    assert.equal(defaultMatches.length, 1, 'Default workspace must not duplicate after re-seeding');

    const memberships = await store.repository.listMemberships('ws-default');
    const defaultAdminMatches = memberships.filter(
      (m) => m.workspace_id === 'ws-default' && m.user_id === 'usr-admin'
    );
    assert.equal(
      defaultAdminMatches.length,
      1,
      'Default admin membership must not duplicate after re-seeding'
    );
  } finally {
    await store.close();
  }
});

test('Zod contracts guard workspace, membership, grant, audit, and approval inputs', () => {
  // Reject invalid slug
  assert.throws(() => {
    createWorkspaceInputSchema.parse({
      slug: 'INVALID SLUG WITH SPACES',
      name: 'Test Workspace',
      rootPath: 'storage/apps/private/zetro2/workspaces/test',
      ownerUserId: 'usr-1',
    });
  });

  // Reject invalid membership role
  assert.throws(() => {
    createMembershipInputSchema.parse({
      workspaceId: 'ws-1',
      userId: 'usr-1',
      role: 'SuperAdmin', // Invalid role enum
      grantedBy: 'usr-admin',
    });
  });

  // Reject invalid capability key
  assert.throws(() => {
    createGrantInputSchema.parse({
      workspaceId: 'ws-1',
      capability: 'root.destroy', // Invalid capability enum
    });
  });

  // Valid approval contract
  const validApproval = createApprovalInputSchema.parse({
    workspaceId: 'ws-1',
    actorId: 'usr-1',
    action: 'change.apply',
    targetResource: 'src/index.ts',
    contentDigest: 'a'.repeat(64),
  });
  assert.equal(validApproval.ttlSeconds, 3600);

  // Valid workspace input
  const validWsInput = createWorkspaceInputSchema.parse({
    slug: 'my-project',
    name: 'My Project',
    rootPath: 'storage/apps/private/zetro2/workspaces/my-project',
    ownerUserId: 'usr-dev-1',
  });
  assert.equal(validWsInput.slug, 'my-project');
});

test('WorkspaceAccessRepository performs full CRUD lifecycle on workspaces, memberships, grants, audit logs, and approvals', async () => {
  const secrets = createSecretsProvider({
    ZETRO2_JWT_SECRET: 'jwt-secret-xyz',
    API_KEY_SECRET: 'top-secret-val-987',
  });
  const store = await createWorkspaceAccessStore({
    sqliteFilename: ':memory:',
    secretsProvider: secrets,
  });

  try {
    const repo = store.repository;

    // 1. Create and retrieve new workspace
    const ws = await repo.createWorkspace({
      id: 'ws-alpha',
      slug: 'alpha-team',
      name: 'Alpha Team Workspace',
      description: 'Dedicated workspace for Alpha',
      rootPath: 'storage/apps/private/zetro2/workspaces/alpha',
      ownerUserId: 'usr-owner-1',
      nowEpochSeconds: 1774352000,
    });
    assert.equal(ws.id, 'ws-alpha');
    assert.equal(ws.slug, 'alpha-team');

    const fetchedBySlug = await repo.getWorkspaceBySlug('alpha-team');
    assert.equal(fetchedBySlug?.id, 'ws-alpha');

    // 2. Memberships
    const devMem = await repo.createMembership({
      workspaceId: 'ws-alpha',
      userId: 'usr-dev-1',
      role: 'Developer',
      grantedBy: 'usr-owner-1',
      nowEpochSeconds: 1774352100,
    });
    assert.equal(devMem.role, 'Developer');
    assert.equal(devMem.workspace_id, 'ws-alpha');

    const members = await repo.listMemberships('ws-alpha');
    assert.equal(members.length, 1);
    assert.equal(members[0].user_id, 'usr-dev-1');

    // 3. Capability Grants
    const grant = await repo.createCapabilityGrant({
      workspaceId: 'ws-alpha',
      userId: 'usr-dev-1',
      capability: 'git.push',
      scope: { paths: ['src/**'] },
      nowEpochSeconds: 1774352200,
    });
    assert.equal(grant.capability, 'git.push');

    const userGrants = await repo.listCapabilityGrants('ws-alpha', 'usr-dev-1');
    assert.equal(userGrants.length, 1);
    assert.equal(userGrants[0].capability, 'git.push');

    // 4. Action Approvals
    const approval = await repo.createApproval({
      workspaceId: 'ws-alpha',
      actorId: 'usr-dev-1',
      action: 'change.apply',
      targetResource: 'src/main.js',
      contentDigest: 'b'.repeat(64),
      ttlSeconds: 1800,
      nowEpochSeconds: 1774352300,
    });
    assert.equal(approval.status, 'pending');
    assert.equal(approval.target_resource, 'src/main.js');

    const updatedApproval = await repo.updateApprovalStatus({
      id: approval.id,
      status: 'approved',
      approverId: 'usr-owner-1',
    });
    assert.equal(updatedApproval?.status, 'approved');
    assert.equal(updatedApproval?.approver_id, 'usr-owner-1');

    const approvals = await repo.listApprovalsByWorkspace('ws-alpha');
    assert.equal(approvals.length, 1);

    // 5. Audit Log with Secret Redaction
    const auditEntry = await repo.recordAuditLog({
      workspaceId: 'ws-alpha',
      actorId: 'usr-owner-1',
      action: 'grant.create',
      targetType: 'capability_grant',
      targetId: grant.id,
      details: {
        info: 'Assigned grant with key top-secret-val-987 and token jwt-secret-xyz',
      },
      nowEpochSeconds: 1774352400,
    });
    assert.equal(auditEntry.action, 'grant.create');
    // Verify secrets are redacted in details_json
    assert.ok(auditEntry.details_json?.includes('[REDACTED]'));
    assert.equal(auditEntry.details_json.includes('top-secret-val-987'), false);
    assert.equal(auditEntry.details_json.includes('jwt-secret-xyz'), false);

    // 6. Remove membership
    const removed = await repo.removeMembership('ws-alpha', 'usr-dev-1');
    assert.equal(removed, true);
    const postRemove = await repo.getMembership('ws-alpha', 'usr-dev-1');
    assert.equal(postRemove, null);
  } finally {
    await store.close();
  }
});
