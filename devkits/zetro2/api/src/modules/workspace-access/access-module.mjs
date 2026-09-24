// Unified Workspace Access Module for Zetro2
// Composes Identity, Session, Secrets, and Storage providers without private cross-app imports

import { createIdentityProvider } from './identity-provider.mjs';
import { createSecretsProvider } from './secrets-provider.mjs';
import { createSessionProvider } from './session-provider.mjs';
import { createStorageProvider } from './storage-provider.mjs';

export class ZetroAccessModule {
  #secrets;
  #storage;
  #identity;
  #session;

  constructor({ secrets, storage, identity, session }) {
    this.#secrets = secrets;
    this.#storage = storage;
    this.#identity = identity;
    this.#session = session;
  }

  get secrets() {
    return this.#secrets;
  }

  get storage() {
    return this.#storage;
  }

  get identity() {
    return this.#identity;
  }

  get session() {
    return this.#session;
  }

  createAuthenticatedSession({ actorId, workspaceId, role = 'Developer', ttlSeconds = 28800 }) {
    const session = this.#session.createSession({ actorId, workspaceId, role, ttlSeconds });
    const token = this.#identity.issueToken({
      subject: actorId,
      role,
      workspaceId,
      sessionId: session.id,
      expiresInSeconds: ttlSeconds,
    });
    return { session, token };
  }

  authenticateToken(token) {
    const claims = this.#identity.verifyToken(token);
    if (claims.sessionId) {
      const active = this.#session.isSessionActive(claims.sessionId);
      if (!active) {
        throw new Error('Session has expired or was revoked');
      }
      this.#session.touchSession(claims.sessionId);
    }
    return claims;
  }

  authorizeCapability(role, capability) {
    const allowed = this.#identity.hasCapability(role, capability);
    if (!allowed) {
      throw new Error(`Forbidden: Role "${role}" lacks required capability "${capability}"`);
    }
    return true;
  }
}

export function createAccessModule(config = {}) {
  const secrets = config.secrets || createSecretsProvider(config.env, config.secretsOptions);
  const storage = config.storage || createStorageProvider(config.repoRoot, config.storageSubdir);
  const identity = config.identity || createIdentityProvider(secrets, config.identityOptions);
  const session = config.session || createSessionProvider({ clock: config.clock, ...config.sessionOptions });

  return new ZetroAccessModule({ secrets, storage, identity, session });
}
