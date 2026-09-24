import assert from 'node:assert/strict';
import test from 'node:test';
import { createTestClock } from './fixtures/clock.mjs';
import {
  createAccessModule,
  createSecretsProvider,
  createStorageProvider,
  createIdentityProvider,
  createSessionProvider,
  ROLE_PRESET_METADATA,
  WORKSPACE_ROLES,
  canAssignRole,
  canManageMembership,
  isValidRole,
  workspaceMembershipSchema,
  workspaceSchema,
  CAPABILITY_KEYS,
  evaluateGrant,
  scopedGrantSchema,
  ROLE_DEFAULT_GRANTS,
} from '../src/modules/workspace-access/index.mjs';

test('SecretsProvider resolves secrets securely and redacts sensitive keys', () => {
  const env = {
    ZETRO2_JWT_SECRET: 'test-secret-12345',
    CUSTOM_API_KEY: 'secret-key-999',
  };
  const provider = createSecretsProvider(env);

  assert.equal(provider.getJwtSecret(), 'test-secret-12345');
  assert.equal(provider.getSecret('CUSTOM_API_KEY'), 'secret-key-999');
  assert.equal(provider.getSecret('NON_EXISTENT', 'default'), 'default');

  const redacted = provider.redact('Error with secret: test-secret-12345 in call');
  assert.equal(redacted, 'Error with secret: [REDACTED] in call');
});

test('StorageProvider enforces paths strictly inside storage/apps/private/zetro2', () => {
  const storage = createStorageProvider(process.cwd());

  const dbPath = storage.getDatabasePath();
  assert.ok(dbPath.includes('storage'), 'Database path must be in storage/');
  assert.ok(dbPath.endsWith('database.sqlite'));

  // Test security invariant: escaping storage root must throw
  assert.throws(() => {
    storage.resolvePath('../../escape.txt');
  }, /Security Violation/);
});

test('IdentityProvider issues and verifies tokens with @codexsun/platform-core', () => {
  const secrets = createSecretsProvider({ ZETRO2_JWT_SECRET: 'super-secret-jwt-key' });
  const identity = createIdentityProvider(secrets);

  const token = identity.issueToken({
    subject: 'usr-dev-123',
    role: 'Developer',
    workspaceId: 'ws-main',
    expiresInSeconds: 3600,
  });
  assert.ok(typeof token === 'string');

  const claims = identity.verifyToken(token);
  assert.equal(claims.subject, 'usr-dev-123');
  assert.equal(claims.applicationId, 'zetro2');

  assert.equal(identity.hasCapability('Developer', 'agent.run'), true);
  assert.equal(identity.hasCapability('Developer', 'workspace.admin'), false);
  assert.equal(identity.hasCapability('Viewer', 'agent.run'), false);
  assert.equal(identity.hasCapability('Viewer', 'workspace.read'), true);
});

test('SessionProvider manages session lifecycle, TTL expiration, and revocation with clock', () => {
  const clock = createTestClock(new Date('2026-09-24T12:00:00Z'));
  const sessions = createSessionProvider({ clock });

  const session = sessions.createSession({
    actorId: 'usr-dev-001',
    workspaceId: 'ws-test',
    role: 'Developer',
    ttlSeconds: 300, // 5 minutes
  });

  assert.equal(session.status, 'active');
  assert.equal(sessions.isSessionActive(session.id), true);

  // Advance time past 5 minutes
  clock.advanceMinutes(6);
  assert.equal(sessions.isSessionActive(session.id), false);
  const expired = sessions.getSession(session.id);
  assert.equal(expired.status, 'expired');

  // Test revocation
  const session2 = sessions.createSession({
    actorId: 'usr-dev-002',
    workspaceId: 'ws-test',
    role: 'Developer',
  });
  assert.equal(sessions.isSessionActive(session2.id), true);
  sessions.revokeSession(session2.id, 'manual_logout');
  assert.equal(sessions.isSessionActive(session2.id), false);
});

test('AccessModule unifies identity, session, secrets, and storage providers', () => {
  const clock = createTestClock(new Date('2026-09-24T12:00:00Z'));
  const access = createAccessModule({
    env: { ZETRO2_JWT_SECRET: 'access-module-secret-jwt' },
    clock,
  });

  const { session, token } = access.createAuthenticatedSession({
    actorId: 'usr-dev-999',
    workspaceId: 'ws-zetro2-demo',
    role: 'Developer',
    ttlSeconds: 1800,
  });

  assert.ok(session.id);
  assert.ok(token);

  // Authenticate token
  const claims = access.authenticateToken(token);
  assert.equal(claims.subject, 'usr-dev-999');
  assert.equal(claims.sessionId, session.id);

  // Authorize capabilities
  assert.equal(access.authorizeCapability('Developer', 'agent.run'), true);
  assert.throws(() => {
    access.authorizeCapability('Viewer', 'agent.run');
  }, /Forbidden/);

  // Revoke session and verify authentication failure
  access.session.revokeSession(session.id, 'admin_revoke');
  assert.throws(() => {
    access.authenticateToken(token);
  }, /expired or was revoked/);
});

