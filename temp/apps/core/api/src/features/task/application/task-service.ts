import type {
  AuthUser,
  Task,
  TaskAuditItem,
  TaskAuditListResponse,
  TaskBulkCreateResponse,
  TaskContext,
  TaskContextInput,
  TaskHealth,
  TaskInsights,
  TaskInsightsResponse,
  TaskListResponse,
  TaskResponse,
  TaskStatus,
  TaskTemplateListResponse,
  TaskTemplateResponse,
  TaskUpsertPayload,
} from '@shared/index'
import {
  taskAuditListResponseSchema,
  taskBulkCreatePayloadSchema,
  taskBulkCreateResponseSchema,
  taskInsightsResponseSchema,
  taskListResponseSchema,
  taskResponseSchema,
  taskTemplateListResponseSchema,
  taskTemplateResponseSchema,
  taskTemplateUpsertPayloadSchema,
  taskUpsertPayloadSchema,
  taskActivityInputSchema,
} from '@shared/index'
import type { TaskRepository } from '../data/task-repository'
import { ApplicationError } from '@framework-core/runtime/errors/application-error'
import { ProductRepository } from '@ecommerce-api/features/product/data/product-repository'
import type { NotificationService } from '../../notification/application/notification-service'
import type { MilestoneRepository } from '../data/milestone-repository'
import type { TaskGroupRepository } from '../data/task-group-repository'
import { randomUUID } from 'node:crypto'

interface PersistenceError {
  sqlMessage?: string
  message?: string
}

type TaskMutationAction = 'create' | 'update' | 'finalize'

function startOfDay(value = new Date()) {
  return new Date(Date.UTC(value.getUTCFullYear(), value.getUTCMonth(), value.getUTCDate()))
}

function addDays(value: Date, days: number) {
  const next = new Date(value)
  next.setUTCDate(next.getUTCDate() + days)
  return next
}

function parseDate(value: string | null) {
  if (!value) {
    return null
  }

  const parsedValue = new Date(value)
  return Number.isNaN(parsedValue.getTime()) ? null : parsedValue
}

function getVerificationState(task: { checklistCompletionCount: number; checklistTotalCount: number }): TaskAuditItem['verificationState'] {
  if (task.checklistTotalCount === 0 || task.checklistCompletionCount === 0) {
    return 'not_started'
  }

  if (task.checklistCompletionCount >= task.checklistTotalCount) {
    return 'completed'
  }

  return 'partial'
}

function toAuditItem(task: TaskAuditItem | {
  id: string
  title: string
  description: string | null
  taskContext: Task['taskContext']
  taskHealth: Task['taskHealth']
  taskGroupId: string | null
  taskGroupTitle: string | null
  milestoneId: string | null
  milestoneTitle: string | null
  status: TaskAuditItem['status']
  priority: TaskAuditItem['priority']
  tags: string[]
  scopeType: TaskAuditItem['scopeType']
  entityType: TaskAuditItem['entityType']
  entityId: string | null
  entityLabel: string | null
  templateId: string | null
  templateName: string | null
  assigneeId: string | null
  assigneeName: string | null
  reviewAssignedTo: string | null
  reviewAssignedToName: string | null
  creatorId: string
  creatorName: string
  reviewedBy: string | null
  reviewedByName: string | null
  reviewedAt: string | null
  reviewComment: string | null
  dueDate: string | null
  checklistCompletionCount: number
  checklistTotalCount: number
  statusChangedAt: string
  createdAt: string
  updatedAt: string
}): TaskAuditItem {
  const verificationState = getVerificationState(task)
  const healthSignals = toBooleanSignals(task.taskHealth)
  return {
    ...task,
    verificationState,
    isOverdue: healthSignals.overdue,
    isStuck: task.taskHealth.status === 'stuck' || healthSignals.inactive || healthSignals.longInSameState,
    isIncompleteVerification: healthSignals.checklistIncomplete,
  }
}

function isBackofficeUser(user: AuthUser) {
  return user.actorType === 'admin' || user.actorType === 'staff'
}

function isManagerLike(user: AuthUser) {
  return user.isSuperAdmin || user.roles.some((role) => {
    const key = role.key.toLowerCase()
    const name = role.name.toLowerCase()
    return key.includes('manager') || name.includes('manager')
  })
}

function isAdminLike(user: AuthUser) {
  return user.actorType === 'admin' || user.isSuperAdmin || isManagerLike(user)
}

function canAssignTasks(user: AuthUser) {
  return isAdminLike(user)
}

function canFinalizeTasks(user: AuthUser) {
  return isAdminLike(user)
}

