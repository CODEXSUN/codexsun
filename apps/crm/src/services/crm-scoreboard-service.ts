import type { Kysely } from "kysely"

import type {
  CrmAuditEvent,
  CrmFollowUpTask,
  CrmInteractionHeader,
  CrmLeadHeader,
  CrmLeadScore,
  CrmOwnerLeaderboardRow,
  CrmReminder,
  CrmScoreboard,
  CrmTaskAssignment,
} from "../../shared/crm.js"
import {
  listCrmAuditEvents,
  listCrmFollowUpTasks,
  listCrmReminders,
  listCrmTaskAssignments,
} from "./crm-follow-up-service.js"
import { listInteractionHeaders, listLeadHeaders } from "./crm-repository.js"

const statusBaseScores: Record<string, number> = {
  Cold: 20,
  Warm: 45,
  Qualified: 70,
  Converted: 100,
  Lost: 5,
}

function clampScore(value: number) {
  return Math.max(0, Math.min(100, Math.round(value)))
}

function average(items: number[]) {
  if (items.length === 0) {
    return 0
  }

  return Math.round(items.reduce((total, item) => total + item, 0) / items.length)
}

function isOpenTask(task: CrmFollowUpTask) {
  return task.status === "open" || task.status === "in_progress"
}

function isCompletedTask(task: CrmFollowUpTask) {
  return task.status === "completed"
}

function buildLeadReasons(input: {
  lead: CrmLeadHeader
  interactionCount: number
  completedTaskCount: number
  openTaskCount: number
  overdueReminderCount: number
}) {
  const reasons: string[] = [`Pipeline status: ${input.lead.status}`]

  if (input.interactionCount > 0) {
    reasons.push(`${input.interactionCount} interaction${input.interactionCount === 1 ? "" : "s"} recorded`)
  }
  if (input.completedTaskCount > 0) {
    reasons.push(`${input.completedTaskCount} completed follow-up task${input.completedTaskCount === 1 ? "" : "s"}`)
  }
  if (input.openTaskCount > 0) {
    reasons.push(`${input.openTaskCount} open follow-up task${input.openTaskCount === 1 ? "" : "s"}`)
  }
  if (input.overdueReminderCount > 0) {
    reasons.push(`${input.overdueReminderCount} overdue reminder${input.overdueReminderCount === 1 ? "" : "s"}`)
  }

  return reasons
}

function scoreLead(input: {
  lead: CrmLeadHeader
  interactions: CrmInteractionHeader[]
  tasks: CrmFollowUpTask[]
  reminders: CrmReminder[]
}): CrmLeadScore {
  const openTaskCount = input.tasks.filter(isOpenTask).length
  const completedTaskCount = input.tasks.filter(isCompletedTask).length
  const revokedTaskCount = input.tasks.filter((item) => item.status === "revoked").length
  const overdueReminderCount = input.reminders.filter((item) => item.status === "overdue").length
  const latestInteractionAt = input.interactions[0]?.interaction_date ?? null

  const leadScore = clampScore(
    (statusBaseScores[input.lead.status] ?? 20) +
      input.interactions.length * 8 +
      completedTaskCount * 10 +
      openTaskCount * 4 -
      overdueReminderCount * 15 -
      revokedTaskCount * 10
  )
  const engagementScore = clampScore(
    input.interactions.length * 15 + completedTaskCount * 8 + openTaskCount * 5
  )
  const riskScore = clampScore(overdueReminderCount * 30 + revokedTaskCount * 15 + openTaskCount * 5)

  return {
    leadId: input.lead.lead_id,
    companyName: input.lead.company_name,
    contactName: input.lead.contact_name,
    status: input.lead.status,
    source: input.lead.source,
    leadScore,
    engagementScore,
    riskScore,
    interactionCount: input.interactions.length,
    openTaskCount,
    completedTaskCount,
    overdueReminderCount,
    latestInteractionAt,
    reasons: buildLeadReasons({
      lead: input.lead,
      interactionCount: input.interactions.length,
      completedTaskCount,
      openTaskCount,
      overdueReminderCount,
    }),
  }
}

function ownerKeyFromTask(task: CrmFollowUpTask) {
  return task.assignee_user_id || task.assignee_name || "unassigned"
}

function ownerNameFromTask(task: CrmFollowUpTask) {
  return task.assignee_name || task.assignee_user_id || "Unassigned"
}

