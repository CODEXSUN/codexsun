import type { Kysely } from "kysely"

import type {
  CrmAuditEvent,
  CrmFollowUpTask,
  CrmOverviewMetrics,
  CrmReminder,
  CrmReminderStatus,
  CrmTaskAssignment,
  CrmTaskPriority,
  CrmTaskStatus,
} from "../../shared/crm.js"
import { crmTableNames } from "../../database/table-names.js"
import { asQueryDatabase } from "../data/query-database.js"

type ActorContext = {
  userId?: string | null
  displayName?: string | null
}

type CreateCrmFollowUpTaskInput = {
  leadId: string
  interactionId?: string | null
  title: string
  description?: string | null
  assigneeUserId?: string | null
  assigneeName?: string | null
  dueAt?: string | null
  reminderAt?: string | null
  priority?: CrmTaskPriority
  sourceType?: string
  createdByUserId: string
  actor?: ActorContext
}

type UpdateCrmTaskStatusInput = {
  crmTaskId: string
  status: CrmTaskStatus
  note?: string | null
  actor?: ActorContext
}

type UpdateCrmReminderInput = {
  reminderId: string
  status: Exclude<CrmReminderStatus, "overdue">
  snoozedUntil?: string | null
  note?: string | null
  actor?: ActorContext
}

type AssignCrmTaskInput = {
  crmTaskId: string
  assigneeUserId?: string | null
  assigneeName?: string | null
  reason?: string | null
  actor?: ActorContext
}

export async function listCrmFollowUpTasks(
  database: Kysely<unknown>,
  filters?: { leadId?: string; assigneeUserId?: string; status?: string }
) {
  let query = asQueryDatabase(database)
    .selectFrom(crmTableNames.followUpTasks)
    .selectAll()

  if (filters?.leadId) {
    query = query.where("lead_id", "=", filters.leadId)
  }
  if (filters?.assigneeUserId) {
    query = query.where("assignee_user_id", "=", filters.assigneeUserId)
  }
  if (filters?.status) {
    query = query.where("status", "=", filters.status)
  }

  return query.orderBy("due_at", "asc").orderBy("created_at", "desc").execute() as Promise<
    CrmFollowUpTask[]
  >
}

export async function listCrmTaskAssignments(
  database: Kysely<unknown>,
  filters?: { leadId?: string; crmTaskId?: string }
) {
  let query = asQueryDatabase(database)
    .selectFrom(crmTableNames.taskAssignments)
    .selectAll()

  if (filters?.leadId) {
    query = query.where("lead_id", "=", filters.leadId)
  }
  if (filters?.crmTaskId) {
    query = query.where("crm_task_id", "=", filters.crmTaskId)
  }

  return query.orderBy("assigned_at", "desc").execute() as Promise<CrmTaskAssignment[]>
}

export async function listCrmReminders(
  database: Kysely<unknown>,
  filters?: { leadId?: string; crmTaskId?: string; status?: string }
) {
  const now = new Date().toISOString()
  const db = asQueryDatabase(database)

  await db
    .updateTable(crmTableNames.reminders)
    .set({
      status: "overdue",
      updated_at: now,
    })
    .where("status", "in", ["pending", "snoozed"] as readonly string[])
    .where("remind_at", "<", now)
    .execute()

  let query = db.selectFrom(crmTableNames.reminders).selectAll()

  if (filters?.leadId) {
    query = query.where("lead_id", "=", filters.leadId)
  }
  if (filters?.crmTaskId) {
    query = query.where("crm_task_id", "=", filters.crmTaskId)
  }
  if (filters?.status) {
    query = query.where("status", "=", filters.status)
  }

  return query.orderBy("remind_at", "asc").execute() as Promise<CrmReminder[]>
}

export async function listCrmAuditEvents(
  database: Kysely<unknown>,
  filters?: { leadId?: string; crmTaskId?: string; interactionId?: string }
) {
  let query = asQueryDatabase(database)
    .selectFrom(crmTableNames.auditEvents)
    .selectAll()

  if (filters?.leadId) {
    query = query.where("lead_id", "=", filters.leadId)
  }
  if (filters?.crmTaskId) {
    query = query.where("crm_task_id", "=", filters.crmTaskId)
  }
  if (filters?.interactionId) {
    query = query.where("interaction_id", "=", filters.interactionId)
  }

  return query.orderBy("created_at", "desc").execute() as Promise<CrmAuditEvent[]>
}

