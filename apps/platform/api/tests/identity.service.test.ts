import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import Fastify from 'fastify'
import cookie from '@fastify/cookie'
import { readEnvironment } from '../src/config.js'
import {
  IdentityAuthorizer,
  IdentityService,
  hashToken,
} from '../src/modules/identity/application/identity.service.js'
import {
  PlatformRequestContextStore,
  requirePlatformAuthorization,
} from '@codexsun/platform-core-api'
import { registerHttpLifecycle } from '../src/http.js'
import { PlatformIdentityClient, IdentityClientError } from '@codexsun/platform-identity-client'
import {
  IdentityAuthenticationError,
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
import { findRequestSession } from '../src/modules/identity/presentation/identity-request-session.js'
import { identityCookieName } from '../src/modules/identity/presentation/identity-request-session.js'
import { registerIdentityRoutes } from '../src/modules/identity/presentation/identity.routes.js'

class MemoryIdentityRepository implements IdentityRepository {
  readonly credentials = new Map<string, IdentityCredential>()
  readonly devices = new Map<string, StoredIdentityDevice>()
  readonly identifiers = new Map<string, string>()
  readonly securityEvents: IdentitySecurityEventRecord[] = []
  readonly roles = new Map<string, IdentityRoleRecord>()
  readonly sessions = new Map<string, IdentitySession>()
  readonly users = new Map<string, StoredIdentityUser>()

  async createDevice(device: StoredIdentityDevice, trustNewDevice = false) {
    const activate =
      trustNewDevice || ![...this.devices.values()].some((item) => item.userId === device.userId)
    const stored: StoredIdentityDevice = {
      ...device,
      status: activate ? 'active' : 'pending',
      activatedAt: activate ? device.firstSeenAt : null,
      activatedBy: activate ? device.userId : null,
    }
    this.devices.set(`${device.userId}:${device.deviceId}`, stored)
    return stored
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

  async createUser(
    user: StoredIdentityUser,
    credential: IdentityCredential,
    identifiers: readonly { type: IdentityIdentifierType; value: string }[] = [],
  ) {
    this.users.set(user.id, user)
    this.credentials.set(user.id, credential)
    this.identifiers.set(`email:${user.email}`, user.id)
    for (const identifier of identifiers)
      this.identifiers.set(`${identifier.type}:${identifier.value}`, user.id)
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

  async listPermissions(): Promise<readonly string[]> {
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
    if (user) {
      user.status = status
      user.authVersion = (user.authVersion ?? 0) + 1
    }
    if (status === 'disabled')
      for (const session of this.sessions.values()) {
        if (session.userId === userId) this.sessions.delete(session.tokenHash)
      }
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
  it('serves the public client with authoritative permission, portal, and revocation checks', async () => {
    const { repository, service } = createFixture()
    const user = await service.register({
      displayName: 'Public client',
      email: 'public@example.com',
      password: 'secret123',
    })
    const login = await service.login('regular', loginInput(user.email))
    const server = Fastify({ logger: false })
    await server.register(cookie)
    registerHttpLifecycle(server, new PlatformRequestContextStore())
    await registerIdentityRoutes(server, service, readEnvironment({ APP_ENV: 'test' }))
    const client = new PlatformIdentityClient({
      origin: 'https://identity.example.test',
      fetch: async (url, init) => {
        const response = await server.inject({
          method: 'POST',
          url: new URL(String(url)).pathname,
          payload: JSON.parse(String(init?.body)),
          headers: Object.fromEntries(new Headers(init?.headers).entries()),
        })
        assert.equal(response.headers['cache-control'], 'no-store')
        return new Response(response.body, {
          status: response.statusCode,
          headers: { 'content-type': 'application/json' },
        })
      },
    })
    const credential = { kind: 'bearer' as const, token: login.token }
    const requirement = { resource: 'test-product', action: 'read' }
    try {
      assert.deepEqual(await client.authorize('regular', requirement, credential), {
        allowed: false,
        userId: user.id,
        portal: 'regular',
      })
      repository.listPermissions = async () => ['test-product:read']
      assert.equal((await client.authorize('regular', requirement, credential)).allowed, true)
      await assert.rejects(
        () => client.authorize('super-admin', requirement, credential),
        IdentityClientError,
      )
      const invalid = await server.inject({
        method: 'POST',
        url: '/api/identity/authorize',
        headers: { authorization: `Bearer ${login.token}` },
        payload: { ...requirement, userId: 'caller-selected-user' },
      })
      assert.equal(invalid.statusCode, 400)
      repository.listPermissions = async () => {
        throw new Error('private policy database detail')
      }
      await assert.rejects(
        () => client.authorize('regular', requirement, credential),
        IdentityClientError,
      )
      await service.revoke('regular', login.token)
      await assert.rejects(
        () => client.authorize('regular', requirement, credential),
        (error: unknown) =>
          error instanceof IdentityClientError && error.code === 'UNAUTHENTICATED',
      )
    } finally {
      await server.close()
    }
  })

  it('enforces product permissions and fails closed for cookie and bearer clients', async () => {
    const { repository, service } = createFixture()
    const user = await service.register({
      displayName: 'Permission client',
      email: 'permissions@example.com',
      password: 'secret123',
    })
    const login = await service.login('regular', loginInput(user.email))
    const server = Fastify({ logger: false })
    await server.register(cookie)
    const context = new PlatformRequestContextStore()
    const authorizer = new IdentityAuthorizer(service)
    registerHttpLifecycle(server, context, async (request) => {
      const session = await findRequestSession(service, request)
      return session ? { kind: 'user', id: session.user.id } : { kind: 'anonymous' }
    })
    let executions = 0
    server.get('/permission-test', async () => {
      await requirePlatformAuthorization(authorizer, context.require().actor, {
        resource: 'test-product',
        action: 'read',
      })
      executions++
      return { allowed: true }
    })
    const clients = [
      { cookies: { [identityCookieName('regular')]: login.token } },
      { headers: { authorization: `Bearer ${login.token}` } },
    ]
    try {
      for (const client of clients) {
        for (const [permissions, expected] of [
          [[], 403],
          [['test-product:write'], 403],
          [['test-product:read'], 200],
          [['*'], 200],
        ] as const) {
          repository.listPermissions = async () => permissions
          const before = executions
          const response = await server.inject({ url: '/permission-test', ...client })
          assert.equal(response.statusCode, expected, response.body)
          assert.equal(executions, before + (expected === 200 ? 1 : 0))
          if (expected === 403) assert.equal(response.json().error.code, 'FORBIDDEN')
        }
        repository.listPermissions = async () => {
          throw new Error('private-permission-store-detail')
        }
        const before = executions
        const outage = await server.inject({ url: '/permission-test', ...client })
        assert.equal(outage.statusCode, 500)
        assert.equal(outage.json().error.code, 'INTERNAL_ERROR')
        assert.equal(outage.body.includes('private-permission-store-detail'), false)
        assert.equal(executions, before)
      }
      const findSession = repository.findSession.bind(repository)
      repository.findSession = async () => {
        throw new Error('private-session-store-detail')
      }
      for (const client of clients) {
        const before = executions
        const outage = await server.inject({ url: '/permission-test', ...client })
        assert.equal(outage.statusCode, 500)
        assert.equal(outage.body.includes('private-session-store-detail'), false)
        assert.equal(executions, before)
      }
      repository.findSession = findSession
      repository.listPermissions = async () => ['*']
      assert.equal((await server.inject({ url: '/permission-test' })).statusCode, 403)
      await service.revoke('regular', login.token)
      for (const client of clients)
        assert.equal((await server.inject({ url: '/permission-test', ...client })).statusCode, 403)
    } finally {
      await server.close()
    }
  })

  it('enforces all three portal sessions through actual HTTP routes', async () => {
    const { repository, service } = createFixture()
    const server = Fastify({ logger: false })
    await server.register(cookie)
    await registerIdentityRoutes(server, service, readEnvironment({ APP_ENV: 'test' }))
    const portals = [
      ['regular', '/api/identity'],
      ['administrator', '/api/identity/admin'],
      ['super-admin', '/api/identity/sa'],
    ] as const
    try {
      for (const [index, [portal, prefix]] of portals.entries()) {
        const id = `00000000-0000-4000-8000-${String(index + 800).padStart(12, '0')}`
        const email = `${portal}@example.com`
        await repository.createUser(
          { id, email, portal, displayName: portal, status: 'active' },
          { userId: id, passwordHash: 'hashed:secret123' },
        )
        const login = await server.inject({
          method: 'POST',
          url: `${prefix}/login`,
          payload: {
            ...loginInput(email),
            device: { ...loginInput(email).device, clientType: 'desktop' },
          },
        })
        assert.equal(login.statusCode, 200, login.body)
        const token: string = login.json().data.accessToken
        assert.ok(token)
        const headers = { authorization: `bearer ${token}` }
        const cookies = { [identityCookieName(portal)]: token }
        assert.equal((await findRequestSession(service, { cookies: {}, headers }))?.user.id, id)
        for (const [targetPortal, targetPrefix] of portals) {
          const expected = targetPortal === portal ? 200 : 401
          assert.equal(
            (await server.inject({ url: `${targetPrefix}/session`, headers })).statusCode,
            expected,
          )
          assert.equal(
            (await server.inject({ url: `${targetPrefix}/session`, cookies })).statusCode,
            expected,
          )
        }
        assert.equal(
          (
            await server.inject({
              url: `${prefix}/session`,
              cookies,
              headers: { authorization: 'Basic invalid' },
            })
          ).statusCode,
          401,
        )
        for (const client of [{ headers }, { cookies }]) {
          const audit = await server.inject({ url: '/api/identity/sa/security-events', ...client })
          assert.equal(audit.statusCode, portal === 'super-admin' ? 200 : 401)
          assert.equal(audit.body.includes('passwordHash'), false)
          assert.equal(audit.body.includes('tokenHash'), false)
        }
        repository.users.get(id)!.portal = portal === 'regular' ? 'administrator' : 'regular'
        assert.equal((await server.inject({ url: `${prefix}/session`, headers })).statusCode, 401)
        repository.users.get(id)!.portal = portal
        assert.equal(
          (await server.inject({ method: 'POST', url: `${prefix}/logout`, headers })).statusCode,
          200,
        )
        assert.equal((await server.inject({ url: `${prefix}/session`, headers })).statusCode, 401)
      }
    } finally {
      await server.close()
    }
  })

  it('uses the same session for cookie and bearer actors without credential fallback', async () => {
    const { service } = createFixture()
    const user = await service.register({
      displayName: 'Native client',
      email: 'native@example.com',
      password: 'secret123',
    })
    const login = await service.login('regular', loginInput(user.email))
    const cookies = { [identityCookieName('regular')]: login.token }
    const cookieSession = await findRequestSession(service, { cookies, headers: {} })
    const bearerSession = await findRequestSession(service, {
      cookies: {},
      headers: { authorization: `bearer ${login.token}` },
    })
    assert.equal(cookieSession?.user.id, user.id)
    assert.equal(bearerSession?.sessionId, cookieSession?.sessionId)
    for (const authorization of ['Bearer invalid', 'Basic invalid', 'Bearer ', '']) {
      assert.equal(
        await findRequestSession(service, { cookies, headers: { authorization } }),
        undefined,
      )
    }
    await service.revoke('regular', login.token)
    assert.equal(
      await findRequestSession(service, {
        cookies,
        headers: { authorization: `Bearer ${login.token}` },
      }),
      undefined,
    )
  })

  it('denies sessions after a portal change, user disable, or device revocation', async () => {
    const { repository, service } = createFixture()
    const user = await service.register({
      displayName: 'Session client',
      email: 'session@example.com',
      password: 'secret123',
    })
    const login = await service.login('regular', loginInput(user.email))
    const storedUser = repository.users.get(user.id)!
    storedUser.portal = 'administrator'
    assert.equal(await service.resolveSession('regular', login.token), undefined)
    storedUser.portal = 'regular'
    storedUser.status = 'disabled'
    assert.equal(await service.resolveSession('regular', login.token), undefined)
    storedUser.status = 'active'
    const device = await repository.findDevice(user.id, login.device.deviceId)
    device!.status = 'revoked'
    assert.equal(await service.resolveSession('regular', login.token), undefined)
  })

  it('registers regular users and rejects duplicate email addresses', async () => {
    const { service } = createFixture()
    const input = { displayName: 'Regular User', email: 'USER@example.com', password: 'secret123' }

    const user = await service.register(input)

    assert.equal(user.email, 'user@example.com')
    assert.equal(user.portal, 'regular')
    await assert.rejects(() => service.register(input), IdentityConflictError)
  })

  it('does not restore old cookie or bearer sessions after re-enabling a user', async () => {
    const { repository, service } = createFixture()
    const user = await service.register({
      displayName: 'Revocation',
      email: 'revoke@example.com',
      password: 'secret123',
    })
    const login = await service.login('regular', loginInput(user.email))
    await repository.updateUserStatus(user.id, 'disabled')
    await repository.updateUserStatus(user.id, 'active')
    for (const request of [
      { cookies: { [identityCookieName('regular')]: login.token }, headers: {} },
      { cookies: {}, headers: { authorization: `Bearer ${login.token}` } },
    ])
      assert.equal(await findRequestSession(service, request), undefined)
  })

  it('does not reveal the account portal before verifying the password', async () => {
    const { service } = createFixture()
    await service.register({
      displayName: 'Private portal',
      email: 'portal@example.com',
      password: 'secret123',
    })
    await assert.rejects(
      () => service.login('super-admin', loginInput('portal@example.com', 'wrong123')),
      IdentityAuthenticationError,
    )
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
    const { repository, service } = createFixture()
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
    assert.equal(repository.securityEvents.at(-1)?.outcome, 'denied')
    assert.equal(repository.securityEvents.at(-1)?.risk, 'medium')
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
