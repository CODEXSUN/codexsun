import type { IdentityRepository } from '../../domain/identity.ports.js'
import type {
  IdentityRequestEvidence,
  IdentitySecurityEventRecord,
} from '../domain/security.types.js'

export type SecurityEventInput = Omit<
  IdentitySecurityEventRecord,
  'createdAt' | 'id' | 'ipAddress' | 'path' | 'userAgent'
> & { evidence?: IdentityRequestEvidence }

export class IdentitySecurityService {
  constructor(
    private readonly repository: IdentityRepository,
    private readonly clock: () => Date,
    private readonly createId: () => string,
  ) {}

  async record(input: SecurityEventInput): Promise<void> {
    await this.repository.createSecurityEvent({
      ...input,
      createdAt: this.clock(),
      id: this.createId(),
      ipAddress: input.evidence?.ipAddress ?? null,
      path: input.evidence?.path ?? null,
      userAgent: input.evidence?.userAgent?.slice(0, 512) ?? null,
    })
  }

  list(limit = 100) {
    return this.repository.listSecurityEvents(Math.min(Math.max(limit, 1), 500))
  }
}