async function insertCrmTaskAssignment(
  database: Kysely<unknown>,
  input: {
    crmTaskId: string
    leadId: string
    interactionId?: string | null
    fromAssigneeUserId?: string | null
    fromAssigneeName?: string | null
    toAssigneeUserId?: string | null
    toAssigneeName?: string | null
    reason?: string | null
    actor?: ActorContext
    assignedAt?: string
  }
) {
  const assignedAt = input.assignedAt ?? new Date().toISOString()
  const assignmentId = `crm-assignment-${Date.now()}-${Math.round(Math.random() * 1000)}`

  await asQueryDatabase(database)
    .insertInto(crmTableNames.taskAssignments)
    .values({
      assignment_id: assignmentId,
      crm_task_id: input.crmTaskId,
      lead_id: input.leadId,
      interaction_id: input.interactionId ?? null,
      from_assignee_user_id: input.fromAssigneeUserId ?? null,
      from_assignee_name: input.fromAssigneeName ?? null,
      to_assignee_user_id: input.toAssigneeUserId ?? null,
      to_assignee_name: input.toAssigneeName ?? null,
      reason: input.reason ?? null,
      assigned_by_user_id: input.actor?.userId ?? null,
      assigned_by_name: input.actor?.displayName ?? null,
      assigned_at: assignedAt,
    } as Record<string, unknown>)
    .execute()

  return assignmentId
}

export async function createCrmFollowUpTask(
  database: Kysely<unknown>,
  input: CreateCrmFollowUpTaskInput
) {
  const db = asQueryDatabase(database)
  const now = new Date().toISOString()
  const crmTaskId = `crm-task-${Date.now()}`
  const reminderId = input.reminderAt ? `crm-reminder-${Date.now()}` : null

  await db
    .insertInto(crmTableNames.followUpTasks)
    .values({
      crm_task_id: crmTaskId,
      lead_id: input.leadId,
      interaction_id: input.interactionId ?? null,
      title: input.title,
      description: input.description ?? null,
      status: "open",
      priority: input.priority ?? "medium",
      source_type: input.sourceType ?? "interaction_followup",
      assignee_user_id: input.assigneeUserId ?? null,
      assignee_name: input.assigneeName ?? null,
      created_by_user_id: input.createdByUserId,
      due_at: input.dueAt ?? null,
      completed_at: null,
      revoked_at: null,
      closed_note: null,
      created_at: now,
      updated_at: now,
    } as Record<string, unknown>)
    .execute()

  await recordCrmAuditEvent(database, {
    entityType: "crm_task",
    entityId: crmTaskId,
    leadId: input.leadId,
    interactionId: input.interactionId ?? null,
    crmTaskId,
    action: "crm_task_created",
    summary: `Created CRM follow-up task: ${input.title}`,
    actor: input.actor,
    metadata: {
      dueAt: input.dueAt ?? null,
      assigneeUserId: input.assigneeUserId ?? null,
      priority: input.priority ?? "medium",
    },
  })

  if (input.assigneeUserId || input.assigneeName) {
    await insertCrmTaskAssignment(database, {
      crmTaskId,
      leadId: input.leadId,
      interactionId: input.interactionId ?? null,
      toAssigneeUserId: input.assigneeUserId ?? null,
      toAssigneeName: input.assigneeName ?? null,
      reason: input.sourceType ?? "interaction_followup",
      actor: input.actor,
      assignedAt: now,
    })
  }

  if (input.reminderAt) {
    await db
      .insertInto(crmTableNames.reminders)
      .values({
        reminder_id: reminderId,
        crm_task_id: crmTaskId,
        lead_id: input.leadId,
        status: "pending",
        remind_at: input.reminderAt,
        snoozed_until: null,
        completed_at: null,
        revoked_at: null,
        note: null,
        created_at: now,
        updated_at: now,
      } as Record<string, unknown>)
      .execute()

    await recordCrmAuditEvent(database, {
      entityType: "crm_reminder",
      entityId: reminderId!,
      leadId: input.leadId,
      interactionId: input.interactionId ?? null,
      crmTaskId,
      reminderId: reminderId!,
      action: "crm_reminder_created",
      summary: `Created reminder for CRM task: ${input.title}`,
      actor: input.actor,
      metadata: {
        remindAt: input.reminderAt,
      },
    })
  }

  return {
    crmTaskId,
    reminderId,
  }
}