function assertBackofficeUser(user: AuthUser) {
  if (!isBackofficeUser(user)) {
    throw new ApplicationError('Only backoffice users can manage tasks.', { actorType: user.actorType }, 403)
  }
}

function isChecklistComplete(checklistCompletionCount: number, checklistTotalCount: number) {
  return checklistTotalCount === 0 || checklistCompletionCount >= checklistTotalCount
}

function inferTaskDomain(scopeType: Task['scopeType'], tags: string[], taskContext?: TaskContextInput | TaskContext | null) {
  return taskContext?.domain?.trim() || tags.find((tag) => tag.trim().length > 0) || scopeType || 'general'
}

function resolveTaskContext(input: {
  title: string
  scopeType: Task['scopeType']
  tags: string[]
  checklistTotalCount: number
  taskContext?: TaskContextInput | TaskContext | null
}): TaskContext {
  return {
    objective: input.taskContext?.objective?.trim() || input.title,
    outcome: input.taskContext?.outcome?.trim() || (
      input.checklistTotalCount > 0
        ? 'Complete all checklist items and move the task through a valid workflow state.'
        : 'Move the task to a valid completed state.'
    ),
    domain: inferTaskDomain(input.scopeType, input.tags, input.taskContext),
  }
}

function toBooleanSignals(taskHealth: TaskHealth) {
  return {
    overdue: taskHealth.signals.overdue === true,
    inactive: taskHealth.signals.inactive === true,
    checklistIncomplete: taskHealth.signals.checklistIncomplete === true,
    longInSameState: taskHealth.signals.longInSameState === true,
  }
}

function areHealthSnapshotsEquivalent(left: TaskHealth, right: TaskHealth) {
  const leftSignals = toBooleanSignals(left)
  const rightSignals = toBooleanSignals(right)
  return (
    left.status === right.status
    && leftSignals.overdue === rightSignals.overdue
    && leftSignals.inactive === rightSignals.inactive
    && leftSignals.checklistIncomplete === rightSignals.checklistIncomplete
    && leftSignals.longInSameState === rightSignals.longInSameState
  )
}

function evaluateTaskHealth(input: {
  status: Task['status']
  dueDate: string | null
  updatedAt: string
  statusChangedAt: string
  checklistCompletionCount: number
  checklistTotalCount: number
  now?: Date
}): TaskHealth {
  const now = input.now ?? new Date()
  const updatedAt = parseDate(input.updatedAt)
  const statusChangedAt = parseDate(input.statusChangedAt)
  const dueDate = parseDate(input.dueDate)

  const overdue = Boolean(dueDate && input.status !== 'finalized' && dueDate < now)
  const inactive = Boolean(
    input.status === 'in_progress'
    && updatedAt
    && updatedAt.getTime() < now.getTime() - (24 * 60 * 60 * 1000),
  )
  const checklistIncomplete = Boolean(
    input.status === 'review'
    && input.checklistTotalCount > 0
    && input.checklistCompletionCount < input.checklistTotalCount,
  )
  const longInSameState = Boolean(
    statusChangedAt
    && input.status !== 'finalized'
    && statusChangedAt.getTime() < now.getTime() - (72 * 60 * 60 * 1000),
  )

  const status: TaskHealth['status'] = overdue || checklistIncomplete
    ? 'at_risk'
    : inactive || longInSameState
      ? 'stuck'
      : 'normal'

  return {
    status,
    lastEvaluatedAt: now.toISOString(),
    signals: {
      ...(overdue ? { overdue: true } : {}),
      ...(inactive ? { inactive: true } : {}),
      ...(checklistIncomplete ? { checklistIncomplete: true } : {}),
      ...(longInSameState ? { longInSameState: true } : {}),
    },
  }
}

function validateStatusTransition(previousStatus: TaskStatus, nextStatus: TaskStatus) {
  if (previousStatus === nextStatus) {
    return
  }

  const allowedTransitions: Record<TaskStatus, TaskStatus[]> = {
    pending: ['in_progress'],
    in_progress: ['review'],
    review: ['in_progress', 'finalized'],
    finalized: [],
  }

  if (!allowedTransitions[previousStatus].includes(nextStatus)) {
    throw new ApplicationError(
      'Invalid task status transition.',
      { previousStatus, nextStatus, allowedTransitions: allowedTransitions[previousStatus] },
      400,
    )
  }
}

function toTaskUpsertPayload(task: Task): TaskUpsertPayload {
  return {
    title: task.title,
    description: task.description,
    taskContext: task.taskContext,
    status: task.status,
    priority: task.priority,
    tags: task.tags,
    taskGroupId: task.taskGroupId,
    milestoneId: task.milestoneId,
    scopeType: task.scopeType,
    entityType: task.entityType,
    entityId: task.entityId,
    entityLabel: task.entityLabel,
    templateId: task.templateId,
    assigneeId: task.assigneeId,
    dueDate: task.dueDate,
    reviewComment: task.reviewComment,
    checklistItems: task.checklistItems.map((item) => ({
      id: item.id,
      label: item.label,
      isChecked: item.isChecked,
      note: item.note,
    })),
  }
}

