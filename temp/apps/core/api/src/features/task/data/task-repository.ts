import type {
  Task,
  TaskActivity,
  TaskChecklistItem,
  TaskContext,
  TaskContextInput,
  TaskHealth,
  TaskHealthSignals,
  TaskSummary,
  TaskTemplate,
  TaskTemplateChecklistItem,
  TaskTemplateSummary,
  TaskTemplateUpsertPayload,
  TaskUpsertPayload,
} from '@shared/index'
import type { RowDataPacket } from 'mysql2'
import { randomUUID } from 'node:crypto'
import { ensureDatabaseSchema } from '@framework-core/runtime/database/database'
import { db } from '@framework-core/runtime/database/orm'
import { authTableNames, taskTableNames } from '@framework-core/runtime/database/table-names'
import { ApplicationError } from '@framework-core/runtime/errors/application-error'

interface TaskSummaryRow extends RowDataPacket {
  id: string
  title: string
  description: string | null
  task_context_json: string | null
  task_health_json: string | null
  task_group_id: string | null
  task_group_title: string | null
  milestone_id: string | null
  milestone_title: string | null
  status: string
  status_changed_at: Date
  priority: string
  tags_json: string | null
  scope_type: string
  entity_type: string | null
  entity_id: string | null
  entity_label: string | null
  template_id: string | null
  template_name: string | null
  assignee_id: string | null
  assignee_name: string | null
  review_assigned_to: string | null
  review_assigned_to_name: string | null
  creator_id: string
  creator_name: string
  reviewed_by: string | null
  reviewed_by_name: string | null
  reviewed_at: Date | null
  review_comment: string | null
  due_date: Date | null
  checklist_completion_count: number
  checklist_total_count: number
  created_at: Date
  updated_at: Date
}

interface TaskActivityRow extends RowDataPacket {
  id: string
  task_id: string
  author_id: string
  author_name: string | null
  activity_type: TaskActivity['activityType']
  content: string
  created_at: Date
}

interface TaskChecklistItemRow extends RowDataPacket {
  id: string
  label: string
  is_required: number
  is_checked: number
  checked_by: string | null
  checked_by_name: string | null
  checked_at: Date | null
  note: string | null
  sort_order: number
}

interface TaskTemplateSummaryRow extends RowDataPacket {
  id: string
  name: string
  scope_type: string
  title_template: string
  description_template: string | null
  default_priority: string
  default_tags_json: string | null
  is_active: number
  checklist_item_count: number
  created_at: Date
  updated_at: Date
}

interface TaskTemplateChecklistItemRow extends RowDataPacket {
  id: string
  label: string
  is_required: number
  sort_order: number
}

function toTimestamp(value: Date) {
  return value.toISOString()
}

function toDateString(value: Date | null) {
  return value ? value.toISOString().slice(0, 10) : null
}

function toStringArray(value: string | null) {
  if (!value) return []
  try {
    const parsedValue = JSON.parse(value) as unknown
    return Array.isArray(parsedValue)
      ? parsedValue.map((entry) => (typeof entry === 'string' ? entry.trim() : '')).filter(Boolean)
      : []
  } catch {
    return []
  }
}

function parseJsonRecord(value: string | null) {
  if (!value) return null
  try {
    const parsedValue = JSON.parse(value) as unknown
    return parsedValue && typeof parsedValue === 'object' ? parsedValue as Record<string, unknown> : null
  } catch {
    return null
  }
}

function inferTaskDomain(scopeType: TaskSummary['scopeType'], tags: string[]) {
  return tags.find((tag) => tag.trim().length > 0) ?? scopeType ?? 'general'
}

