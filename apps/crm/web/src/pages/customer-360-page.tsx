import { useEffect, useMemo, useState } from "react"

import { readStoredAuthSession } from "@cxapp/web/src/auth/session-storage"
import { TechnicalNameBadge } from "../../../../ui/src/components/system/technical-name-badge"

type LeadHeader = {
  lead_id: string
  company_name: string
  contact_name: string
  email?: string | null
  phone?: string | null
  source?: string | null
  status: string
  owner_id?: string | null
  created_at: string
}

type InteractionHeader = {
  interaction_id: string
  type: string
  summary?: string | null
  sentiment?: string | null
  linked_task_id?: string | null
  interaction_date: string
}

type FollowUpTask = {
  crm_task_id: string
  title: string
  status: string
  priority: string
  assignee_name?: string | null
  due_at?: string | null
}

type Reminder = {
  reminder_id: string
  crm_task_id: string
  status: string
  remind_at: string
}

type Assignment = {
  assignment_id: string
  from_assignee_name?: string | null
  to_assignee_name?: string | null
  reason?: string | null
  assigned_at: string
}

type AuditEvent = {
  audit_event_id: string
  action: string
  summary?: string | null
  created_at: string
}

type Customer360Board = {
  leads: LeadHeader[]
  selectedLead: LeadHeader | null
  interactions: InteractionHeader[]
  followUpTasks: FollowUpTask[]
  reminders: Reminder[]
  assignments: Assignment[]
  auditEvents: AuditEvent[]
  metrics: {
    interactionCount: number
    openTaskCount: number
    overdueReminderCount: number
    completedTaskCount: number
    latestInteractionAt: string | null
    lastAuditAt: string | null
  }
}

function getHeaders() {
  const token = readStoredAuthSession()?.accessToken

  return {
    "Content-Type": "application/json",
    ...(token ? { authorization: `Bearer ${token}` } : {}),
  }
}

function formatDate(value?: string | null) {
  if (!value) {
    return "Not set"
  }

  return new Date(value).toLocaleString()
}

function statusTone(status: string) {
  if (status === "completed" || status === "Converted") {
    return "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-200"
  }

  if (status === "overdue" || status === "Lost" || status === "revoked") {
    return "border-red-200 bg-red-50 text-red-700 dark:border-red-800 dark:bg-red-950/30 dark:text-red-200"
  }

  if (status === "Warm" || status === "snoozed" || status === "in_progress") {
    return "border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-200"
  }

  return "border-border bg-muted/50 text-muted-foreground"
}

