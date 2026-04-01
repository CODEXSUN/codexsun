import type {
  AuthUser,
  TaskGroupListResponse,
  TaskGroupResponse,
  TaskGroupStatus,
  TaskGroupType,
} from '@shared/index'
import {
  taskGroupListResponseSchema,
  taskGroupResponseSchema,
  taskGroupUpsertPayloadSchema,
} from '@shared/index'
import { ApplicationError } from '@framework-core/runtime/errors/application-error'
import type { TaskGroupRepository } from '../data/task-group-repository'

function assertBackofficeUser(user: AuthUser) {
  if (user.actorType !== 'admin' && user.actorType !== 'staff') {
    throw new ApplicationError('Only backoffice users can manage task groups.', { actorType: user.actorType }, 403)
  }
}

export class TaskGroupService {
  constructor(private readonly repository: TaskGroupRepository) {}

  async create(actor: AuthUser, payload: unknown) {
    assertBackofficeUser(actor)
    const parsedPayload = taskGroupUpsertPayloadSchema.parse(payload)
    const item = await this.repository.create(actor.id, parsedPayload)
    return taskGroupResponseSchema.parse({ item } satisfies TaskGroupResponse)
  }

  async list(actor: AuthUser, filters?: { status?: string | null; type?: string | null }) {
    assertBackofficeUser(actor)
    const items = await this.repository.list({
      status: (filters?.status ?? null) as TaskGroupStatus | null,
      type: (filters?.type ?? null) as TaskGroupType | null,
    })
    return taskGroupListResponseSchema.parse({ items } satisfies TaskGroupListResponse)
  }

  async getById(actor: AuthUser, id: string) {
    assertBackofficeUser(actor)
    const item = await this.repository.findById(id)
    if (!item) {
      throw new ApplicationError('Task group not found.', { id }, 404)
    }
    return taskGroupResponseSchema.parse({ item } satisfies TaskGroupResponse)
  }

  async update(actor: AuthUser, id: string, payload: unknown) {
    assertBackofficeUser(actor)
    const parsedPayload = taskGroupUpsertPayloadSchema.parse(payload)
    const item = await this.repository.update(id, parsedPayload)
    return taskGroupResponseSchema.parse({ item } satisfies TaskGroupResponse)
  }
}