function toTaskContext(value: string | null, fallback: {
  title: string
  checklistTotalCount: number
  scopeType: TaskSummary['scopeType']
  tags: string[]
}): TaskContext {
  const parsedValue = parseJsonRecord(value)
  return {
    objective: typeof parsedValue?.objective === 'string' && parsedValue.objective.trim() ? parsedValue.objective.trim() : fallback.title,
    outcome: typeof parsedValue?.outcome === 'string' && parsedValue.outcome.trim()
      ? parsedValue.outcome.trim()
      : fallback.checklistTotalCount > 0
        ? 'Complete all checklist items and move the task through a valid workflow state.'
        : 'Move the task to a valid completed state.',
    domain: typeof parsedValue?.domain === 'string' && parsedValue.domain.trim()
      ? parsedValue.domain.trim()
      : inferTaskDomain(fallback.scopeType, fallback.tags),
  }
}

function toTaskHealth(value: string | null, fallbackTimestamp: Date): TaskHealth {
  const parsedValue = parseJsonRecord(value)
  const parsedSignals = parsedValue?.signals && typeof parsedValue.signals === 'object'
    ? parsedValue.signals as Record<string, unknown>
    : null
  const signals: TaskHealthSignals = {}

  if (parsedSignals?.overdue === true) signals.overdue = true
  if (parsedSignals?.inactive === true) signals.inactive = true
  if (parsedSignals?.checklistIncomplete === true) signals.checklistIncomplete = true
  if (parsedSignals?.longInSameState === true) signals.longInSameState = true

  return {
    status: parsedValue?.status === 'at_risk' || parsedValue?.status === 'stuck' || parsedValue?.status === 'blocked'
      ? parsedValue.status
      : 'normal',
    lastEvaluatedAt: typeof parsedValue?.lastEvaluatedAt === 'string' && parsedValue.lastEvaluatedAt.trim()
      ? parsedValue.lastEvaluatedAt.trim()
      : toTimestamp(fallbackTimestamp),
    signals,
  }
}

function serializeTaskContext(value: TaskContextInput | TaskContext | null | undefined) {
  return JSON.stringify({
    objective: value?.objective?.trim() || null,
    outcome: value?.outcome?.trim() || null,
    domain: value?.domain?.trim() || null,
  })
}

function serializeTaskHealth(value: TaskHealth) {
  return JSON.stringify({
    status: value.status,
    lastEvaluatedAt: value.lastEvaluatedAt,
    signals: value.signals,
  })
}

function toTaskSummary(row: TaskSummaryRow): TaskSummary {
  const tags = toStringArray(row.tags_json)
  const checklistTotalCount = Number(row.checklist_total_count ?? 0)
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    taskContext: toTaskContext(row.task_context_json, {
      title: row.title,
      checklistTotalCount,
      scopeType: row.scope_type as TaskSummary['scopeType'],
      tags,
    }),
    taskHealth: toTaskHealth(row.task_health_json, row.updated_at),
    taskGroupId: row.task_group_id,
    taskGroupTitle: row.task_group_title,
    milestoneId: row.milestone_id,
    milestoneTitle: row.milestone_title,
    status: row.status as TaskSummary['status'],
    priority: row.priority as TaskSummary['priority'],
    tags,
    scopeType: row.scope_type as TaskSummary['scopeType'],
    entityType: row.entity_type as TaskSummary['entityType'],
    entityId: row.entity_id,
    entityLabel: row.entity_label,
    templateId: row.template_id,
    templateName: row.template_name,
    assigneeId: row.assignee_id,
    assigneeName: row.assignee_name,
    reviewAssignedTo: row.review_assigned_to,
    reviewAssignedToName: row.review_assigned_to_name,
    creatorId: row.creator_id,
    creatorName: row.creator_name,
    reviewedBy: row.reviewed_by,
    reviewedByName: row.reviewed_by_name,
    reviewedAt: row.reviewed_at ? toTimestamp(row.reviewed_at) : null,
    reviewComment: row.review_comment,
    dueDate: toDateString(row.due_date),
    checklistCompletionCount: Number(row.checklist_completion_count ?? 0),
    checklistTotalCount,
    statusChangedAt: toTimestamp(row.status_changed_at),
    createdAt: toTimestamp(row.created_at),
    updatedAt: toTimestamp(row.updated_at),
  }
}

function toTaskActivity(row: TaskActivityRow): TaskActivity {
  return {
    id: row.id,
    taskId: row.task_id,
    authorId: row.author_id,
    authorName: row.author_name,
    activityType: row.activity_type,
    content: row.content,
    createdAt: toTimestamp(row.created_at),
  }
}

