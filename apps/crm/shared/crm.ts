export const crmLeadStatuses = [
  "Cold",
  "Warm",
  "Qualified",
  "Converted",
  "Lost",
] as const

export const crmInteractionTypes = [
  "Cold Call",
  "Email",
  "Reply",
  "Meeting",
] as const

export const crmTaskStatuses = [
  "open",
  "in_progress",
  "completed",
  "revoked",
] as const

export const crmReminderStatuses = [
  "pending",
  "snoozed",
  "completed",
  "revoked",
  "overdue",
] as const

export const crmTaskPriorities = ["low", "medium", "high", "urgent"] as const

export type CrmLeadStatus = (typeof crmLeadStatuses)[number]
export type CrmInteractionType = (typeof crmInteractionTypes)[number]
export type CrmTaskStatus = (typeof crmTaskStatuses)[number]
export type CrmReminderStatus = (typeof crmReminderStatuses)[number]
export type CrmTaskPriority = (typeof crmTaskPriorities)[number]

export type CrmFollowUpTask = {
  crm_task_id: string
  lead_id: string
  interaction_id: string | null
  title: string
  description: string | null
  status: CrmTaskStatus
  priority: CrmTaskPriority
  source_type: string
  assignee_user_id: string | null
  assignee_name: string | null
  created_by_user_id: string
  due_at: string | null
  completed_at: string | null
  revoked_at: string | null
  closed_note: string | null
  created_at: string
  updated_at: string
}

export type CrmReminder = {
  reminder_id: string
  crm_task_id: string
  lead_id: string
  status: CrmReminderStatus
  remind_at: string
  snoozed_until: string | null
  completed_at: string | null
  revoked_at: string | null
  note: string | null
  created_at: string
  updated_at: string
}

export type CrmTaskAssignment = {
  assignment_id: string
  crm_task_id: string
  lead_id: string
  interaction_id: string | null
  from_assignee_user_id: string | null
  from_assignee_name: string | null
  to_assignee_user_id: string | null
  to_assignee_name: string | null
  reason: string | null
  assigned_by_user_id: string | null
  assigned_by_name: string | null
  assigned_at: string
}

export type CrmAuditEvent = {
  audit_event_id: string
  entity_type: string
  entity_id: string
  lead_id: string | null
  interaction_id: string | null
  crm_task_id: string | null
  reminder_id: string | null
  action: string
  actor_user_id: string | null
  actor_display_name: string | null
  summary: string | null
  metadata_json: string | null
  created_at: string
}

export type CrmOverviewMetrics = {
  totalLeads: number
  openTasks: number
  dueTodayTasks: number
  overdueReminders: number
  completedTasks: number
}
