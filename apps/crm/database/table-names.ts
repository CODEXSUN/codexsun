export const crmTableNames = {
  // JSON Stores
  leads: "crm_leads",
  interactions: "crm_interactions",
  // Relational Headers / Indexes
  leadHeaders: "crm_lead_headers",
  interactionHeaders: "crm_interaction_headers",
  followUpTasks: "crm_follow_up_tasks",
  taskAssignments: "crm_task_assignments",
  reminders: "crm_reminders",
  auditEvents: "crm_audit_events",
} as const
