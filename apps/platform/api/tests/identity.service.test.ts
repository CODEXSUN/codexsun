import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { IdentityService, hashToken } from '../src/modules/identity/application/identity.service.js'
import {
  IdentityConflictError,
  IdentityPortalError,
} from '../src/modules/identity/domain/identity.errors.js'
import type {
  IdentityPasswordHasher,
  IdentityRepository,
} from '../src/modules/identity/domain/identity.ports.js'
import type {
  IdentityCredential,
  IdentitySession,
  StoredIdentityUser,
} from '../src/modules/identity/domain/identity.types.js'
import type { IdentityPortal } from '@codexsun/platform-contracts'

class MemoryIdentityRepository implements IdentityRepository {
  readonly credentials = new Map<string, IdentityCredential>()
  readonly sessions = new Map<string, IdentitySession>()
  readonly users = new Map<string, StoredIdentityUser>()

  async createSession(session: IdentitySession) {
    this.sessions.set(session.tokenHash, session)
  }

  async createUser(user: StoredIdentityUser, credential: IdentityCredential) {
    this.users.set(user.id, user)
    this.credentials.set(user.id, credential)
  }

  async findCredential(userId: string) {
    return this.credentials.get(userId)
  }

  async findSession(tokenHash: string, portal: IdentityPortal) {
    const session = this.sessions.get(tokenHash)
    return session?.portal === portal ? session : undefined
  }

  async findUserByEmail(email: string) {
    return [...this.users.values()].find((user) => user.email === email)
  }

  async findUserById(id: string) {
    return this.users.get(id)
  }

  async listPermissions() {
    return []
  }

  async revokeSession(tokenHash: string, portal: IdentityPortal) {
    const session = this.sessions.get(tokenHash)
    if (session?.portal === portal) this.sessions.delete(tokenHash)
  }

  async updateSessionExpiry(id: string, expiresAt: Date) {
    const session = [...this.sessions.values()].find((candidate) => candidate.id === id)
    if (session) session.expiresAt = expiresAt
  }
}

const passwords: IdentityPasswordHasher = {
  async hash(password) {
    return `hashed:${password}`
  },
  async verify(passwordHash, password) {
    return passwordHash === `hashed:${password}`
  },
}

describe('IdentityService', () => {
  it('registers regular users and rejects duplicate email addresses', async () => {
    const { service } = createFixture()
    const input = { displayName: 'Regular User', email: 'USER@example.com', password: 'secret123' }

    const user = await service.register(input)

    assert.equal(user.email, 'user@example.com')
    assert.equal(user.portal, 'regular')
    await assert.rejects(() => service.register(input), IdentityConflictError)
  })

  it('keeps credentials and sessions isolated by portal', async () => {
    const { repository, service } = createFixture()
    await repository.createUser(
      {
        displayName: 'Super Administrator',
        email: 'super@example.com',
        id: '00000000-0000-4000-8000-000000000001',
        portal: 'super-admin',
        status: 'active',
      },
      { passwordHash: 'hashed:secret123', userId: '00000000-0000-4000-8000-000000000001' },
    )

    await assert.rejects(
      () => service.login('administrator', { email: 'super@example.com', password: 'secret123' }),
      IdentityPortalError,
    )
    const login = await service.login('super-admin', {
      email: 'super@example.com',
      password: 'secret123',
    })
    assert.equal((await service.resolveSession('super-admin', login.token))?.user.id, login.user.id)
    assert.equal(await service.resolveSession('regular', login.token), undefined)
    assert.ok(repository.sessions.has(hashToken(login.token)))
  })

  it('rejects an expired session', async () => {
    const fixture = createFixture()
    await fixture.repository.createUser(
      {
        displayName: 'Client',
        email: 'client@example.com',
        id: '00000000-0000-4000-8000-000000000002',
        portal: 'regular',
        status: 'active',
      },
      { passwordHash: 'hashed:secret123', userId: '00000000-0000-4000-8000-000000000002' },
    )
    const login = await fixture.service.login('regular', {
      email: 'client@example.com',
      password: 'secret123',
    })
    fixture.advanceClock(3_600_001)

    assert.equal(await fixture.service.resolveSession('regular', login.token), undefined)
  })
})

function createFixture() {
  const repository = new MemoryIdentityRepository()
  let now = new Date('2026-09-09T00:00:00.000Z')
  let sequence = 0
  const service = new IdentityService(repository, passwords, {
    clock: () => now,
    createId: () => `00000000-0000-4000-8000-${String(++sequence).padStart(12, '0')}`,
    sessionRenewalHours: 0.25,
    sessionTtlHours: 1,
  })
  return {
    advanceClock(milliseconds: number) {
      now = new Date(now.getTime() + milliseconds)
    },
    repository,
    service,
  }
}