function areChecklistUpdatesEquivalent(previousItem: Task, nextPayload: TaskUpsertPayload) {
  if (previousItem.checklistItems.length !== nextPayload.checklistItems.length) {
    return false
  }

  const nextChecklistById = new Map(nextPayload.checklistItems.map((item) => [item.id, item]))
  return previousItem.checklistItems.every((item) => {
    const nextItem = nextChecklistById.get(item.id)
    if (!nextItem) {
      return false
    }
    return nextItem.isChecked === item.isChecked && (nextItem.note ?? null) === (item.note ?? null)
  })
}

function isMutationEquivalent(previousItem: Task, nextPayload: TaskUpsertPayload) {
  return (
    previousItem.title === nextPayload.title
    && previousItem.description === nextPayload.description
    && previousItem.taskContext.objective === (nextPayload.taskContext?.objective?.trim() || previousItem.taskContext.objective)
    && previousItem.taskContext.outcome === (nextPayload.taskContext?.outcome?.trim() || previousItem.taskContext.outcome)
    && previousItem.taskContext.domain === (nextPayload.taskContext?.domain?.trim() || previousItem.taskContext.domain)
    && previousItem.taskGroupId === nextPayload.taskGroupId
    && previousItem.milestoneId === nextPayload.milestoneId
    && previousItem.status === nextPayload.status
    && previousItem.priority === nextPayload.priority
    && previousItem.scopeType === nextPayload.scopeType
    && previousItem.entityType === nextPayload.entityType
    && previousItem.entityId === nextPayload.entityId
    && previousItem.entityLabel === nextPayload.entityLabel
    && previousItem.templateId === nextPayload.templateId
    && previousItem.assigneeId === nextPayload.assigneeId
    && previousItem.dueDate === nextPayload.dueDate
    && previousItem.reviewComment === nextPayload.reviewComment
    && previousItem.tags.join('|') === nextPayload.tags.join('|')
    && areChecklistUpdatesEquivalent(previousItem, nextPayload)
  )
}

export class TaskService {
  constructor(
    private readonly repository: TaskRepository,
    private readonly productRepository = new ProductRepository(),
    private readonly notificationService?: NotificationService,
    private readonly milestoneRepository?: MilestoneRepository,
    private readonly taskGroupRepository?: TaskGroupRepository,
  ) {}

  private async syncTaskHealthSnapshot<T extends Pick<Task, 'id' | 'status' | 'dueDate' | 'updatedAt' | 'statusChangedAt' | 'checklistCompletionCount' | 'checklistTotalCount' | 'taskHealth'>>(task: T) {
    const evaluatedHealth = evaluateTaskHealth(task)
    if (!areHealthSnapshotsEquivalent(task.taskHealth, evaluatedHealth)) {
      await this.repository.saveHealthSnapshot(task.id, evaluatedHealth)
      return {
        ...task,
        taskHealth: evaluatedHealth,
      }
    }
    return task
  }

  private async listAllTasksWithHealth(filters?: { milestoneId?: string | null }) {
    const items = await this.repository.listAllTasks(filters)
    return Promise.all(items.map((item) => this.syncTaskHealthSnapshot(item)))
  }

  private async listVisibleTasksWithHealth(userId: string, filters?: { milestoneId?: string | null }) {
    const items = await this.repository.listVisibleTasks(userId, filters)
    return Promise.all(items.map((item) => this.syncTaskHealthSnapshot(item)))
  }

  private async getTaskByIdWithHealth(id: string) {
    const item = await this.repository.findById(id)
    if (!item) {
      return null
    }
    return this.syncTaskHealthSnapshot(item)
  }

  async listForUser(userId: string, filters?: { milestoneId?: string | null }) {
    const items = await this.listVisibleTasksWithHealth(userId, filters)
    return taskListResponseSchema.parse({ items } satisfies TaskListResponse)
  }

  async listAll(filters?: { milestoneId?: string | null }) {
    const items = await this.listAllTasksWithHealth(filters)
    return taskListResponseSchema.parse({ items } satisfies TaskListResponse)
  }

