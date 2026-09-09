export type PlatformActorKind = 'anonymous' | 'service' | 'user'

export interface PlatformActor {
  id?: string
  kind: PlatformActorKind
}

export interface PlatformAuthorizationRequirement {
  action: string
  resource: string
}

export interface PlatformAuthorizationDecision {
  allowed: boolean
  reason?: string
}

export interface PlatformAuthorizer {
  authorize(
    actor: PlatformActor,
    requirement: PlatformAuthorizationRequirement,
  ): Promise<PlatformAuthorizationDecision>
}

export const anonymousPlatformActor: PlatformActor = Object.freeze({ kind: 'anonymous' })

export class DenyByDefaultPlatformAuthorizer implements PlatformAuthorizer {
  async authorize(): Promise<PlatformAuthorizationDecision> {
    return { allowed: false, reason: 'No authorization policy is registered.' }
  }
}

export class PlatformAuthorizationError extends Error {
  readonly code = 'FORBIDDEN'

  constructor(readonly requirement: PlatformAuthorizationRequirement) {
    super(`The actor cannot perform "${requirement.action}" on "${requirement.resource}".`)
  }
}

export async function requirePlatformAuthorization(
  authorizer: PlatformAuthorizer,
  actor: PlatformActor,
  requirement: PlatformAuthorizationRequirement,
): Promise<void> {
  const decision = await authorizer.authorize(actor, requirement)
  if (!decision.allowed) throw new PlatformAuthorizationError(requirement)
}
