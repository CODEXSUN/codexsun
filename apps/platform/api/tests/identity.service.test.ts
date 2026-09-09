import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { IdentityService, hashToken } from '../src/modules/identity/application/identity.service.js'
import {
  IdentityConflictError,
  IdentityDeviceActivationError,
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
import type { StoredIdentityDevice } from '../src/modules/identity/device/domain/device.types.js'
import type { IdentitySecurityEventRecord } from '../src/modules/identity/security/domain/security.types.js'
import type { IdentityIdentifierType } from '../src/modules/identity/user/domain/user-identifier.js'
import type { IdentityRoleRecord } from '../src/modules/identity/role/domain/role.types.js'

class MemoryIdentityRepository implements IdentityRepository {
  readonly credentials = new Map<string, IdentityCredential>()
  readonly devices = new Map<string, StoredIdentityDevice>()
  readonly identifiers = new Map<string, string>()
  readonly securityEvents: IdentitySecurityEventRecord[] = []
  readonly roles = new Map<string, IdentityRoleRecord>()
  readonly sessions = new Map<string, IdentitySession>()
  readonly users = new Map<string, StoredIdentityUser>()

  async createDevice(device: StoredIdentityDevice) {
    this.devices.set(`${device.userId}:${device.deviceId}`, device)
  }

  async createIdentifier(userId: string, type: IdentityIdentifierType, value: string) {
    this.identifiers.set(`${type}:${value}`, userId)
  }

  async createSecurityEvent(event: IdentitySecurityEventRecord) {
    this.securityEvents.push(event)
  }

  async createRole(role: IdentityRoleRecord) {
    this.roles.set(role.id, role)
  }

  async createSession(session: IdentitySession) {
    this.sessions.set(session.tokenHash, session)
  }

  async createUser(user: StoredIdentityUser, credential: IdentityCredential) {
    this.users.set(user.id, user)
    this.credentials.set(user.id, credential)
    this.identifiers.set(`email:${user.email}`, user.id)
  }

  async findCredential(userId: string) {
    return this.credentials.get(userId)
  }

  async findDevice(userId: string, deviceId: string) {
    return this.devices.get(`${userId}:${deviceId}`)
  }

  async findUserByIdentifier(type: IdentityIdentifierType, value: string) {
    const userId = this.identifiers.get(`${type}:${value}`)
    return userId ? this.users.get(userId) : undefined
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

  async listRoles(portal?: IdentityPortal) {
    return [...this.roles.values()].filter((role) => !portal || role.portal === portal)
  }

  async listDevices(userId: string) {
    return [...this.devices.values()].filter((device) => device.userId === userId)
  }

  async listSecurityEvents(limit: number) {
    return this.securityEvents.slice(0, limit)
  }

  async listUsers(portal?: IdentityPortal) {
    return [...this.users.values()].filter((user) => !portal || user.portal === portal)
  }

  async listUserRoleIds() {
    return []
  }

  async revokeSession(tokenHash: string, portal: IdentityPortal) {
    const session = this.sessions.get(tokenHash)
    if (session?.portal === portal) this.sessions.delete(tokenHash)
  }

  async replaceRolePermissions() {}
  async replaceUserRoles() {}

  async updateSessionExpiry(id: string, expiresAt: Date) {
    const session = [...this.sessions.values()].find((candidate) => candidate.id === id)
    if (session) session.expiresAt = expiresAt
  }

  async updateDeviceSeen(userId: string, deviceId: string, seenAt: Date) {
    const device = await this.findDevice(userId, deviceId)
    if (device) device.lastSeenAt = seenAt
  }

  async updateDeviceStatus(
    userId: string,
    deviceId: string,
    status: StoredIdentityDevice['status'],
    activatedBy: string,
    activatedAt: Date,
  ) {
    const device = await this.findDevice(userId, deviceId)
    if (device) Object.assign(device, { activatedAt, activatedBy, status })
  }

  async updateUserStatus(userId: string, status: StoredIdentityUser['status']) {
    const user = this.users.get(userId)
    if (user) user.status = status
  }
}

const passwords: IdentityPasswordHasher = {
  async hash(password) {
    return `hashed:${password}`
  },
  async verify(passwordHash, password) {
    return passwordHash === `hashed:${password}`
  },
  async verifyUnknown() {},
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
      () => service.login('administrator', loginInput('super@example.com')),
      IdentityPortalError,
    )
    const login = await service.login('super-admin', loginInput('super@example.com'))
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
    const login = await fixture.service.login('regular', loginInput('client@example.com'))
    fixture.advanceClock(3_600_001)

    assert.equal(await fixture.service.resolveSession('regular', login.token), undefined)
  })

  it('accepts username and mobile identifiers with an eight-character password', async () => {
    const { service } = createFixture()
    await service.register({
      displayName: 'Connected User',
      email: 'connected@example.com',
      mobile: '+91 98765 43210',
      password: 'eight888',
      username: 'connected',
    })

    const first = await service.login('regular', loginInput('connected', 'eight888'))
    const mobileLogin = loginInput('+91 98765 43210', 'eight888')
    mobileLogin.device.deviceToken = first.deviceToken
    assert.equal(first.user.email, 'connected@example.com')
    assert.equal((await service.login('regular', mobileLogin)).user.email, 'connected@example.com')
  })

  it('holds a later device until a trusted device activates it', async () => {
    const { service } = createFixture()
    const user = await service.register({
      displayName: 'Device User',
      email: 'device@example.com',
      password: 'secret123',
    })
    await service.login('regular', loginInput(user.email))
    const second = loginInput(user.email)
    second.device.deviceId = '00000000-0000-4000-8000-000000000200'
    let deviceToken: string | undefined
    try {
      await service.login('regular', second)
      assert.fail('The second device should require activation.')
    } catch (error) {
      assert.ok(error instanceof IdentityDeviceActivationError)
      deviceToken = error.deviceToken
    }
    await service.devices.activate(user.id, user.id, second.device.deviceId)
    const login = await service.login('regular', {
      ...second,
      device: { ...second.device, deviceToken },
    })
    assert.equal(login.device.status, 'active')
  })
})

function loginInput(identifier: string, password = 'secret123') {
  return {
    device: {
      clientType: 'web' as const,
      deviceId: '00000000-0000-4000-8000-000000000100',
      deviceName: 'Test browser',
    },
    identifier,
    password,
  }
}

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