  async getInsights(userId: string) {
    const items = await this.listAllTasksWithHealth()
    const today = startOfDay()
    const weekBoundary = addDays(today, 7)
    const finalizedCount = items.filter((item) => item.status === 'finalized').length
    const domainMap = new Map<string, { total: number; atRisk: number }>()
    for (const item of items) {
      const current = domainMap.get(item.taskContext.domain) ?? { total: 0, atRisk: 0 }
      current.total += 1
      if (item.taskHealth.status === 'at_risk') {
        current.atRisk += 1
      }
      domainMap.set(item.taskContext.domain, current)
    }
    const insights = {
      systemStatus: {
        totalTasks: items.length,
        pending: items.filter((item) => item.status === 'pending').length,
        inProgress: items.filter((item) => item.status === 'in_progress').length,
        inReview: items.filter((item) => item.status === 'review').length,
        finalized: finalizedCount,
      },
      ownership: {
        assignedToMe: items.filter((item) => item.assigneeId === userId).length,
        createdByMe: items.filter((item) => item.creatorId === userId).length,
        unassigned: items.filter((item) => !item.assigneeId).length,
      },
      urgency: {
        overdue: items.filter((item) => item.taskHealth.signals.overdue === true).length,
        dueToday: items.filter((item) => {
          const dueDate = parseDate(item.dueDate)
          return dueDate ? dueDate.getTime() === today.getTime() : false
        }).length,
        dueThisWeek: items.filter((item) => {
          const dueDate = parseDate(item.dueDate)
          return dueDate ? dueDate >= today && dueDate <= weekBoundary : false
        }).length,
      },
      signals: {
        atRisk: items.filter((item) => item.taskHealth.status === 'at_risk').length,
        stuck: items.filter((item) => item.taskHealth.status === 'stuck').length,
        blocked: items.filter((item) => item.taskHealth.status === 'blocked').length,
        incompleteVerification: items.filter((item) => item.taskHealth.signals.checklistIncomplete === true).length,
        completionRate: items.length === 0 ? 0 : finalizedCount / items.length,
      },
      domains: [...domainMap.entries()]
        .map(([domain, value]) => ({ domain, total: value.total, atRisk: value.atRisk }))
        .sort((left, right) => right.total - left.total || left.domain.localeCompare(right.domain))
        .slice(0, 5),
    } satisfies TaskInsights

    return taskInsightsResponseSchema.parse({ insights } satisfies TaskInsightsResponse)
  }

  async getAuditList(filters: {
    templateId?: string | null
    assigneeId?: string | null
    status?: string | null
    verificationState?: string | null
    dateFrom?: string | null
    dateTo?: string | null
  }) {
    const items = (await this.listAllTasksWithHealth()).map(toAuditItem)
    const filteredItems = items.filter((item) => {
      if (filters.templateId && item.templateId !== filters.templateId) {
        return false
      }

      if (filters.assigneeId && item.assigneeId !== filters.assigneeId) {
        return false
      }

      if (filters.status && item.status !== filters.status) {
        return false
      }

      if (filters.verificationState && item.verificationState !== filters.verificationState) {
        return false
      }

      const dueDate = parseDate(item.dueDate)
      const dateFrom = parseDate(filters.dateFrom ?? null)
      const dateTo = parseDate(filters.dateTo ?? null)

      if (dateFrom && (!dueDate || dueDate < dateFrom)) {
        return false
      }

      if (dateTo && (!dueDate || dueDate > dateTo)) {
        return false
      }

      return true
    })

    return taskAuditListResponseSchema.parse({ items: filteredItems } satisfies TaskAuditListResponse)
  }

  async listByEntity(entityType: string, entityId: string) {
    const items = await this.repository.listTasksByEntity(entityType, entityId)
    const syncedItems = await Promise.all(items.map((item) => this.syncTaskHealthSnapshot(item)))
    return taskListResponseSchema.parse({ items: syncedItems } satisfies TaskListResponse)
  }

  async getById(id: string) {
    const item = await this.getTaskByIdWithHealth(id)
    if (!item) {
      throw new ApplicationError('Task not found.', { id }, 404)
    }
    return taskResponseSchema.parse({ item } satisfies TaskResponse)
  }

  async create(actor: AuthUser, payload: unknown) {
    assertBackofficeUser(actor)
    const parsedPayload = taskUpsertPayloadSchema.parse(payload)
    try {
      const validationResult = await this.validateTaskMutation({
        action: 'create',
        actor,
        previousItem: null,
        nextPayload: parsedPayload,
      })
      const item = await this.repository.create(actor.id, parsedPayload, {
        taskContext: validationResult.taskContext,
        taskHealth: validationResult.taskHealth,
        statusChangedAt: validationResult.statusChangedAt,
      })
      await this.notifyOnCreate(item, actor.id)
      return taskResponseSchema.parse({ item } satisfies TaskResponse)
    } catch (error) {
      this.throwPersistenceError(error, 'create')
    }
  }

