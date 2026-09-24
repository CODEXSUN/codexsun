// Identity and authorization fixtures for Zetro2 test suites
import { createHmac } from 'node:crypto';

export const ROLE_PRESETS = Object.freeze({
  Owner: [
    'workspace.read',
    'workspace.write',
    'process.execute',
    'agent.run',
    'change.approve',
    'git.commit',
    'git.push',
    'provider.manage',
    'mcp.manage',
    'browser.use',
    'membership.manage',
    'workspace.admin',
  ],
  Maintainer: [
    'workspace.read',
    'workspace.write',
    'process.execute',
    'agent.run',
    'change.approve',
    'git.commit',
    'git.push',
    'provider.manage',
    'mcp.manage',
    'browser.use',
  ],
  Developer: [
    'workspace.read',
    'workspace.write',
    'process.execute',
    'agent.run',
    'change.approve',
    'git.commit',
    'browser.use',
  ],
  Reviewer: [
    'workspace.read',
    'change.approve',
  ],
  Viewer: [
    'workspace.read',
  ],
});

export const TEST_USERS = Object.freeze({
  owner: {
    id: 'usr-owner-001',
    email: 'owner@zetro.local',
    name: 'Workspace Owner',
    role: 'Owner',
    workspaceId: 'ws-fixture-main',
  },
  maintainer: {
    id: 'usr-maintainer-001',
    email: 'maintainer@zetro.local',
    name: 'Workspace Maintainer',
    role: 'Maintainer',
    workspaceId: 'ws-fixture-main',
  },
  developer: {
    id: 'usr-developer-001',
    email: 'developer@zetro.local',
    name: 'Workspace Developer',
    role: 'Developer',
    workspaceId: 'ws-fixture-main',
  },
  reviewer: {
    id: 'usr-reviewer-001',
    email: 'reviewer@zetro.local',
    name: 'Workspace Reviewer',
    role: 'Reviewer',
    workspaceId: 'ws-fixture-main',
  },
  viewer: {
    id: 'usr-viewer-001',
    email: 'viewer@zetro.local',
    name: 'Workspace Viewer',
    role: 'Viewer',
    workspaceId: 'ws-fixture-main',
  },
});

export const TEST_WORKSPACE = Object.freeze({
  id: 'ws-fixture-main',
  name: 'Zetro2 Fixture Workspace',
  defaultBranch: 'main',
  rootDirectory: '/workspace/zetro2-fixture',
});

function base64Url(obj) {
  return Buffer.from(JSON.stringify(obj)).toString('base64url');
}

export function createTestJwt(userKey = 'developer', options = {}) {
  const user = TEST_USERS[userKey] || userKey;
  const secret = options.secret || 'zetro2-test-jwt-secret-do-not-use-in-production';
  const now = options.nowSeconds || Math.floor(Date.now() / 1000);
  const expiresIn = options.expiresInSeconds ?? 3600;

  const payload = {
    sub: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    workspaceId: user.workspaceId,
    capabilities: ROLE_PRESETS[user.role] || [],
    iss: options.issuer || 'codexsun-platform',
    aud: options.audience || 'zetro2-api',
    iat: now,
    exp: now + expiresIn,
    ...(options.sessionId ? { sid: options.sessionId } : {}),
  };

  const unsigned = `${base64Url({ alg: 'HS256', typ: 'JWT' })}.${base64Url(payload)}`;
  const signature = createHmac('sha256', secret).update(unsigned).digest('base64url');
  return `${unsigned}.${signature}`;
}

export function createTestIdentityFixture(options = {}) {
  return {
    users: TEST_USERS,
    workspace: TEST_WORKSPACE,
    roles: ROLE_PRESETS,
    generateToken(userKey, tokenOptions) {
      return createTestJwt(userKey, { ...options, ...tokenOptions });
    },
    hasCapability(userKey, capability) {
      const user = TEST_USERS[userKey];
      if (!user) return false;
      const grants = ROLE_PRESETS[user.role] || [];
      return grants.includes(capability);
    },
  };
}
