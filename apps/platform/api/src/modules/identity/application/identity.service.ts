import type {
  IdentityLoginInput,
  IdentityManagedUser,
  IdentityPortal,
  IdentityRegisterInput,
  IdentitySecurityEvent,
  IdentityUser,
} from '@codexsun/platform-contracts'
import type {
  PlatformActor,
  PlatformAuthorizationDecision,
  PlatformAuthorizationRequirement,
  PlatformAuthorizer,
} from '@codexsun/platform-core-api'
import { randomBytes } from 'node:crypto'
import { IdentityDeviceService, publicDevice } from '../device/application/device.service.js'
import {
  IdentityAuthenticationError,
  IdentityConflictError,
  IdentityPortalError,
} from '../domain/identity.errors.js'
import type { IdentityPasswordHasher, IdentityRepository } from '../domain/identity.ports.js'
import type { IdentityLoginResult, IdentitySessionResult } from '../domain/identity.types.js'
import { IdentitySecurityService } from '../security/application/security.service.js'
import { IdentityRoleService } from '../role/application/role.service.js'
import type { IdentityRequestEvidence } from '../security/domain/security.types.js'
import { hashIdentityToken } from '../session/domain/session-token.js'
import { normalizeIdentityIdentifier } from '../user/domain/user-identifier.js'

export interface IdentityServiceOptions {
  clock: () => Date
  createId: () => string
  sessionRenewalHours: number
  sessionTtlHours: number
}

export class IdentityService {
  readonly devices: IdentityDeviceService
  readonly roles: IdentityRoleService
  readonly security: IdentitySecurityService

  constructor(
    private readonly repository: IdentityRepository,
    private readonly passwords: IdentityPasswordHasher,
    private readonly options: IdentityServiceOptions,
  ) {
    this.devices = new IdentityDeviceService(repository, options.clock)
    this.roles = new IdentityRoleService(repository, options.createId)
    this.security = new IdentitySecurityService(repository, options.clock, options.createId)
  }

  async login(
    portal: IdentityPortal,
    input: IdentityLoginInput,
    evidence: IdentityRequestEvidence = {},
    trustNewDevice = false,
  ): Promise<IdentityLoginResult> {
    const identifier = normalizeIdentityIdentifier(input.identifier)
    const user = await this.repository.findUserByIdentifier(identifier.type, identifier.value)
    if (!user || user.status !== 'active') {
      await this.passwords.verifyUnknown(input.password)
      await this.recordLogin(null, input, evidence, 'failed', 'high')
      throw invalidCredentials()
    }
    if (user.portal !== portal) {
      await this.recordLogin(user.id, input, evidence, 'denied', 'high')
      throw new IdentityPortalError('This account belongs to another portal.')
    }

    const credential = await this.repository.findCredential(user.id)
    if (!credential || !(await this.passwords.verify(credential.passwordHash, input.password))) {
      await this.recordLogin(user.id, input, evidence, 'failed', 'high')
      throw invalidCredentials()
    }

    const device = await this.devices.verifyOrRegister(user.id, input.device, trustNewDevice)
    const token = randomBytes(32).toString('base64url')
    const createdAt = this.options.clock()
    const expiresAt = new Date(createdAt.getTime() + this.options.sessionTtlHours * 3_600_000)
    await this.repository.createSession({
      createdAt,
      deviceId: device.device.deviceId,
      expiresAt,
      id: this.options.createId(),
      portal,
      tokenHash: hashIdentityToken(token),
      userId: user.id,
    })
    await this.recordLogin(user.id, input, evidence, 'allowed', 'low')
    return {
      accessToken: input.device.clientType === 'web' ? undefined : token,
      device: publicDevice(device.device),
      deviceToken: device.deviceToken,
      expiresAt,
      token,
      user: publicUser(user),
    }
  }

  async register(input: IdentityRegisterInput): Promise<IdentityUser> {
    const email = normalizeIdentityIdentifier(input.email)
    const identifiers = [
      email,
      ...(input.username ? [normalizeIdentityIdentifier(input.username)] : []),
      ...(input.mobile ? [normalizeIdentityIdentifier(input.mobile)] : []),
    ]
    for (const identifier of identifiers) {
      if (await this.repository.findUserByIdentifier(identifier.type, identifier.value)) {
        throw new IdentityConflictError('An account already uses this sign-in identifier.')
      }
    }
    const user = {
      displayName: input.displayName.trim(),
      email: email.value,
      id: this.options.createId(),
      portal: 'regular' as const,
      status: 'active' as const,
    }
    await this.repository.createUser(user, {
      passwordHash: await this.passwords.hash(input.password),
      userId: user.id,
    })
    for (const identifier of identifiers.filter(({ type }) => type !== 'email')) {
      await this.repository.createIdentifier(user.id, identifier.type, identifier.value)
    }
    return publicUser(user)
  }