  async createFromTemplate(actor: AuthUser, payload: unknown) {
    assertBackofficeUser(actor)
    const parsedPayload = payload as {
      templateId: string
      taskGroupId?: string | null
      milestoneId?: string | null
      assigneeId?: string | null
      dueDate?: string | null
      entityType?: TaskUpsertPayload['entityType']
      entityId?: string | null
      entityLabel?: string | null
      title?: string | null
      description?: string | null
      tags?: string[]
      priority?: TaskUpsertPayload['priority']
    }
    const template = await this.repository.findTemplateById(parsedPayload.templateId)
    if (!template) {
      throw new ApplicationError('Task template not found.', { templateId: parsedPayload.templateId }, 404)
    }

    const nextPayload = taskUpsertPayloadSchema.parse({
      title: parsedPayload.title?.trim() || template.titleTemplate,
      description: parsedPayload.description ?? template.descriptionTemplate,
      status: 'pending',
      priority: parsedPayload.priority ?? template.defaultPriority,
      tags: parsedPayload.tags?.length ? parsedPayload.tags : template.defaultTags,
      taskGroupId: parsedPayload.taskGroupId ?? null,
      milestoneId: parsedPayload.milestoneId ?? null,
      scopeType: template.scopeType,
      entityType: parsedPayload.entityType ?? (template.scopeType === 'general' ? null : template.scopeType),
      entityId: parsedPayload.entityId ?? null,
      entityLabel: parsedPayload.entityLabel ?? null,
      templateId: template.id,
      assigneeId: parsedPayload.assigneeId ?? null,
      dueDate: parsedPayload.dueDate ?? null,
      checklistItems: template.checklistItems.map((item) => ({
        id: randomUUID(),
        label: item.label,
        isChecked: false,
        note: null,
      })),
    })

    return this.create(actor, nextPayload)
  }

  async createBulkFromTemplate(actor: AuthUser, payload: unknown) {
    assertBackofficeUser(actor)
    const parsedPayload = taskBulkCreatePayloadSchema.parse(payload)
    const uniqueEntityIds = [...new Set(parsedPayload.entityIds)]
    const createdItems = []

    for (const entityId of uniqueEntityIds) {
      const entityLabel = await this.resolveEntityLabel(parsedPayload.entityType, entityId)
      const item = await this.createFromTemplate(actor, {
        templateId: parsedPayload.templateId,
        assigneeId:
          parsedPayload.assigneeMode === 'specific'
            ? parsedPayload.assigneeId ?? null
            : parsedPayload.assigneeMode === 'self'
              ? actor.id
              : null,
        dueDate: parsedPayload.dueDate ?? null,
        entityType: parsedPayload.entityType,
        entityId,
        entityLabel,
        taskGroupId: parsedPayload.taskGroupId ?? null,
        milestoneId: parsedPayload.milestoneId,
        tags: parsedPayload.tags,
        priority: parsedPayload.priority,
      })
      createdItems.push(item.item)
    }

    return taskBulkCreateResponseSchema.parse({
      items: createdItems,
      createdCount: createdItems.length,
    } satisfies TaskBulkCreateResponse)
  }

  async update(id: string, actor: AuthUser, payload: unknown) {
    assertBackofficeUser(actor)
    const parsedPayload = taskUpsertPayloadSchema.parse(payload)
    try {
      const previousItem = await this.getTaskByIdWithHealth(id)
      if (!previousItem) {
        throw new ApplicationError('Task not found.', { id }, 404)
      }
      if (previousItem.status === 'finalized') {
        if (isMutationEquivalent(previousItem, parsedPayload)) {
          return taskResponseSchema.parse({ item: previousItem } satisfies TaskResponse)
        }
        throw new ApplicationError('Finalized tasks are immutable.', { id }, 400)
      }

      const validationResult = await this.validateTaskMutation({
        action: 'update',
        actor,
        previousItem,
        nextPayload: parsedPayload,
      })
      const item = await this.repository.update(
        id,
        actor.id,
        parsedPayload,
        validationResult.reviewState,
        validationResult.activityEntries,
        {
          taskContext: validationResult.taskContext,
          taskHealth: validationResult.taskHealth,
          statusChangedAt: validationResult.statusChangedAt,
        },
      )
      await this.notificationService?.markReadByTask(actor.id, id)
      await this.notifyOnUpdate(previousItem, item, actor.id)
      return taskResponseSchema.parse({ item } satisfies TaskResponse)
    } catch (error) {
      this.throwPersistenceError(error, 'update', id)
    }
  }