function toTaskChecklistItem(row: TaskChecklistItemRow): TaskChecklistItem {
  return {
    id: row.id,
    label: row.label,
    isRequired: Boolean(row.is_required),
    isChecked: Boolean(row.is_checked),
    checkedBy: row.checked_by,
    checkedByName: row.checked_by_name,
    checkedAt: row.checked_at ? toTimestamp(row.checked_at) : null,
    note: row.note,
    sortOrder: row.sort_order,
  }
}

function toTaskTemplateSummary(row: TaskTemplateSummaryRow): TaskTemplateSummary {
  return {
    id: row.id,
    name: row.name,
    scopeType: row.scope_type as TaskTemplateSummary['scopeType'],
    titleTemplate: row.title_template,
    descriptionTemplate: row.description_template,
    defaultPriority: row.default_priority as TaskTemplateSummary['defaultPriority'],
    defaultTags: toStringArray(row.default_tags_json),
    isActive: Boolean(row.is_active),
    checklistItemCount: Number(row.checklist_item_count ?? 0),
    createdAt: toTimestamp(row.created_at),
    updatedAt: toTimestamp(row.updated_at),
  }
}

function toTaskTemplateChecklistItem(row: TaskTemplateChecklistItemRow): TaskTemplateChecklistItem {
  return {
    id: row.id,
    label: row.label,
    isRequired: Boolean(row.is_required),
    sortOrder: row.sort_order,
  }
}

const taskSummarySelect = `
  SELECT
    t.id,
    t.title,
    t.description,
    CAST(t.task_context_json AS CHAR) AS task_context_json,
    CAST(t.task_health_json AS CHAR) AS task_health_json,
    t.task_group_id,
    task_group.title AS task_group_title,
    t.milestone_id,
    milestone.title AS milestone_title,
    t.status,
    t.status_changed_at,
    t.priority,
    CAST(t.tags_json AS CHAR) AS tags_json,
    t.scope_type,
    t.entity_type,
    t.entity_id,
    t.entity_label,
    t.template_id,
    template.name AS template_name,
    t.assignee_id,
    assignee.display_name AS assignee_name,
    t.review_assigned_to,
    review_assignee.display_name AS review_assigned_to_name,
    t.creator_id,
    creator.display_name AS creator_name,
    t.reviewed_by,
    reviewer.display_name AS reviewed_by_name,
    t.reviewed_at,
    t.review_comment,
    t.due_date,
    (
      SELECT COUNT(*)
      FROM ${taskTableNames.checklistItems} checklist_all
      WHERE checklist_all.task_id = t.id
    ) AS checklist_total_count,
    (
      SELECT COUNT(*)
      FROM ${taskTableNames.checklistItems} checklist_checked
      WHERE checklist_checked.task_id = t.id
        AND checklist_checked.is_checked = 1
    ) AS checklist_completion_count,
    t.created_at,
    t.updated_at
  FROM ${taskTableNames.tasks} t
  INNER JOIN ${authTableNames.users} creator ON creator.id = t.creator_id
  LEFT JOIN ${authTableNames.users} assignee ON assignee.id = t.assignee_id
  LEFT JOIN ${authTableNames.users} review_assignee ON review_assignee.id = t.review_assigned_to
  LEFT JOIN ${authTableNames.users} reviewer ON reviewer.id = t.reviewed_by
  LEFT JOIN ${taskTableNames.templates} template ON template.id = t.template_id
  LEFT JOIN ${taskTableNames.groups} task_group ON task_group.id = t.task_group_id
  LEFT JOIN ${taskTableNames.milestones} milestone ON milestone.id = t.milestone_id
`