export function CrmCustomer360Page() {
  const [board, setBoard] = useState<Customer360Board | null>(null)
  const [selectedLeadId, setSelectedLeadId] = useState("")
  const [loading, setLoading] = useState(true)

  async function loadBoard(leadId?: string) {
    setLoading(true)
    try {
      const query = leadId ? `?leadId=${encodeURIComponent(leadId)}` : ""
      const response = await fetch(`/internal/v1/crm/customer-360${query}`, {
        headers: getHeaders(),
      })
      const payload = await response.json()
      const nextBoard = payload.item ?? null

      setBoard(nextBoard)
      setSelectedLeadId(nextBoard?.selectedLead?.lead_id ?? "")
    } catch (error) {
      console.error("Failed to load CRM customer 360 board", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadBoard()
  }, [])

  const latestInteractions = useMemo(
    () => (board?.interactions ?? []).slice(0, 6),
    [board?.interactions]
  )
  const openTasks = useMemo(
    () =>
      (board?.followUpTasks ?? []).filter(
        (item) => item.status === "open" || item.status === "in_progress"
      ),
    [board?.followUpTasks]
  )

  if (loading && !board) {
    return (
      <div
        className="relative space-y-3 rounded-lg border border-border/60 bg-card p-5 shadow-sm"
        data-technical-name="page.crm.customer-360"
      >
        <TechnicalNameBadge name="page.crm.customer-360" className="absolute -top-3 right-4" />
        <div className="h-3 w-48 animate-pulse rounded-full bg-muted" />
        <div className="h-28 animate-pulse rounded-lg bg-muted/60" />
      </div>
    )
  }

  return (
    <div className="relative space-y-4" data-technical-name="page.crm.customer-360">
      <TechnicalNameBadge name="page.crm.customer-360" className="absolute -top-3 right-4 z-20" />

      <div className="rounded-lg border border-border/60 bg-card px-5 py-4 shadow-sm">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">CRM</p>
            <h1 className="mt-1 text-xl font-bold tracking-tight text-foreground">Customer 360</h1>
            <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
              Keep customer context, follow-up work, reminders, ownership changes, and audit evidence together.
            </p>
          </div>
          <label className="min-w-72 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            Customer
            <select
              value={selectedLeadId}
              onChange={(event) => void loadBoard(event.target.value)}
              className="mt-1 w-full rounded-lg border border-border/60 bg-background px-3 py-2 text-sm font-normal normal-case tracking-normal text-foreground shadow-sm"
            >
              {(board?.leads ?? []).map((lead) => (
                <option key={lead.lead_id} value={lead.lead_id}>
                  {lead.company_name} - {lead.contact_name}
                </option>
              ))}
            </select>
          </label>
        </div>
      </div>

      {!board?.selectedLead ? (
        <div className="rounded-lg border border-border/60 bg-card p-8 text-center shadow-sm">
          <p className="text-sm font-semibold text-foreground">No CRM customers yet.</p>
          <p className="mt-2 text-sm text-muted-foreground">
            Register a cold call first, then return here for relationship context.
          </p>
        </div>
      ) : (
        <>
          <div className="grid gap-4 lg:grid-cols-[0.85fr_1.15fr]">
            <section className="rounded-lg border border-border/60 bg-card p-5 shadow-sm">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Profile</p>
                  <h2 className="mt-2 text-lg font-bold text-foreground">{board.selectedLead.company_name}</h2>
                  <p className="mt-1 text-sm text-muted-foreground">{board.selectedLead.contact_name}</p>
                </div>
                <span className={`rounded-lg border px-2 py-1 text-xs font-semibold ${statusTone(board.selectedLead.status)}`}>
                  {board.selectedLead.status}
                </span>
              </div>
              <dl className="mt-5 grid gap-3 text-sm">
                <div>
                  <dt className="text-xs uppercase tracking-widest text-muted-foreground">Phone</dt>
                  <dd className="mt-1 text-foreground">{board.selectedLead.phone ?? "Not recorded"}</dd>
                </div>
                <div>
                  <dt className="text-xs uppercase tracking-widest text-muted-foreground">Email</dt>
                  <dd className="mt-1 text-foreground">{board.selectedLead.email ?? "Not recorded"}</dd>
                </div>
                <div>
                  <dt className="text-xs uppercase tracking-widest text-muted-foreground">Source</dt>
                  <dd className="mt-1 text-foreground">{board.selectedLead.source ?? "Manual"}</dd>
                </div>
                <div>
                  <dt className="text-xs uppercase tracking-widest text-muted-foreground">Created</dt>
                  <dd className="mt-1 text-foreground">{formatDate(board.selectedLead.created_at)}</dd>
                </div>
              </dl>
            </section>

            <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              {[
                { label: "Interactions", value: board.metrics.interactionCount },
                { label: "Open tasks", value: board.metrics.openTaskCount },
                { label: "Overdue reminders", value: board.metrics.overdueReminderCount },
                { label: "Completed tasks", value: board.metrics.completedTaskCount },
              ].map((item) => (
                <div key={item.label} className="rounded-lg border border-border/60 bg-card px-4 py-4 shadow-sm">
                  <p className="text-xs uppercase tracking-widest text-muted-foreground">{item.label}</p>
                  <p className="mt-2 text-2xl font-bold text-foreground">{item.value}</p>
                </div>
              ))}
            </section>
          </div>

          <div className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
            <section className="rounded-lg border border-border/60 bg-card p-5 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Timeline</p>
              <div className="mt-4 space-y-3">
                {latestInteractions.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No interactions recorded.</p>
                ) : (
                  latestInteractions.map((interaction) => (
                    <article key={interaction.interaction_id} className="rounded-lg border border-border/50 bg-background p-4">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-sm font-semibold text-foreground">{interaction.type}</p>
                        {interaction.sentiment ? (
                          <span className="rounded-lg border border-border bg-muted/50 px-2 py-1 text-xs text-muted-foreground">
                            {interaction.sentiment}
                          </span>
                        ) : null}
                        {interaction.linked_task_id ? (
                          <span className="rounded-lg border border-amber-200 bg-amber-50 px-2 py-1 text-xs text-amber-800 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-200">
                            Task linked
                          </span>
                        ) : null}
                      </div>
                      <p className="mt-2 text-sm text-foreground">{interaction.summary ?? "Interaction logged"}</p>
                      <p className="mt-2 text-xs text-muted-foreground">{formatDate(interaction.interaction_date)}</p>
                    </article>
                  ))
                )}
              </div>
            </section>

            <div className="space-y-4">
              <section className="rounded-lg border border-border/60 bg-card p-5 shadow-sm">
                <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Open Work</p>
                <div className="mt-4 space-y-3">
                  {openTasks.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No open follow-up work.</p>
                  ) : (
                    openTasks.map((task) => (
                      <div key={task.crm_task_id} className="rounded-lg border border-border/50 bg-background p-4">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="text-sm font-semibold text-foreground">{task.title}</p>
                            <p className="mt-1 text-xs text-muted-foreground">
                              {task.assignee_name ?? "Unassigned"} - {task.priority}
                            </p>
                          </div>
                          <span className={`rounded-lg border px-2 py-1 text-xs font-semibold ${statusTone(task.status)}`}>
                            {task.status}
                          </span>
                        </div>
                        <p className="mt-2 text-xs text-muted-foreground">Due {formatDate(task.due_at)}</p>
                      </div>
                    ))
                  )}
                </div>
              </section>

              <section className="rounded-lg border border-border/60 bg-card p-5 shadow-sm">
                <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Reminders</p>
                <div className="mt-4 space-y-3">
                  {board.reminders.slice(0, 5).map((reminder) => (
                    <div key={reminder.reminder_id} className="flex items-center justify-between gap-3 rounded-lg border border-border/50 bg-background p-3">
                      <div>
                        <p className="text-sm font-semibold text-foreground">{reminder.crm_task_id}</p>
                        <p className="text-xs text-muted-foreground">{formatDate(reminder.remind_at)}</p>
                      </div>
                      <span className={`rounded-lg border px-2 py-1 text-xs font-semibold ${statusTone(reminder.status)}`}>
                        {reminder.status}
                      </span>
                    </div>
                  ))}
                  {board.reminders.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No reminders recorded.</p>
                  ) : null}
                </div>
              </section>
            </div>
          </div>

          <div className="grid gap-4 xl:grid-cols-2">
            <section className="rounded-lg border border-border/60 bg-card p-5 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Ownership Trail</p>
              <div className="mt-4 space-y-3">
                {board.assignments.slice(0, 6).map((assignment) => (
                  <div key={assignment.assignment_id} className="rounded-lg border border-border/50 bg-background p-3">
                    <p className="text-sm font-semibold text-foreground">
                      {assignment.from_assignee_name ?? "Unassigned"} to {assignment.to_assignee_name ?? "Unassigned"}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {assignment.reason ?? "No reason recorded"} - {formatDate(assignment.assigned_at)}
                    </p>
                  </div>
                ))}
                {board.assignments.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No assignment changes recorded.</p>
                ) : null}
              </div>
            </section>

            <section className="rounded-lg border border-border/60 bg-card p-5 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Audit Evidence</p>
              <div className="mt-4 space-y-3">
                {board.auditEvents.slice(0, 6).map((event) => (
                  <div key={event.audit_event_id} className="rounded-lg border border-border/50 bg-background p-3">
                    <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                      {event.action.replaceAll("_", " ")}
                    </p>
                    <p className="mt-1 text-sm text-foreground">{event.summary ?? "CRM event logged"}</p>
                    <p className="mt-1 text-xs text-muted-foreground">{formatDate(event.created_at)}</p>
                  </div>
                ))}
                {board.auditEvents.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No audit events recorded.</p>
                ) : null}
              </div>
            </section>
          </div>
        </>
      )}
    </div>
  )
}