  async finalize(id: string, actor: AuthUser) {
    assertBackofficeUser(actor)
    const existingTask = await this.repository.findById(id)
    if (!existingTask) {
      throw new ApplicationError('Task not found.', { id }, 404)
    }
    if (existingTask.status === 'finalized') {
      return taskResponseSchema.parse({ item: existingTask } satisfies TaskResponse)
    }

    return this.update(id, actor, {
      ...toTaskUpsertPayload(existingTask),
      status: 'finalized',
    })
  }

  async addActivity(id: string, authorId: string, payload: unknown) {
    const parsedPayload = taskActivityInputSchema.parse(payload)
    try {
      const item = await this.repository.addActivity(id, authorId, parsedPayload.activityType, parsedPayload.content)
      return taskResponseSchema.parse({ item } satisfies TaskResponse)
    } catch (error) {
      this.throwPersistenceError(error, 'update', id)
    }
  }

  async listTemplates(scopeType?: string | null) {
    const items = await this.repository.listTemplates(scopeType)
    return taskTemplateListResponseSchema.parse({ items } satisfies TaskTemplateListResponse)
  }

  async getTemplateById(id: string) {
    const item = await this.repository.findTemplateById(id)
    if (!item) {
      throw new ApplicationError('Task template not found.', { id }, 404)
    }
    return taskTemplateResponseSchema.parse({ item } satisfies TaskTemplateResponse)
  }

  async createTemplate(payload: unknown) {
    const parsedPayload = taskTemplateUpsertPayloadSchema.parse(payload)
    try {
      const item = await this.repository.createTemplate(parsedPayload)
      return taskTemplateResponseSchema.parse({ item } satisfies TaskTemplateResponse)
    } catch (error) {
      this.throwPersistenceError(error, 'create')
    }
  }

  async updateTemplate(id: string, payload: unknown) {
    const parsedPayload = taskTemplateUpsertPayloadSchema.parse(payload)
    try {
      const item = await this.repository.updateTemplate(id, parsedPayload)
      return taskTemplateResponseSchema.parse({ item } satisfies TaskTemplateResponse)
    } catch (error) {
      this.throwPersistenceError(error, 'update', id)
    }
  }