export async function assignCrmTask(
  database: Kysely<unknown>,
  input: AssignCrmTaskInput
) {
  const db = asQueryDatabase(database)
  const now = new Date().toISOString()
  const task = (await db
    .selectFrom(crmTableNames.followUpTasks)
    .selectAll()
    .where("crm_task_id", "=", input.crmTaskId)
    .executeTakeFirst()) as CrmFollowUpTask | undefined

  if (!task) {
    throw new Error("CRM task not found")
  }

  const nextAssigneeUserId = input.assigneeUserId ?? null
  const nextAssigneeName = input.assigneeName ?? null
  const previousAssigneeUserId = task.assignee_user_id ?? null
  const previousAssigneeName = task.assignee_name ?? null
  const assignmentChanged =
    previousAssigneeUserId !== nextAssigneeUserId || previousAssigneeName !== nextAssigneeName

  if (!assignmentChanged) {
    return {
      assignmentId: null,
      changed: false,
    }
  }

  await db
    .updateTable(crmTableNames.followUpTasks)
    .set({
      assignee_user_id: nextAssigneeUserId,
      assignee_name: nextAssigneeName,
      updated_at: now,
    })
    .where("crm_task_id", "=", input.crmTaskId)
    .execute()

  const assignmentId = await insertCrmTaskAssignment(database, {
    crmTaskId: input.crmTaskId,
    leadId: task.lead_id,
    interactionId: task.interaction_id,
    fromAssigneeUserId: previousAssigneeUserId,
    fromAssigneeName: previousAssigneeName,
    toAssigneeUserId: nextAssigneeUserId,
    toAssigneeName: nextAssigneeName,
    reason: input.reason ?? null,
    actor: input.actor,
    assignedAt: now,
  })

  const action =
    previousAssigneeUserId || previousAssigneeName ? "crm_task_reassigned" : "crm_task_assigned"
  const summary =
    previousAssigneeUserId || previousAssigneeName
      ? `CRM task reassigned: ${task.title}`
      : `CRM task assigned: ${task.title}`

  await recordCrmAuditEvent(database, {
    entityType: "crm_task",
    entityId: input.crmTaskId,
    leadId: task.lead_id,
    interactionId: task.interaction_id,
    crmTaskId: input.crmTaskId,
    action,
    summary,
    actor: input.actor,
    metadata: {
      reason: input.reason ?? null,
      fromAssigneeUserId: previousAssigneeUserId,
      fromAssigneeName: previousAssigneeName,
      toAssigneeUserId: nextAssigneeUserId,
      toAssigneeName: nextAssigneeName,
    },
  })

  return {
    assignmentId,
    changed: true,
  }
}

export async function updateCrmTaskStatus(
  database: Kysely<unknown>,
  input: UpdateCrmTaskStatusInput
) {
  const db = asQueryDatabase(database)
  const now = new Date().toISOString()
  const task = (await db
    .selectFrom(crmTableNames.followUpTasks)
    .selectAll()
    .where("crm_task_id", "=", input.crmTaskId)
    .executeTakeFirst()) as CrmFollowUpTask | undefined

  if (!task) {
    throw new Error("CRM task not found")
  }

  await db
    .updateTable(crmTableNames.followUpTasks)
    .set({
      status: input.status,
      closed_note: input.note ?? task.closed_note,
      completed_at: input.status === "completed" ? now : null,
      revoked_at: input.status === "revoked" ? now : null,
      updated_at: now,
    })
    .where("crm_task_id", "=", input.crmTaskId)
    .execute()

  if (input.status === "completed" || input.status === "revoked") {
    await db
      .updateTable(crmTableNames.reminders)
      .set({
        status: input.status === "completed" ? "completed" : "revoked",
        completed_at: input.status === "completed" ? now : null,
        revoked_at: input.status === "revoked" ? now : null,
        updated_at: now,
      })
      .where("crm_task_id", "=", input.crmTaskId)
      .where("status", "in", ["pending", "snoozed", "overdue"] as readonly string[])
      .execute()
  }

  await recordCrmAuditEvent(database, {
    entityType: "crm_task",
    entityId: input.crmTaskId,
    leadId: task.lead_id,
    interactionId: task.interaction_id,
    crmTaskId: input.crmTaskId,
    action: `crm_task_${input.status}`,
    summary: `CRM task ${input.status.replace("_", " ")}: ${task.title}`,
    actor: input.actor,
    metadata: {
      note: input.note ?? null,
    },
  })
}

