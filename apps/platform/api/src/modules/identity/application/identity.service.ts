import type {
  IdentityLoginInput,
  IdentityPortal,
  IdentityRegisterInput,
  IdentityUser,
} from '@codexsun/platform-contracts'
import type {
  PlatformActor,
  PlatformAuthorizationDecision,
  PlatformAuthorizationRequirement,
  PlatformAuthorizer,
} from '@codexsun/platform-core-api'
import { createHash, randomBytes } from 'node:crypto'
import {
  IdentityAuthenticationError,
  IdentityConflictError,
  IdentityPortalError,
} from '../domain/identity.errors.js'
import type { IdentityPasswordHasher, IdentityRepository } from '../domain/identity.ports.js'
import type { IdentityLoginResult, IdentitySessionResult } from '../domain/identity.types.js'

export interface IdentityServiceOptions {
  clock: () => Date
  createId: () => string
  sessionRenewalHours: number
  sessionTtlHours: number
}

export class IdentityService {
  constructor(
    private readonly repository: IdentityRepository,
    private readonly passwords: IdentityPasswordHasher,
    private readonly options: IdentityServiceOptions,
  ) {}

  async login(portal: IdentityPortal, input: IdentityLoginInput): Promise<IdentityLoginResult> {
    const user = await this.repository.findUserByEmail(normalizeEmail(input.email))
    if (!user || user.status !== 'active') throw invalidCredentials()
    if (user.portal !== portal)
      throw new IdentityPortalError('This account belongs to another portal.')

    const credential = await this.repository.findCredential(user.id)
    if (!credential || !(await this.passwords.verify(credential.passwordHash, input.password))) {
      throw invalidCredentials()
    }

    const token = randomBytes(32).toString('base64url')
    const createdAt = this.options.clock()
    const expiresAt = new Date(createdAt.getTime() + this.options.sessionTtlHours * 3_600_000)
    await this.repository.createSession({
      createdAt,
      expiresAt,
      id: this.options.createId(),
      portal,
      tokenHash: hashToken(token),
      userId: user.id,
    })
    return { expiresAt, token, user: publicUser(user) }
  }

  async register(input: IdentityRegisterInput): Promise<IdentityUser> {
    const email = normalizeEmail(input.email)
    if (await this.repository.findUserByEmail(email)) {
      throw new IdentityConflictError('An account already uses this email address.')
    }
    const user = {
      displayName: input.displayName.trim(),
      email,
      id: this.options.createId(),
      portal: 'regular' as const,
      status: 'active' as const,
    }
    await this.repository.createUser(user, {
      passwordHash: await this.passwords.hash(input.password),
      userId: user.id,
    })
    return publicUser(user)
  }

  async resolveSession(
    portal: IdentityPortal,
    token: string | undefined,
  ): Promise<IdentitySessionResult | undefined> {
    if (!token) return undefined
    const session = await this.repository.findSession(hashToken(token), portal)
    if (!session || session.expiresAt <= this.options.clock()) return undefined
    const renewalBoundary = new Date(
      this.options.clock().getTime() + this.options.sessionRenewalHours * 3_600_000,
    )
    if (session.expiresAt <= renewalBoundary) {
      session.expiresAt = new Date(
        this.options.clock().getTime() + this.options.sessionTtlHours * 3_600_000,
      )
      await this.repository.updateSessionExpiry(session.id, session.expiresAt)
    }
    const user = await this.repository.findUserById(session.userId)
    return user?.status === 'active'
      ? { expiresAt: session.expiresAt, user: publicUser(user) }
      : undefined
  }

  async revoke(portal: IdentityPortal, token: string | undefined): Promise<void> {
    if (token) await this.repository.revokeSession(hashToken(token), portal)
  }

  async permissions(userId: string): Promise<readonly string[]> {
    return this.repository.listPermissions(userId)
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

export function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex')
}

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase()
}

function publicUser(user: IdentityUser): IdentityUser {
  return {
    displayName: user.displayName,
    email: user.email,
    id: user.id,
    portal: user.portal,
  }
}

function invalidCredentials(): IdentityAuthenticationError {
  return new IdentityAuthenticationError('The email or password is incorrect.')
}
