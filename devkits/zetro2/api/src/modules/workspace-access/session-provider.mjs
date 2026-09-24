// Zetro2 Session Provider
// Manages workspace sessions, token state, expiration, and revocation

import { randomUUID } from 'node:crypto';

export class ZetroSessionProvider {
  #sessions = new Map();
  #clock;

  constructor(options = {}) {
    this.#clock = options.clock || {
      now: () => new Date(),
      epochSeconds: () => Math.floor(Date.now() / 1000),
    };
  }

  createSession({ actorId, workspaceId, role = 'Developer', ttlSeconds = 28800 }) {
    const sessionId = `ses_${randomUUID().replace(/-/g, '')}`;
    const now = this.#clock.epochSeconds();
    const session = {
      id: sessionId,
      actorId,
      workspaceId,
      role,
      status: 'active',
      createdAt: now,
      expiresAt: now + ttlSeconds,
      lastActiveAt: now,
      revokedAt: null,
      revokeReason: null,
    };
    this.#sessions.set(sessionId, session);
    return session;
  }

  getSession(sessionId) {
    const session = this.#sessions.get(sessionId);
    if (!session) return null;
    const now = this.#clock.epochSeconds();
    if (session.status === 'active' && session.expiresAt <= now) {
      session.status = 'expired';
    }
    return session;
  }

  isSessionActive(sessionId) {
    const session = this.getSession(sessionId);
    return session !== null && session.status === 'active';
  }

  touchSession(sessionId) {
    const session = this.getSession(sessionId);
    if (!session || session.status !== 'active') return null;
    session.lastActiveAt = this.#clock.epochSeconds();
    return session;
  }

  revokeSession(sessionId, reason = 'user_revoked') {
    const session = this.#sessions.get(sessionId);
    if (!session) return false;
    session.status = 'revoked';
    session.revokedAt = this.#clock.epochSeconds();
    session.revokeReason = reason;
    return true;
  }

  revokeAllActorSessions(actorId, reason = 'bulk_revocation') {
    let count = 0;
    for (const session of this.#sessions.values()) {
      if (session.actorId === actorId && session.status === 'active') {
        session.status = 'revoked';
        session.revokedAt = this.#clock.epochSeconds();
        session.revokeReason = reason;
        count++;
      }
    }
    return count;
  }

  listWorkspaceSessions(workspaceId) {
    const results = [];
    const now = this.#clock.epochSeconds();
    for (const session of this.#sessions.values()) {
      if (session.workspaceId === workspaceId) {
        if (session.status === 'active' && session.expiresAt <= now) {
          session.status = 'expired';
        }
        results.push(session);
      }
    }
    return results;
  }
}

export function createSessionProvider(options = {}) {
  return new ZetroSessionProvider(options);
}