export class TaskRepository {
  async listVisibleTasks(userId: string, filters?: { milestoneId?: string | null }) {
    await ensureDatabaseSchema()

    const where = ['(t.assignee_id = ? OR t.creator_id = ?)']
    const params: Array<string> = [userId, userId]
    if (filters?.milestoneId) {
      where.push('t.milestone_id = ?')
      params.push(filters.milestoneId)
    }

    const rows = await db.query<TaskSummaryRow>(
      `
        ${taskSummarySelect}
        WHERE ${where.join(' AND ')}
        ORDER BY t.created_at ASC, t.id ASC
      `,
      params,
    )

    return rows.map(toTaskSummary)
  }

  async listAllTasks(filters?: { milestoneId?: string | null }) {
    await ensureDatabaseSchema()

    const where: string[] = []
    const params: Array<string> = []
    if (filters?.milestoneId) {
      where.push('t.milestone_id = ?')
      params.push(filters.milestoneId)
    }

    const rows = await db.query<TaskSummaryRow>(
      `
        ${taskSummarySelect}
        ${where.length > 0 ? `WHERE ${where.join(' AND ')}` : ''}
        ORDER BY t.created_at ASC, t.id ASC
      `,
      params,
    )

    return rows.map(toTaskSummary)
  }

  async listTasksByEntity(entityType: string, entityId: string) {
    await ensureDatabaseSchema()

    const rows = await db.query<TaskSummaryRow>(
      `
        ${taskSummarySelect}
        WHERE t.entity_type = ? AND t.entity_id = ?
        ORDER BY t.created_at ASC, t.id ASC
      `,
      [entityType, entityId],
    )

    return rows.map(toTaskSummary)
  }

  async listTemplates(scopeType?: string | null) {
    await ensureDatabaseSchema()

    const rows = await db.query<TaskTemplateSummaryRow>(
      `
        SELECT
          template.id,
          template.name,
          template.scope_type,
          template.title_template,
          template.description_template,
          template.default_priority,
          CAST(template.default_tags_json AS CHAR) AS default_tags_json,
          template.is_active,
          (
            SELECT COUNT(*)
            FROM ${taskTableNames.templateItems} item
            WHERE item.template_id = template.id
          ) AS checklist_item_count,
          template.created_at,
          template.updated_at
        FROM ${taskTableNames.templates} template
        ${scopeType ? 'WHERE template.scope_type IN (?, ?)' : ''}
        ORDER BY template.name ASC
      `,
      scopeType ? [scopeType, 'general'] : [],
    )

    return rows.map(toTaskTemplateSummary)
  }

  async findTemplateById(id: string): Promise<TaskTemplate | null> {
    await ensureDatabaseSchema()

    const row = await db.first<TaskTemplateSummaryRow>(
      `
        SELECT
          template.id,
          template.name,
          template.scope_type,
          template.title_template,
          template.description_template,
          template.default_priority,
          CAST(template.default_tags_json AS CHAR) AS default_tags_json,
          template.is_active,
          (
            SELECT COUNT(*)
            FROM ${taskTableNames.templateItems} item
            WHERE item.template_id = template.id
          ) AS checklist_item_count,
          template.created_at,
          template.updated_at
        FROM ${taskTableNames.templates} template
        WHERE template.id = ?
        LIMIT 1
      `,
      [id],
    )

    if (!row) return null

    const checklistRows = await db.query<TaskTemplateChecklistItemRow>(
      `
        SELECT id, label, is_required, sort_order
        FROM ${taskTableNames.templateItems}
        WHERE template_id = ?
        ORDER BY sort_order ASC, created_at ASC
      `,
      [id],
    )

    return {
      ...toTaskTemplateSummary(row),
      checklistItems: checklistRows.map(toTaskTemplateChecklistItem),
    }
  }

