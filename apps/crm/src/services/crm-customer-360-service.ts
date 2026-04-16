import type { Kysely } from "kysely"

import type {
  CrmCustomer360Board,
  CrmInteractionHeader,
  CrmLeadHeader,
} from "../../shared/crm.js"
import {
  listCrmAuditEvents,
  listCrmFollowUpTasks,
  listCrmReminders,
  listCrmTaskAssignments,
} from "./crm-follow-up-service.js"
import { listInteractionHeaders, listLeadHeaders } from "./crm-repository.js"

type GetCrmCustomer360BoardInput = {
  leadId?: string
}

function countOpenTasks(board: Pick<CrmCustomer360Board, "followUpTasks">) {
  return board.followUpTasks.filter(
    (item) => item.status === "open" || item.status === "in_progress"
  ).length
}

function countCompletedTasks(board: Pick<CrmCustomer360Board, "followUpTasks">) {
  return board.followUpTasks.filter((item) => item.status === "completed").length
}

function countOverdueReminders(board: Pick<CrmCustomer360Board, "reminders">) {
  return board.reminders.filter((item) => item.status === "overdue").length
}

function emptyBoard(leads: CrmLeadHeader[]): CrmCustomer360Board {
  return {
    leads,
    selectedLead: null,
    interactions: [],
    followUpTasks: [],
    reminders: [],
    assignments: [],
    auditEvents: [],
    metrics: {
      interactionCount: 0,
      openTaskCount: 0,
      overdueReminderCount: 0,
      completedTaskCount: 0,
      latestInteractionAt: null,
      lastAuditAt: null,
    },
  }
}

export async function getCrmCustomer360Board(
  database: Kysely<unknown>,
  input: GetCrmCustomer360BoardInput = {}
): Promise<CrmCustomer360Board> {
  const leads = (await listLeadHeaders(database)) as CrmLeadHeader[]
  const selectedLead =
    (input.leadId ? leads.find((lead) => lead.lead_id === input.leadId) : leads[0]) ?? null

  if (!selectedLead) {
    return emptyBoard(leads)
  }

  const [interactionRows, followUpTasks, reminders, assignments, auditEvents] = await Promise.all([
    listInteractionHeaders(database, selectedLead.lead_id),
    listCrmFollowUpTasks(database, { leadId: selectedLead.lead_id }),
    listCrmReminders(database, { leadId: selectedLead.lead_id }),
    listCrmTaskAssignments(database, { leadId: selectedLead.lead_id }),
    listCrmAuditEvents(database, { leadId: selectedLead.lead_id }),
  ])
  const interactions = interactionRows as CrmInteractionHeader[]

  const board = {
    leads,
    selectedLead,
    interactions,
    followUpTasks,
    reminders,
    assignments,
    auditEvents,
    metrics: {
      interactionCount: interactions.length,
      openTaskCount: 0,
      overdueReminderCount: 0,
      completedTaskCount: 0,
      latestInteractionAt: interactions[0]?.interaction_date ?? null,
      lastAuditAt: auditEvents[0]?.created_at ?? null,
    },
  } satisfies CrmCustomer360Board

  board.metrics.openTaskCount = countOpenTasks(board)
  board.metrics.overdueReminderCount = countOverdueReminders(board)
  board.metrics.completedTaskCount = countCompletedTasks(board)

  return board
}