  private async validateTaskMutation(input: {
    action: TaskMutationAction
    actor: AuthUser
    previousItem: Task | null
    nextPayload: TaskUpsertPayload
  }) {
    const { action, actor, previousItem, nextPayload } = input
    assertBackofficeUser(actor)
    const evaluationTime = new Date()

    if (nextPayload.templateId) {
      const template = await this.repository.findTemplateById(nextPayload.templateId)
      if (!template) {
        throw new ApplicationError('Task template not found.', { templateId: nextPayload.templateId }, 404)
      }
    }

    if (nextPayload.milestoneId) {
      const milestone = await this.milestoneRepository?.findById(nextPayload.milestoneId)
      if (!milestone) {
        throw new ApplicationError('Milestone not found.', { milestoneId: nextPayload.milestoneId }, 404)
      }
    }

    if (nextPayload.taskGroupId) {
      const taskGroup = await this.taskGroupRepository?.findById(nextPayload.taskGroupId)
      if (!taskGroup) {
        throw new ApplicationError('Task group not found.', { taskGroupId: nextPayload.taskGroupId }, 404)
      }
    }

    if (action === 'create') {
      if (!canAssignTasks(actor) && nextPayload.assigneeId && nextPayload.assigneeId !== actor.id) {
        throw new ApplicationError('Permission denied to assign tasks to other users.', { assigneeId: nextPayload.assigneeId }, 403)
      }
      if (nextPayload.status !== 'pending' && nextPayload.status !== 'in_progress') {
        throw new ApplicationError(
          'New tasks can only start in pending or in progress.',
          { status: nextPayload.status },
          400,
        )
      }
      const checklistCompletionCount = nextPayload.checklistItems.filter((item) => item.isChecked).length
      const checklistTotalCount = nextPayload.checklistItems.length
      const taskContext = resolveTaskContext({
        title: nextPayload.title,
        scopeType: nextPayload.scopeType,
        tags: nextPayload.tags,
        checklistTotalCount,
        taskContext: nextPayload.taskContext,
      })
      return {
        reviewState: {
          reviewAssignedTo: null,
          reviewedBy: null,
          reviewedAt: null,
          reviewComment: null,
        },
        activityEntries: [],
        taskContext,
        taskHealth: evaluateTaskHealth({
          status: nextPayload.status,
          dueDate: nextPayload.dueDate,
          updatedAt: evaluationTime.toISOString(),
          statusChangedAt: evaluationTime.toISOString(),
          checklistCompletionCount,
          checklistTotalCount,
          now: evaluationTime,
        }),
        statusChangedAt: evaluationTime,
      }
    }

    if (!previousItem) {
      throw new ApplicationError('Task not found.', {}, 404)
    }

    validateStatusTransition(previousItem.status, nextPayload.status)

    if (previousItem.assigneeId !== nextPayload.assigneeId) {
      const isSelfAssignment = nextPayload.assigneeId === actor.id && !previousItem.assigneeId
      if (!canAssignTasks(actor) && !isSelfAssignment) {
        throw new ApplicationError('Permission denied to assign or reassign tasks.', { actorId: actor.id }, 403)
      }
    }

    if (nextPayload.status === 'review' && !nextPayload.assigneeId) {
      throw new ApplicationError('Cannot move to review without assignee.', {}, 400)
    }

    if (previousItem.status !== 'review' && nextPayload.status === 'review' && !previousItem.reviewAssignedTo) {
      if (previousItem.creatorId === actor.id && !canFinalizeTasks(actor)) {
        throw new ApplicationError(
          'Cannot move to review because no eligible reviewer is assigned.',
          { taskId: previousItem.id },
          400,
        )
      }
    }

    const nextChecklistState = new Map(previousItem.checklistItems.map((item) => [item.id, item.isChecked]))
    for (const item of nextPayload.checklistItems) {
      nextChecklistState.set(item.id, item.isChecked)
    }
    const nextChecklistCompletionCount = Array.from(nextChecklistState.values()).filter(Boolean).length
    const nextChecklistTotalCount = nextChecklistState.size
    const taskContext = resolveTaskContext({
      title: nextPayload.title,
      scopeType: nextPayload.scopeType,
      tags: nextPayload.tags,
      checklistTotalCount: nextChecklistTotalCount,
      taskContext: nextPayload.taskContext ?? previousItem.taskContext,
    })
    const statusChangedAt = previousItem.status === nextPayload.status
      ? parseDate(previousItem.statusChangedAt) ?? evaluationTime
      : evaluationTime
    const activityEntries: Array<{ activityType: Task['activities'][number]['activityType']; content: string }> = []

    if (previousItem.status !== nextPayload.status) {
      activityEntries.push({
        activityType: 'status_change',
        content: `Status changed from ${previousItem.status} to ${nextPayload.status}`,
      })
    }

    if (previousItem.assigneeId !== nextPayload.assigneeId) {
      activityEntries.push({
        activityType: 'assignment',
        content: nextPayload.assigneeId
          ? `Assignee changed from ${previousItem.assigneeName ?? 'Unassigned'} to ${nextPayload.assigneeId === actor.id ? actor.displayName : 'another user'}`
          : `Assignee cleared from ${previousItem.assigneeName ?? 'Unassigned'}`,
      })
    }

    if (nextChecklistCompletionCount !== previousItem.checklistCompletionCount) {
      activityEntries.push({
        activityType: 'checklist',
        content: `Checklist progress changed from ${previousItem.checklistCompletionCount}/${previousItem.checklistTotalCount} to ${nextChecklistCompletionCount}/${nextChecklistTotalCount}`,
      })
    }

    if (nextPayload.status === 'finalized') {
      if (!canFinalizeTasks(actor)) {
        throw new ApplicationError('Permission denied to finalize tasks.', { actorId: actor.id }, 403)
      }
      if (!previousItem.reviewAssignedTo) {
        throw new ApplicationError('Task has no assigned reviewer.', { taskId: previousItem.id }, 400)
      }
      if (previousItem.reviewAssignedTo !== actor.id) {
        throw new ApplicationError('Only the assigned reviewer can finalize this task.', { reviewerId: previousItem.reviewAssignedTo }, 403)
      }

      if (!isChecklistComplete(nextChecklistCompletionCount, nextChecklistTotalCount)) {
        throw new ApplicationError(
          'Cannot finalize: checklist incomplete.',
          { completionCount: nextChecklistCompletionCount, totalCount: nextChecklistTotalCount },
          400,
        )
      }

      activityEntries.push({
        activityType: 'reviewed',
        content: `Task approved and finalized by ${actor.displayName}`,
      })

      return {
        reviewState: {
          reviewAssignedTo: previousItem.reviewAssignedTo,
          reviewedBy: actor.id,
          reviewedAt: new Date(),
          reviewComment: nextPayload.reviewComment ?? previousItem.reviewComment,
        },
        activityEntries,
        taskContext,
        taskHealth: evaluateTaskHealth({
          status: nextPayload.status,
          dueDate: nextPayload.dueDate,
          updatedAt: evaluationTime.toISOString(),
          statusChangedAt: statusChangedAt.toISOString(),
          checklistCompletionCount: nextChecklistCompletionCount,
          checklistTotalCount: nextChecklistTotalCount,
          now: evaluationTime,
        }),
        statusChangedAt,
      }
    }

    if (previousItem.status === 'review' && nextPayload.status === 'in_progress') {
      if (!canFinalizeTasks(actor)) {
        throw new ApplicationError('Permission denied to reject reviewed tasks.', { actorId: actor.id }, 403)
      }
      if (!previousItem.reviewAssignedTo || previousItem.reviewAssignedTo !== actor.id) {
        throw new ApplicationError('Only the assigned reviewer can reject this task.', { reviewerId: previousItem.reviewAssignedTo }, 403)
      }
      activityEntries.push({
        activityType: 'reviewed',
        content: `Task sent back to in progress by ${actor.displayName}`,
      })
      return {
        reviewState: {
          reviewAssignedTo: null,
          reviewedBy: null,
          reviewedAt: null,
          reviewComment: null,
        },
        activityEntries,
        taskContext,
        taskHealth: evaluateTaskHealth({
          status: nextPayload.status,
          dueDate: nextPayload.dueDate,
          updatedAt: evaluationTime.toISOString(),
          statusChangedAt: statusChangedAt.toISOString(),
          checklistCompletionCount: nextChecklistCompletionCount,
          checklistTotalCount: nextChecklistTotalCount,
          now: evaluationTime,
        }),
        statusChangedAt,
      }
    }

    return {
      reviewState: {
        reviewAssignedTo: nextPayload.status === 'review'
          ? previousItem.reviewAssignedTo ?? previousItem.creatorId
          : previousItem.reviewAssignedTo,
        reviewedBy: previousItem.reviewedBy,
        reviewedAt: previousItem.reviewedAt ? new Date(previousItem.reviewedAt) : null,
        reviewComment: previousItem.reviewComment,
      },
      activityEntries,
      taskContext,
      taskHealth: evaluateTaskHealth({
        status: nextPayload.status,
        dueDate: nextPayload.dueDate,
        updatedAt: evaluationTime.toISOString(),
        statusChangedAt: statusChangedAt.toISOString(),
        checklistCompletionCount: nextChecklistCompletionCount,
        checklistTotalCount: nextChecklistTotalCount,
        now: evaluationTime,
      }),
      statusChangedAt,
    }
  }

