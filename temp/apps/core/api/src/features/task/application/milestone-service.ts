import type {
  AuthUser,
  MilestoneListResponse,
  MilestoneResponse,
  MilestoneStatus,
  TaskScopeType,
} from '@shared/index'
import {
  milestoneListResponseSchema,
  milestoneResponseSchema,
  milestoneUpsertPayloadSchema,
} from '@shared/index'
import { ApplicationError } from '@framework-core/runtime/errors/application-error'
import type { MilestoneRepository } from '../data/milestone-repository'

function assertBackofficeUser(user: AuthUser) {
  if (user.actorType !== 'admin' && user.actorType !== 'staff') {
    throw new ApplicationError('Only backoffice users can manage milestones.', { actorType: user.actorType }, 403)
  }
}

export class MilestoneService {
  constructor(private readonly repository: MilestoneRepository) {}

  async create(actor: AuthUser, payload: unknown) {
    assertBackofficeUser(actor)
    const parsedPayload = milestoneUpsertPayloadSchema.parse(payload)
    const item = await this.repository.create(actor.id, parsedPayload)
    return milestoneResponseSchema.parse({ item } satisfies MilestoneResponse)
  }

  async list(actor: AuthUser, filters?: {
    status?: string | null
    entityType?: string | null
    entityId?: string | null
  }) {
    assertBackofficeUser(actor)
    const items = await this.repository.list({
      status: (filters?.status ?? null) as MilestoneStatus | null,
      entityType: (filters?.entityType ?? null) as TaskScopeType | null,
      entityId: filters?.entityId ?? null,
    })
    return milestoneListResponseSchema.parse({ items } satisfies MilestoneListResponse)
  }

  async getById(actor: AuthUser, id: string) {
    assertBackofficeUser(actor)
    const item = await this.repository.findById(id)
    if (!item) {
      throw new ApplicationError('Milestone not found.', { id }, 404)
    }
    return milestoneResponseSchema.parse({ item } satisfies MilestoneResponse)
  }

  async update(actor: AuthUser, id: string, payload: unknown) {
    assertBackofficeUser(actor)
    const parsedPayload = milestoneUpsertPayloadSchema.parse(payload)
    const item = await this.repository.update(id, parsedPayload)
    return milestoneResponseSchema.parse({ item } satisfies MilestoneResponse)
  }
}