  async createTemplate(payload: TaskTemplateUpsertPayload) {
    await ensureDatabaseSchema()
    const templateId = randomUUID()

    await db.transaction(async (transaction) => {
      await transaction.execute(
        `
          INSERT INTO ${taskTableNames.templates} (
            id,
            name,
            scope_type,
            title_template,
            description_template,
            default_priority,
            default_tags_json,
            is_active
          )
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `,
        [
          templateId,
          payload.name,
          payload.scopeType,
          payload.titleTemplate,
          payload.descriptionTemplate,
          payload.defaultPriority,
          JSON.stringify(payload.defaultTags),
          payload.isActive,
        ],
      )

      for (const item of payload.checklistItems) {
        await transaction.execute(
          `
            INSERT INTO ${taskTableNames.templateItems} (
              id,
              template_id,
              label,
              is_required,
              sort_order
            )
            VALUES (?, ?, ?, ?, ?)
          `,
          [randomUUID(), templateId, item.label, item.isRequired, item.sortOrder],
        )
      }
    })

    const template = await this.findTemplateById(templateId)
    if (!template) throw new ApplicationError('Expected task template to be retrievable.', { id: templateId }, 500)
    return template
  }

  async updateTemplate(id: string, payload: TaskTemplateUpsertPayload) {
    await ensureDatabaseSchema()

    await db.transaction(async (transaction) => {
      await transaction.execute(
        `
          UPDATE ${taskTableNames.templates}
          SET
            name = ?,
            scope_type = ?,
            title_template = ?,
            description_template = ?,
            default_priority = ?,
            default_tags_json = ?,
            is_active = ?
          WHERE id = ?
        `,
        [
          payload.name,
          payload.scopeType,
          payload.titleTemplate,
          payload.descriptionTemplate,
          payload.defaultPriority,
          JSON.stringify(payload.defaultTags),
          payload.isActive,
          id,
        ],
      )

      await transaction.execute(`DELETE FROM ${taskTableNames.templateItems} WHERE template_id = ?`, [id])

      for (const item of payload.checklistItems) {
        await transaction.execute(
          `
            INSERT INTO ${taskTableNames.templateItems} (
              id,
              template_id,
              label,
              is_required,
              sort_order
            )
            VALUES (?, ?, ?, ?, ?)
          `,
          [randomUUID(), id, item.label, item.isRequired, item.sortOrder],
        )
      }
    })

    const template = await this.findTemplateById(id)
    if (!template) throw new ApplicationError('Expected updated task template to be retrievable.', { id }, 500)
    return template
  }

  async findById(id: string): Promise<Task | null> {
    await ensureDatabaseSchema()

    const row = await db.first<TaskSummaryRow>(
      `
        ${taskSummarySelect}
        WHERE t.id = ?
        LIMIT 1
      `,
      [id],
    )

    if (!row) return null

    const checklistRows = await db.query<TaskChecklistItemRow>(
      `
        SELECT
          item.id,
          item.label,
          item.is_required,
          item.is_checked,
          item.checked_by,
          checker.display_name AS checked_by_name,
          item.checked_at,
          item.note,
          item.sort_order
        FROM ${taskTableNames.checklistItems} item
        LEFT JOIN ${authTableNames.users} checker ON checker.id = item.checked_by
        WHERE item.task_id = ?
        ORDER BY item.sort_order ASC, item.created_at ASC
      `,
      [id],
    )

    const activities = await db.query<TaskActivityRow>(
      `
        SELECT
          activity.id,
          activity.task_id,
          activity.author_id,
          author.display_name AS author_name,
          activity.activity_type,
          activity.content,
          activity.created_at
        FROM ${taskTableNames.activities} activity
        LEFT JOIN ${authTableNames.users} author ON author.id = activity.author_id
        WHERE activity.task_id = ?
        ORDER BY activity.created_at ASC
      `,
      [id],
    )

    return {
      ...toTaskSummary(row),
      checklistItems: checklistRows.map(toTaskChecklistItem),
      activities: activities.map(toTaskActivity),
    }
  }