  private async resolveEntityLabel(entityType: TaskUpsertPayload['entityType'], entityId: string) {
    if (entityType === 'product') {
      const product = await this.productRepository.findById(entityId)
      if (!product) {
        throw new ApplicationError('Product not found for bulk task creation.', { entityId }, 404)
      }
      return product.name
    }

    return entityId
  }

  private async notifyOnCreate(item: TaskResponse['item'], actorId: string) {
    if (!this.notificationService || !item.assigneeId || item.assigneeId === actorId) {
      return
    }

    await this.notificationService.createNotification({
      userId: item.assigneeId,
      type: 'task_assigned',
      title: `Task assigned: ${item.title}`,
      message: `Open the task and start work on ${item.title}.`,
      entityType: item.entityType,
      entityId: item.entityId,
      taskId: item.id,
    })
  }

  private async notifyOnUpdate(previousItem: TaskResponse['item'], nextItem: TaskResponse['item'], actorId: string) {
    if (!this.notificationService) {
      return
    }

    if (previousItem.assigneeId !== nextItem.assigneeId && nextItem.assigneeId && nextItem.assigneeId !== actorId) {
      await this.notificationService.createNotification({
        userId: nextItem.assigneeId,
        type: 'task_assigned',
        title: `Task assigned: ${nextItem.title}`,
        message: `You were assigned ${nextItem.title}. Open the task and continue execution.`,
        entityType: nextItem.entityType,
        entityId: nextItem.entityId,
        taskId: nextItem.id,
      })
    }

    if (previousItem.status !== nextItem.status && nextItem.status === 'review' && nextItem.creatorId !== actorId) {
      await this.notificationService.createNotification({
        userId: nextItem.creatorId,
        type: 'task_review_requested',
        title: `Task moved to review: ${nextItem.title}`,
        message: `Review the task and confirm the submitted work for ${nextItem.title}.`,
        entityType: nextItem.entityType,
        entityId: nextItem.entityId,
        taskId: nextItem.id,
      })
    }
  }

  private throwPersistenceError(error: unknown, action: 'create' | 'update' | 'deactivate' | 'restore', id?: string): never {
    if (error instanceof ApplicationError) {
      throw error
    }

    const persistenceError = error as PersistenceError
    throw new ApplicationError(
      'Failed to persist task data.',
      { action, id: id ?? 'new', detail: persistenceError.sqlMessage ?? persistenceError.message ?? 'unknown persistence error' },
      500,
    )
  }
}
