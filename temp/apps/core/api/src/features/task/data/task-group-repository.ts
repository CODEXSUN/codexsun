import type {
  TaskGroup,
  TaskGroupStatus,
  TaskGroupSummary,
  TaskGroupType,
  TaskGroupUpsertPayload,
} from '@shared/index'
import type { RowDataPacket } from 'mysql2'
import { randomUUID } from 'node:crypto'
import { ensureDatabaseSchema } from '@framework-core/runtime/database/database'
import { db } from '@framework-core/runtime/database/orm'
import { taskTableNames } from '@framework-core/runtime/database/table-names'
import { ApplicationError } from '@framework-core/runtime/errors/application-error'

interface TaskGroupRow extends RowDataPacket {
  id: string
  title: string
  type: string
  status: string
  created_by: string
  created_at: Date
  updated_at: Date
}

function toTimestamp(value: Date) {
  return value.toISOString()
}

function toTaskGroup(row: TaskGroupRow): TaskGroup {
  return {
    id: row.id,
    title: row.title,
    type: row.type as TaskGroupType,
    status: row.status as TaskGroupStatus,
    createdBy: row.created_by,
    createdAt: toTimestamp(row.created_at),
    updatedAt: toTimestamp(row.updated_at),
  }
}

export class TaskGroupRepository {
  async create(createdBy: string, payload: TaskGroupUpsertPayload) {
    await ensureDatabaseSchema()
    const groupId = randomUUID()

    await db.execute(
      `
        INSERT INTO ${taskTableNames.groups} (
          id,
          title,
          type,
          status,
          created_by
        )
        VALUES (?, ?, ?, ?, ?)
      `,
      [groupId, payload.title, payload.type, payload.status, createdBy],
    )

    const group = await this.findById(groupId)
    if (!group) {
      throw new ApplicationError('Expected task group to be retrievable.', { id: groupId }, 500)
    }
    return group
  }

  async findById(id: string): Promise<TaskGroup | null> {
    await ensureDatabaseSchema()
    const row = await db.first<TaskGroupRow>(
      `
        SELECT id, title, type, status, created_by, created_at, updated_at
        FROM ${taskTableNames.groups}
        WHERE id = ?
        LIMIT 1
      `,
      [id],
    )

    return row ? toTaskGroup(row) : null
  }

  async list(filters?: {
    status?: TaskGroupStatus | null
    type?: TaskGroupType | null
  }) {
    await ensureDatabaseSchema()
    const where: string[] = []
    const params: Array<string> = []

    if (filters?.status) {
      where.push('status = ?')
      params.push(filters.status)
    }

    if (filters?.type) {
      where.push('type = ?')
      params.push(filters.type)
    }

    const rows = await db.query<TaskGroupRow>(
      `
        SELECT id, title, type, status, created_by, created_at, updated_at
        FROM ${taskTableNames.groups}
        ${where.length > 0 ? `WHERE ${where.join(' AND ')}` : ''}
        ORDER BY updated_at DESC, title ASC
      `,
      params,
    )

    return rows.map(toTaskGroup) satisfies TaskGroupSummary[]
  }

  async update(id: string, payload: TaskGroupUpsertPayload) {
    await ensureDatabaseSchema()
    const result = await db.execute(
      `
        UPDATE ${taskTableNames.groups}
        SET
          title = ?,
          type = ?,
          status = ?
        WHERE id = ?
      `,
      [payload.title, payload.type, payload.status, id],
    )

    if (result.affectedRows === 0) {
      throw new ApplicationError('Task group not found.', { id }, 404)
    }

    const group = await this.findById(id)
    if (!group) {
      throw new ApplicationError('Expected task group to be retrievable.', { id }, 500)
    }
    return group
  }
}