  async create(
    creatorId: string,
    payload: TaskUpsertPayload,
    options?: {
      taskContext?: TaskContext | TaskContextInput | null
      taskHealth?: TaskHealth | null
      statusChangedAt?: Date | null
    },
  ) {
    await ensureDatabaseSchema()
    const taskId = randomUUID()

    await db.transaction(async (transaction) => {
      await transaction.execute(
        `
          INSERT INTO ${taskTableNames.tasks} (
            id,
            title,
            description,
            task_context_json,
            task_health_json,
            task_group_id,
            milestone_id,
            status,
            status_changed_at,
            priority,
            assignee_id,
            review_assigned_to,
            creator_id,
            due_date,
            tags_json,
            scope_type,
            entity_type,
            entity_id,
            entity_label,
            template_id
          )
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `,
        [
          taskId,
          payload.title,
          payload.description,
          serializeTaskContext(options?.taskContext ?? payload.taskContext),
          serializeTaskHealth(options?.taskHealth ?? {
            status: 'normal',
            lastEvaluatedAt: new Date().toISOString(),
            signals: {},
          }),
          payload.taskGroupId,
          payload.milestoneId,
          payload.status,
          options?.statusChangedAt ?? new Date(),
          payload.priority,
          payload.assigneeId,
          null,
          creatorId,
          payload.dueDate,
          JSON.stringify(payload.tags),
          payload.scopeType,
          payload.entityType,
          payload.entityId,
          payload.entityLabel,
          payload.templateId,
        ],
      )

      const checklistSeed = payload.checklistItems.map((item, index) => ({
        id: item.id || randomUUID(),
        label: item.label?.trim() || item.id,
        note: item.note,
        isChecked: item.isChecked,
        sortOrder: index,
      }))

      for (const item of checklistSeed) {
        await transaction.execute(
          `
            INSERT INTO ${taskTableNames.checklistItems} (
              id,
              task_id,
              template_item_id,
              label,
              is_required,
              is_checked,
              note,
              sort_order
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
          `,
          [item.id, taskId, null, item.label, true, item.isChecked, item.note, item.sortOrder],
        )
      }

      await transaction.execute(
        `
          INSERT INTO ${taskTableNames.activities} (
            id,
            task_id,
            author_id,
            activity_type,
            content
          )
          VALUES (?, ?, ?, ?, ?)
        `,
        [randomUUID(), taskId, creatorId, 'status_change', 'Task created'],
      )
    })

    const task = await this.findById(taskId)
    if (!task) throw new ApplicationError('Expected created task to be retrievable.', { id: taskId }, 500)
    return task
  }