  async resolveSession(
    portal: IdentityPortal,
    token: string | undefined,
  ): Promise<IdentitySessionResult | undefined> {
    if (!token) return undefined
    const session = await this.repository.findSession(hashIdentityToken(token), portal)
    if (!session || session.expiresAt <= this.options.clock()) return undefined
    const [user, device] = await Promise.all([
      this.repository.findUserById(session.userId),
      this.repository.findDevice(session.userId, session.deviceId),
    ])
    if (
      !user ||
      user.status !== 'active' ||
      user.portal !== portal ||
      !device ||
      device.status !== 'active'
    )
      return undefined

    const renewalBoundary = new Date(
      this.options.clock().getTime() + this.options.sessionRenewalHours * 3_600_000,
    )
    if (session.expiresAt <= renewalBoundary) {
      session.expiresAt = new Date(
        this.options.clock().getTime() + this.options.sessionTtlHours * 3_600_000,
      )
      await this.repository.updateSessionExpiry(session.id, session.expiresAt)
    }
    return {
      device: publicDevice(device),
      expiresAt: session.expiresAt,
      sessionId: session.id,
      user: publicUser(user),
    }
  }

  async revoke(portal: IdentityPortal, token: string | undefined): Promise<void> {
    if (token) await this.repository.revokeSession(hashIdentityToken(token), portal)
  }

  async permissions(userId: string): Promise<readonly string[]> {
    return this.repository.listPermissions(userId)
  }

  async listUsers(portal?: IdentityPortal): Promise<readonly IdentityManagedUser[]> {
    const users = await this.repository.listUsers(portal)
    return Promise.all(
      users.map(async (user) => ({
        ...publicUser(user),
        roleIds: [...(await this.repository.listUserRoleIds(user.id))],
        status: user.status,
      })),
    )
  }

  async listSecurityEvents(limit?: number): Promise<readonly IdentitySecurityEvent[]> {
    return (await this.security.list(limit)).map((event) => ({
      actorUserId: event.actorUserId,
      clientType: event.clientType,
      createdAt: event.createdAt.toISOString(),
      deviceId: event.deviceId,
      eventType: event.eventType,
      id: event.id,
      ipAddress: event.ipAddress,
      outcome: event.outcome,
      path: event.path,
      risk: event.risk,
      subjectUserId: event.subjectUserId,
    }))
  }

  async updateUserStatus(
    actorUserId: string,
    userId: string,
    status: 'active' | 'disabled',
    evidence: IdentityRequestEvidence,
  ): Promise<void> {
    await this.requireRegularUser(userId)
    await this.repository.updateUserStatus(userId, status)
    await this.security.record({
      actorUserId,
      clientType: null,
      deviceId: null,
      eventType: 'identity.user.status-changed',
      evidence,
      outcome: 'allowed',
      risk: 'medium',
      subjectUserId: userId,
    })
  }

  async recordResetRequest(
    actorUserId: string,
    userId: string,
    evidence: IdentityRequestEvidence,
  ): Promise<void> {
    await this.requireRegularUser(userId)
    await this.security.record({
      actorUserId,
      clientType: null,
      deviceId: null,
      eventType: 'identity.password.reset-requested',
      evidence,
      outcome: 'allowed',
      risk: 'medium',
      subjectUserId: userId,
    })
  }

  async assignRegularUserRoles(userId: string, roleIds: readonly string[]): Promise<void> {
    await this.requireRegularUser(userId)
    const allowed = new Set((await this.roles.list('regular')).map(({ id }) => id))
    if (roleIds.some((roleId) => !allowed.has(roleId))) {
      throw new IdentityPortalError('A role belongs to another portal.')
    }
    await this.roles.assignUserRoles(userId, roleIds)
  }

  private async requireRegularUser(userId: string): Promise<void> {
    const user = await this.repository.findUserById(userId)
    if (!user || user.portal !== 'regular') {
      throw new IdentityPortalError('Administrators can manage regular users only.')
    }
  }

  private recordLogin(
    userId: string | null,
    input: IdentityLoginInput,
    evidence: IdentityRequestEvidence,
    outcome: 'allowed' | 'denied' | 'failed',
    risk: 'low' | 'high',
  ) {
    return this.security.record({
      actorUserId: userId,
      clientType: input.device.clientType,
      deviceId: input.device.deviceId,
      eventType: 'identity.login',
      evidence,
      outcome,
      risk,
      subjectUserId: userId,
    })
  }
}

export class IdentityAuthorizer implements PlatformAuthorizer {
  constructor(private readonly service: IdentityService) {}

  async authorize(
    actor: PlatformActor,
    requirement: PlatformAuthorizationRequirement,
  ): Promise<PlatformAuthorizationDecision> {
    if (actor.kind !== 'user' || !actor.id)
      return { allowed: false, reason: 'Sign in is required.' }
    const permissions = await this.service.permissions(actor.id)
    const required = `${requirement.resource}:${requirement.action}`
    return permissions.includes('*') || permissions.includes(required)
      ? { allowed: true }
      : { allowed: false, reason: 'The account lacks the required permission.' }
  }
}

export const hashToken = hashIdentityToken

function publicUser(user: IdentityUser): IdentityUser {
  return {
    displayName: user.displayName,
    email: user.email,
    id: user.id,
    portal: user.portal,
  }
}

function invalidCredentials(): IdentityAuthenticationError {
  return new IdentityAuthenticationError('The identifier or password is incorrect.')
}
