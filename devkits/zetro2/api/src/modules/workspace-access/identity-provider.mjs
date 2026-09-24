// Zetro2 Identity Provider
// Integrates @codexsun/platform-core identity schemas and JWT helpers for workspace access

import {
  authorize,
  createPlatformJwtToken,
  defaultPlatformJwtAudience,
  defaultPlatformJwtIssuer,
  readPlatformJwtClaims,
  verifyPlatformJwt,
} from '@codexsun/platform-core';

export const ROLE_CAPABILITIES = Object.freeze({
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

export class ZetroIdentityProvider {
  #secretsProvider;
  #issuer;
  #audience;

  constructor(secretsProvider, options = {}) {
    this.#secretsProvider = secretsProvider;
    this.#issuer = options.issuer || defaultPlatformJwtIssuer;
    this.#audience = options.audience || 'zetro2-api';
  }

  issueToken({ subject, role = 'Developer', workspaceId, sessionId, expiresInSeconds = 28800 }) {
    const secret = this.#secretsProvider.getJwtSecret();
    const token = createPlatformJwtToken(
      { secret, issuer: this.#issuer, audience: this.#audience },
      { subject, applicationId: 'zetro2', sessionId, expiresInSeconds }
    );
    return token;
  }

  verifyToken(token) {
    const secret = this.#secretsProvider.getJwtSecret();
    const config = {
      secret,
      issuer: this.#issuer,
      audience: this.#audience,
    };
    const claims = readPlatformJwtClaims(config, token);
    if (!claims) {
      throw new Error('Invalid or expired authentication token');
    }
    return claims;
  }

  hasCapability(role, capability) {
    const grants = ROLE_CAPABILITIES[role] || [];
    return grants.includes(capability);
  }

  checkAuthorization(actor, requiredCapabilities = []) {
    const actorRole = actor.role || 'Viewer';
    const missing = [];
    for (const cap of requiredCapabilities) {
      if (!this.hasCapability(actorRole, cap)) {
        missing.push(cap);
      }
    }
    return {
      allowed: missing.length === 0,
      missing,
      actor,
    };
  }

  buildActor({ id, email, name, role = 'Developer', workspaceId }) {
    return {
      id,
      email,
      name,
      role,
      workspaceId,
      capabilities: ROLE_CAPABILITIES[role] || [],
    };
  }
}

export function createIdentityProvider(secretsProvider, options = {}) {
  return new ZetroIdentityProvider(secretsProvider, options);
}