  async update(
    id: string,
    authorId: string,
    payload: TaskUpsertPayload,
    reviewState?: {
      reviewAssignedTo: string | null
      reviewedBy: string | null
      reviewedAt: Date | null
      reviewComment: string | null
    },
    activityEntries: Array<{ activityType: TaskActivity['activityType']; content: string }> = [],
    options?: {
      taskContext?: TaskContext | TaskContextInput | null
      taskHealth?: TaskHealth | null
      statusChangedAt?: Date | null
    },
  ) {
    await ensureDatabaseSchema()

    await db.transaction(async (transaction) => {
      const existing = await transaction.first<RowDataPacket>(`SELECT id FROM ${taskTableNames.tasks} WHERE id = ? LIMIT 1`, [id])
      if (!existing) {
        throw new ApplicationError('Task not found.', { id }, 404)
      }

      await transaction.execute(
        `
          UPDATE ${taskTableNames.tasks}
          SET
            title = ?,
            description = ?,
            task_context_json = ?,
            task_health_json = ?,
            task_group_id = ?,
            milestone_id = ?,
            status = ?,
            status_changed_at = ?,
            priority = ?,
            assignee_id = ?,
            review_assigned_to = ?,
            reviewed_by = ?,
            reviewed_at = ?,
            review_comment = ?,
            due_date = ?,
            tags_json = ?,
            scope_type = ?,
            entity_type = ?,
            entity_id = ?,
            entity_label = ?,
            template_id = ?
          WHERE id = ?
        `,
        [
          payload.title,
          payload.description,
          serializeTaskContext(options?.taskContext ?? payload.taskContext),
          serializeTaskHealth(options?.taskHealth ?? {
            status: 'normal',
            lastEvaluatedAt: new Date().toISOString(),
            signals: {},
          }),
          payload.taskGroupId,
          payload.milestoneId,
          payload.status,
          options?.statusChangedAt ?? new Date(),
          payload.priority,
          payload.assigneeId,
          reviewState?.reviewAssignedTo ?? null,
          reviewState?.reviewedBy ?? null,
          reviewState?.reviewedAt ?? null,
          reviewState?.reviewComment ?? null,
          payload.dueDate,
          JSON.stringify(payload.tags),
          payload.scopeType,
          payload.entityType,
          payload.entityId,
          payload.entityLabel,
          payload.templateId,
          id,
        ],
      )

      if (payload.checklistItems.length > 0) {
        for (const [index, item] of payload.checklistItems.entries()) {
          const result = await transaction.execute(
            `
              UPDATE ${taskTableNames.checklistItems}
              SET
                label = COALESCE(?, label),
                is_checked = ?,
                checked_by = ?,
                checked_at = ?,
                note = ?,
                sort_order = ?
              WHERE id = ? AND task_id = ?
            `,
            [
              item.label ?? null,
              item.isChecked,
              item.isChecked ? authorId : null,
              item.isChecked ? new Date() : null,
              item.note,
              index,
              item.id,
              id,
            ],
          )

          if (result.affectedRows === 0) {
            await transaction.execute(
              `
                INSERT INTO ${taskTableNames.checklistItems} (
                  id,
                  task_id,
                  template_item_id,
                  label,
                  is_required,
                  is_checked,
                  checked_by,
                  checked_at,
                  note,
                  sort_order
                )
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
              `,
              [
                item.id,
                id,
                null,
                item.label?.trim() || item.id,
                true,
                item.isChecked,
                item.isChecked ? authorId : null,
                item.isChecked ? new Date() : null,
                item.note,
                index,
              ],
            )
          }
        }
      }

      for (const entry of activityEntries) {
        await transaction.execute(
          `
            INSERT INTO ${taskTableNames.activities} (
              id,
              task_id,
              author_id,
              activity_type,
              content
            )
            VALUES (?, ?, ?, ?, ?)
          `,
          [randomUUID(), id, authorId, entry.activityType, entry.content],
        )
      }
    })

    const task = await this.findById(id)
    if (!task) throw new ApplicationError('Expected updated task to be retrievable.', { id }, 500)
    return task
  }

  async updateStatus(id: string, authorId: string, newStatus: string) {
    await ensureDatabaseSchema()

    await db.transaction(async (transaction) => {
      const result = await transaction.execute(
        `UPDATE ${taskTableNames.tasks} SET status = ?, status_changed_at = ? WHERE id = ?`,
        [newStatus, new Date(), id],
      )

      if (result.affectedRows === 0) {
        throw new ApplicationError('Task not found.', { id }, 404)
      }

      await transaction.execute(
        `
          INSERT INTO ${taskTableNames.activities} (
            id,
            task_id,
            author_id,
            activity_type,
            content
          )
          VALUES (?, ?, ?, ?, ?)
        `,
        [randomUUID(), id, authorId, 'status_change', `Status changed to ${newStatus}`],
      )
    })

    const task = await this.findById(id)
    if (!task) throw new ApplicationError('Expected task to be retrievable after status update.', { id }, 500)
    return task
  }

  async saveHealthSnapshot(id: string, taskHealth: TaskHealth) {
    await ensureDatabaseSchema()

    const result = await db.execute(
      `
        UPDATE ${taskTableNames.tasks}
        SET task_health_json = ?
        WHERE id = ?
      `,
      [serializeTaskHealth(taskHealth), id],
    )

    if (result.affectedRows === 0) {
      throw new ApplicationError('Task not found.', { id }, 404)
    }
  }

  async addActivity(taskId: string, authorId: string, activityType: string, content: string) {
    await ensureDatabaseSchema()

    await db.execute(
      `
        INSERT INTO ${taskTableNames.activities} (
          id,
          task_id,
          author_id,
          activity_type,
          content
        )
        VALUES (?, ?, ?, ?, ?)
      `,
      [randomUUID(), taskId, authorId, activityType, content],
    )

    const task = await this.findById(taskId)
    if (!task) throw new ApplicationError('Expected task to be retrievable after comment.', { id: taskId }, 500)
    return task
  }
}
