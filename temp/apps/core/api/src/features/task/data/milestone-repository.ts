import type {
  Milestone,
  MilestoneStatus,
  MilestoneSummary,
  MilestoneTaskStats,
  MilestoneUpsertPayload,
  TaskScopeType,
} from '@shared/index'
import type { RowDataPacket } from 'mysql2'
import { randomUUID } from 'node:crypto'
import { ensureDatabaseSchema } from '@framework-core/runtime/database/database'
import { db } from '@framework-core/runtime/database/orm'
import { taskTableNames } from '@framework-core/runtime/database/table-names'
import { ApplicationError } from '@framework-core/runtime/errors/application-error'

interface MilestoneRow extends RowDataPacket {
  id: string
  title: string
  description: string | null
  entity_type: string | null
  entity_id: string | null
  status: string
  due_date: Date | null
  created_by: string
  created_at: Date
  updated_at: Date
  total_tasks: number
  pending_tasks: number
  in_progress_tasks: number
  review_tasks: number
  finalized_tasks: number
  overdue_tasks: number
}

function toTimestamp(value: Date) {
  return value.toISOString()
}

function toDateString(value: Date | null) {
  return value ? value.toISOString().slice(0, 10) : null
}

function toTaskStats(row: MilestoneRow): MilestoneTaskStats {
  return {
    totalTasks: Number(row.total_tasks ?? 0),
    pending: Number(row.pending_tasks ?? 0),
    inProgress: Number(row.in_progress_tasks ?? 0),
    review: Number(row.review_tasks ?? 0),
    finalized: Number(row.finalized_tasks ?? 0),
    overdue: Number(row.overdue_tasks ?? 0),
  }
}

function toMilestone(row: MilestoneRow): Milestone {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    entityType: row.entity_type as TaskScopeType | null,
    entityId: row.entity_id,
    status: row.status as MilestoneStatus,
    dueDate: toDateString(row.due_date),
    createdBy: row.created_by,
    createdAt: toTimestamp(row.created_at),
    updatedAt: toTimestamp(row.updated_at),
    taskStats: toTaskStats(row),
  }
}

const milestoneSelect = `
  SELECT
    m.id,
    m.title,
    m.description,
    m.entity_type,
    m.entity_id,
    m.status,
    m.due_date,
    m.created_by,
    m.created_at,
    m.updated_at,
    COUNT(t.id) AS total_tasks,
    SUM(CASE WHEN t.status = 'pending' THEN 1 ELSE 0 END) AS pending_tasks,
    SUM(CASE WHEN t.status = 'in_progress' THEN 1 ELSE 0 END) AS in_progress_tasks,
    SUM(CASE WHEN t.status = 'review' THEN 1 ELSE 0 END) AS review_tasks,
    SUM(CASE WHEN t.status = 'finalized' THEN 1 ELSE 0 END) AS finalized_tasks,
    SUM(CASE WHEN t.due_date IS NOT NULL AND t.due_date < CURRENT_DATE() AND t.status <> 'finalized' THEN 1 ELSE 0 END) AS overdue_tasks
  FROM ${taskTableNames.milestones} m
  LEFT JOIN ${taskTableNames.tasks} t ON t.milestone_id = m.id
`

export class MilestoneRepository {
  async create(createdBy: string, payload: MilestoneUpsertPayload) {
    await ensureDatabaseSchema()
    const milestoneId = randomUUID()

    await db.execute(
      `
        INSERT INTO ${taskTableNames.milestones} (
          id,
          title,
          description,
          entity_type,
          entity_id,
          status,
          due_date,
          created_by
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `,
      [
        milestoneId,
        payload.title,
        payload.description,
        payload.entityType,
        payload.entityId,
        payload.status,
        payload.dueDate,
        createdBy,
      ],
    )

    const milestone = await this.findById(milestoneId)
    if (!milestone) {
      throw new ApplicationError('Expected milestone to be retrievable.', { id: milestoneId }, 500)
    }
    return milestone
  }

  async findById(id: string): Promise<Milestone | null> {
    await ensureDatabaseSchema()
    const row = await db.first<MilestoneRow>(
      `
        ${milestoneSelect}
        WHERE m.id = ?
        GROUP BY m.id
        LIMIT 1
      `,
      [id],
    )

    return row ? toMilestone(row) : null
  }

  async list(filters?: {
    status?: MilestoneStatus | null
    entityType?: TaskScopeType | null
    entityId?: string | null
  }) {
    await ensureDatabaseSchema()

    const where: string[] = []
    const params: Array<string> = []

    if (filters?.status) {
      where.push('m.status = ?')
      params.push(filters.status)
    }

    if (filters?.entityType) {
      where.push('m.entity_type = ?')
      params.push(filters.entityType)
    }

    if (filters?.entityId) {
      where.push('m.entity_id = ?')
      params.push(filters.entityId)
    }

    const rows = await db.query<MilestoneRow>(
      `
        ${milestoneSelect}
        ${where.length > 0 ? `WHERE ${where.join(' AND ')}` : ''}
        GROUP BY m.id
        ORDER BY m.updated_at DESC, m.title ASC
      `,
      params,
    )

    return rows.map(toMilestone) satisfies MilestoneSummary[]
  }

  async update(id: string, payload: MilestoneUpsertPayload) {
    await ensureDatabaseSchema()

    const result = await db.execute(
      `
        UPDATE ${taskTableNames.milestones}
        SET
          title = ?,
          description = ?,
          entity_type = ?,
          entity_id = ?,
          status = ?,
          due_date = ?
        WHERE id = ?
      `,
      [
        payload.title,
        payload.description,
        payload.entityType,
        payload.entityId,
        payload.status,
        payload.dueDate,
        id,
      ],
    )

    if (result.affectedRows === 0) {
      throw new ApplicationError('Milestone not found.', { id }, 404)
    }

    const milestone = await this.findById(id)
    if (!milestone) {
      throw new ApplicationError('Expected milestone to be retrievable.', { id }, 500)
    }
    return milestone
  }
}