test('Membership contracts validate workspace presets, schema validation, and role assignment hierarchy', () => {
  assert.equal(WORKSPACE_ROLES.length, 5);
  assert.deepEqual(WORKSPACE_ROLES, ['Owner', 'Maintainer', 'Developer', 'Reviewer', 'Viewer']);

  // Verify rank ordering
  assert.ok(ROLE_PRESET_METADATA.Owner.rank > ROLE_PRESET_METADATA.Maintainer.rank);
  assert.ok(ROLE_PRESET_METADATA.Maintainer.rank > ROLE_PRESET_METADATA.Developer.rank);
  assert.ok(ROLE_PRESET_METADATA.Developer.rank > ROLE_PRESET_METADATA.Reviewer.rank);
  assert.ok(ROLE_PRESET_METADATA.Reviewer.rank > ROLE_PRESET_METADATA.Viewer.rank);

  // Verify hierarchy assignment rules
  assert.equal(canAssignRole('Owner', 'Maintainer'), true);
  assert.equal(canAssignRole('Developer', 'Maintainer'), false);
  assert.equal(canAssignRole('Developer', 'Developer'), false);
  assert.equal(canManageMembership('Owner'), true);
  assert.equal(canManageMembership('Maintainer'), false);

  // Validate workspace schema
  const validWorkspace = workspaceSchema.parse({
    id: 'ws-main-1',
    slug: 'zetro-core',
    name: 'Zetro Core Workspace',
    rootPath: 'storage/apps/private/zetro2/workspaces/ws-main-1',
    ownerUserId: 'usr-admin-1',
    createdAt: 1774350000,
    updatedAt: 1774350000,
  });
  assert.equal(validWorkspace.slug, 'zetro-core');

  // Validate membership schema
  const validMembership = workspaceMembershipSchema.parse({
    id: 'mem-1',
    workspaceId: 'ws-main-1',
    userId: 'usr-dev-1',
    role: 'Developer',
    joinedAt: 1774350100,
    grantedBy: 'usr-admin-1',
  });
  assert.equal(validMembership.role, 'Developer');

  // Rejection of invalid role
  assert.throws(() => {
    workspaceMembershipSchema.parse({
      id: 'mem-2',
      workspaceId: 'ws-main-1',
      userId: 'usr-dev-2',
      role: 'SuperAdmin', // Invalid
      joinedAt: 1774350100,
      grantedBy: 'usr-admin-1',
    });
  });
});

test('CapabilityEvaluator evaluates unscoped, path-scoped, tool-scoped, and expired grants', () => {
  assert.equal(CAPABILITY_KEYS.length, 13);
  assert.ok(CAPABILITY_KEYS.includes('computer.use'));

  // Default grants for Developer must NOT contain computer.use
  const devGrants = ROLE_DEFAULT_GRANTS.Developer;
  assert.equal(devGrants.some(g => g.capability === 'computer.use'), false);
  assert.equal(devGrants.some(g => g.capability === 'agent.run'), true);

  // Unscoped grant evaluation
  const unscopedEval = evaluateGrant({
    grants: devGrants,
    requiredCapability: 'agent.run',
  });
  assert.equal(unscopedEval.allowed, true);

  // Missing grant evaluation
  const missingEval = evaluateGrant({
    grants: devGrants,
    requiredCapability: 'workspace.admin',
  });
  assert.equal(missingEval.allowed, false);
  assert.ok(missingEval.reason.includes('Missing grant'));

  // Path-scoped grant evaluation
  const scopedGrants = [
    {
      capability: 'workspace.write',
      scope: {
        paths: ['src/**', 'tests/**'],
        forbiddenPaths: ['src/critical/**'],
      },
    },
    {
      capability: 'process.execute',
      scope: {
        commands: ['npm test', 'npm run build'],
      },
    },
    {
      capability: 'mcp.manage',
      scope: {
        tools: ['mcp:github/*', 'mcp:sqlite/*'],
      },
    },
    {
      capability: 'git.commit',
      expiresAt: 1774350000,
    },
  ];

  // Path allowed
  const pathAllowed = evaluateGrant({
    grants: scopedGrants,
    requiredCapability: 'workspace.write',
    context: { path: 'src/components/Button.tsx' },
  });
  assert.equal(pathAllowed.allowed, true);

  // Forbidden path rejected
  const pathForbidden = evaluateGrant({
    grants: scopedGrants,
    requiredCapability: 'workspace.write',
    context: { path: 'src/critical/secret.ts' },
  });
  assert.equal(pathForbidden.allowed, false);

  // Path outside allowed patterns rejected
  const pathOutside = evaluateGrant({
    grants: scopedGrants,
    requiredCapability: 'workspace.write',
    context: { path: 'docs/index.md' },
  });
  assert.equal(pathOutside.allowed, false);

  // Command prefix allowed
  const cmdAllowed = evaluateGrant({
    grants: scopedGrants,
    requiredCapability: 'process.execute',
    context: { command: 'npm test --workspace=@codexsun/zetro2-api' },
  });
  assert.equal(cmdAllowed.allowed, true);

  // Command disallowed
  const cmdDisallowed = evaluateGrant({
    grants: scopedGrants,
    requiredCapability: 'process.execute',
    context: { command: 'rm -rf /' },
  });
  assert.equal(cmdDisallowed.allowed, false);

  // Tool wildcard allowed
  const toolAllowed = evaluateGrant({
    grants: scopedGrants,
    requiredCapability: 'mcp.manage',
    context: { tool: 'mcp:github/create_issue' },
  });
  assert.equal(toolAllowed.allowed, true);

  // Tool disallowed
  const toolDisallowed = evaluateGrant({
    grants: scopedGrants,
    requiredCapability: 'mcp.manage',
    context: { tool: 'mcp:aws/deploy' },
  });
  assert.equal(toolDisallowed.allowed, false);

  // Expired grant rejected
  const expiredCheck = evaluateGrant({
    grants: scopedGrants,
    requiredCapability: 'git.commit',
    nowEpochSeconds: 1774360000, // past expiration
  });
  assert.equal(expiredCheck.allowed, false);
});