function ensureOwner(
  owners: Map<string, CrmOwnerLeaderboardRow>,
  ownerKey: string,
  ownerName: string
) {
  const existing = owners.get(ownerKey)

  if (existing) {
    return existing
  }

  const created: CrmOwnerLeaderboardRow = {
    ownerKey,
    ownerName,
    assignedTaskCount: 0,
    openTaskCount: 0,
    completedTaskCount: 0,
    overdueReminderCount: 0,
    reassignmentCount: 0,
    auditEventCount: 0,
    outputScore: 0,
  }

  owners.set(ownerKey, created)
  return created
}

function buildOwnerLeaderboard(input: {
  tasks: CrmFollowUpTask[]
  reminders: CrmReminder[]
  assignments: CrmTaskAssignment[]
  auditEvents: CrmAuditEvent[]
}) {
  const owners = new Map<string, CrmOwnerLeaderboardRow>()

  for (const task of input.tasks) {
    const owner = ensureOwner(owners, ownerKeyFromTask(task), ownerNameFromTask(task))
    owner.assignedTaskCount += 1

    if (isOpenTask(task)) {
      owner.openTaskCount += 1
    }
    if (isCompletedTask(task)) {
      owner.completedTaskCount += 1
    }
  }

  for (const assignment of input.assignments) {
    const ownerKey = assignment.to_assignee_user_id || assignment.to_assignee_name || "unassigned"
    const ownerName = assignment.to_assignee_name || assignment.to_assignee_user_id || "Unassigned"
    const owner = ensureOwner(owners, ownerKey, ownerName)
    owner.reassignmentCount += assignment.from_assignee_user_id || assignment.from_assignee_name ? 1 : 0
  }

  const tasksById = new Map(input.tasks.map((task) => [task.crm_task_id, task]))
  for (const reminder of input.reminders) {
    if (reminder.status !== "overdue") {
      continue
    }

    const task = tasksById.get(reminder.crm_task_id)
    const owner = ensureOwner(
      owners,
      task ? ownerKeyFromTask(task) : "unassigned",
      task ? ownerNameFromTask(task) : "Unassigned"
    )
    owner.overdueReminderCount += 1
  }

  for (const event of input.auditEvents) {
    const ownerKey = event.actor_user_id || event.actor_display_name || "system"
    const ownerName = event.actor_display_name || event.actor_user_id || "System"
    const owner = ensureOwner(owners, ownerKey, ownerName)
    owner.auditEventCount += 1
  }

  return [...owners.values()]
    .map((owner) => ({
      ...owner,
      outputScore: clampScore(
        owner.completedTaskCount * 20 +
          owner.assignedTaskCount * 4 +
          owner.auditEventCount * 2 -
          owner.overdueReminderCount * 15
      ),
    }))
    .sort((left, right) => right.outputScore - left.outputScore)
}

export async function getCrmScoreboard(database: Kysely<unknown>): Promise<CrmScoreboard> {
  const [leadRows, interactionRows, tasks, reminders, assignments, auditEvents] = await Promise.all([
    listLeadHeaders(database),
    listInteractionHeaders(database),
    listCrmFollowUpTasks(database),
    listCrmReminders(database),
    listCrmTaskAssignments(database),
    listCrmAuditEvents(database),
  ])

  const leads = leadRows as CrmLeadHeader[]
  const interactions = interactionRows as CrmInteractionHeader[]

  const leadScores = leads
    .map((lead) =>
      scoreLead({
        lead,
        interactions: interactions.filter((interaction) => interaction.lead_id === lead.lead_id),
        tasks: tasks.filter((task) => task.lead_id === lead.lead_id),
        reminders: reminders.filter((reminder) => reminder.lead_id === lead.lead_id),
      })
    )
    .sort((left, right) => right.leadScore - left.leadScore)

  const ownerLeaderboard = buildOwnerLeaderboard({
    tasks,
    reminders,
    assignments,
    auditEvents,
  })

  return {
    summary: {
      rankedLeadCount: leadScores.length,
      highIntentLeadCount: leadScores.filter((item) => item.leadScore >= 70).length,
      atRiskLeadCount: leadScores.filter((item) => item.riskScore >= 40).length,
      ownerCount: ownerLeaderboard.length,
      averageLeadScore: average(leadScores.map((item) => item.leadScore)),
      averageEngagementScore: average(leadScores.map((item) => item.engagementScore)),
    },
    leadScores,
    ownerLeaderboard,
    generatedAt: new Date().toISOString(),
  }
}