export async function updateCrmReminder(
  database: Kysely<unknown>,
  input: UpdateCrmReminderInput
) {
  const db = asQueryDatabase(database)
  const now = new Date().toISOString()
  const reminder = (await db
    .selectFrom(crmTableNames.reminders)
    .selectAll()
    .where("reminder_id", "=", input.reminderId)
    .executeTakeFirst()) as CrmReminder | undefined

  if (!reminder) {
    throw new Error("CRM reminder not found")
  }

  const nextRemindAt =
    input.status === "snoozed" && input.snoozedUntil ? input.snoozedUntil : reminder.remind_at

  await db
    .updateTable(crmTableNames.reminders)
    .set({
      status: input.status,
      remind_at: nextRemindAt,
      snoozed_until: input.status === "snoozed" ? input.snoozedUntil ?? reminder.snoozed_until : null,
      completed_at: input.status === "completed" ? now : null,
      revoked_at: input.status === "revoked" ? now : null,
      note: input.note ?? reminder.note,
      updated_at: now,
    })
    .where("reminder_id", "=", input.reminderId)
    .execute()

  await recordCrmAuditEvent(database, {
    entityType: "crm_reminder",
    entityId: input.reminderId,
    leadId: reminder.lead_id,
    crmTaskId: reminder.crm_task_id,
    reminderId: input.reminderId,
    action: `crm_reminder_${input.status}`,
    summary: `CRM reminder ${input.status.replace("_", " ")}`,
    actor: input.actor,
    metadata: {
      snoozedUntil: input.snoozedUntil ?? null,
      note: input.note ?? null,
    },
  })
}

export async function getCrmOverviewMetrics(database: Kysely<unknown>) {
  const db = asQueryDatabase(database)
  const now = new Date().toISOString()
  const dayEnd = new Date()
  dayEnd.setHours(23, 59, 59, 999)
  const todayEndIso = dayEnd.toISOString()

  const [leadCountRow, openTaskRow, dueTodayRow, overdueReminderRow, completedTaskRow] =
    await Promise.all([
      db.selectFrom(crmTableNames.leadHeaders).select((eb) => eb.fn.countAll().as("count")).executeTakeFirst(),
      db
        .selectFrom(crmTableNames.followUpTasks)
        .select((eb) => eb.fn.countAll().as("count"))
        .where("status", "in", ["open", "in_progress"] as readonly string[])
        .executeTakeFirst(),
      db
        .selectFrom(crmTableNames.followUpTasks)
        .select((eb) => eb.fn.countAll().as("count"))
        .where("status", "in", ["open", "in_progress"] as readonly string[])
        .where("due_at", "<=", todayEndIso)
        .executeTakeFirst(),
      db
        .selectFrom(crmTableNames.reminders)
        .select((eb) => eb.fn.countAll().as("count"))
        .where("status", "=", "overdue")
        .where("remind_at", "<", now)
        .executeTakeFirst(),
      db
        .selectFrom(crmTableNames.followUpTasks)
        .select((eb) => eb.fn.countAll().as("count"))
        .where("status", "=", "completed")
        .executeTakeFirst(),
    ])

  return {
    totalLeads: Number(leadCountRow?.count ?? 0),
    openTasks: Number(openTaskRow?.count ?? 0),
    dueTodayTasks: Number(dueTodayRow?.count ?? 0),
    overdueReminders: Number(overdueReminderRow?.count ?? 0),
    completedTasks: Number(completedTaskRow?.count ?? 0),
  } satisfies CrmOverviewMetrics
}

type RecordCrmAuditEventInput = {
  entityType: string
  entityId: string
  leadId?: string | null
  interactionId?: string | null
  crmTaskId?: string | null
  reminderId?: string | null
  action: string
  summary?: string | null
  actor?: ActorContext
  metadata?: Record<string, unknown> | null
}

export async function recordCrmAuditEvent(
  database: Kysely<unknown>,
  input: RecordCrmAuditEventInput
) {
  await asQueryDatabase(database)
    .insertInto(crmTableNames.auditEvents)
    .values({
      audit_event_id: `crm-audit-${Date.now()}-${Math.round(Math.random() * 1000)}`,
      entity_type: input.entityType,
      entity_id: input.entityId,
      lead_id: input.leadId ?? null,
      interaction_id: input.interactionId ?? null,
      crm_task_id: input.crmTaskId ?? null,
      reminder_id: input.reminderId ?? null,
      action: input.action,
      actor_user_id: input.actor?.userId ?? null,
      actor_display_name: input.actor?.displayName ?? null,
      summary: input.summary ?? null,
      metadata_json: input.metadata ? JSON.stringify(input.metadata) : null,
      created_at: new Date().toISOString(),
    } as Record<string, unknown>)
    .execute()
}
