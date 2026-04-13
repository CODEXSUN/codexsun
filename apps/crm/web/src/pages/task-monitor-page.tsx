import { useEffect, useMemo, useState } from "react"

import { readStoredAuthSession } from "@cxapp/web/src/auth/session-storage"
import { TechnicalNameBadge } from "../../../../ui/src/components/system/technical-name-badge"

type CrmTask = {
  crm_task_id: string
  lead_id: string
  title: string
  status: string
  priority: string
  assignee_name?: string | null
  due_at?: string | null
}

type CrmReminder = {
  reminder_id: string
  crm_task_id: string
  status: string
  remind_at: string
}

type CrmTaskAssignment = {
  assignment_id: string
  crm_task_id: string
  from_assignee_name?: string | null
  to_assignee_name?: string | null
  reason?: string | null
  assigned_at: string
}

type CrmAuditEvent = {
  audit_event_id: string
  action: string
  summary?: string | null
  created_at: string
}

function getHeaders() {
  const token = readStoredAuthSession()?.accessToken
  return {
    "Content-Type": "application/json",
    ...(token ? { authorization: `Bearer ${token}` } : {}),
  }
}

export function CrmTaskMonitorPage() {
  const [tasks, setTasks] = useState<CrmTask[]>([])
  const [reminders, setReminders] = useState<CrmReminder[]>([])
  const [assignments, setAssignments] = useState<CrmTaskAssignment[]>([])
  const [auditEvents, setAuditEvents] = useState<CrmAuditEvent[]>([])
  const [selectedTaskId, setSelectedTaskId] = useState("")
  const [assignmentForm, setAssignmentForm] = useState({
    assigneeUserId: "",
    assigneeName: "",
    reason: "",
  })
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  async function loadTaskMonitor() {
    try {
      const [taskRes, reminderRes, assignmentRes, auditRes] = await Promise.all([
        fetch("/internal/v1/crm/follow-up-tasks", { headers: getHeaders() }),
        fetch("/internal/v1/crm/reminders", { headers: getHeaders() }),
        fetch("/internal/v1/crm/follow-up-task/assignments", { headers: getHeaders() }),
        fetch("/internal/v1/crm/audit", { headers: getHeaders() }),
      ])

      const [taskData, reminderData, assignmentData, auditData] = await Promise.all([
        taskRes.json(),
        reminderRes.json(),
        assignmentRes.json(),
        auditRes.json(),
      ])

      const nextTasks = taskData.items ?? []

      setTasks(nextTasks)
      setReminders(reminderData.items ?? [])
      setAssignments(assignmentData.items ?? [])
      setAuditEvents(auditData.items ?? [])

      if (!selectedTaskId && nextTasks[0]?.crm_task_id) {
        setSelectedTaskId(nextTasks[0].crm_task_id)
      }
    } catch (error) {
      console.error("Failed to load CRM task monitor", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadTaskMonitor()
  }, [])

  const openTasks = useMemo(
    () => tasks.filter((item) => item.status === "open" || item.status === "in_progress"),
    [tasks]
  )
  const overdueReminders = useMemo(
    () => reminders.filter((item) => item.status === "overdue"),
    [reminders]
  )
  const selectedTaskAssignments = useMemo(
    () => assignments.filter((item) => item.crm_task_id === selectedTaskId),
    [assignments, selectedTaskId]
  )

  async function handleReassignTask(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!selectedTaskId || !assignmentForm.assigneeName.trim()) {
      return
    }

    setSubmitting(true)
    try {
      const response = await fetch("/internal/v1/crm/follow-up-task/assignment", {
        method: "PATCH",
        headers: getHeaders(),
        body: JSON.stringify({
          crmTaskId: selectedTaskId,
          assigneeUserId: assignmentForm.assigneeUserId.trim() || undefined,
          assigneeName: assignmentForm.assigneeName.trim(),
          reason: assignmentForm.reason.trim() || undefined,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to reassign CRM task")
      }

      setAssignmentForm({
        assigneeUserId: "",
        assigneeName: "",
        reason: "",
      })
      await loadTaskMonitor()
    } catch (error) {
      console.error("Failed to reassign CRM task", error)
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="relative space-y-3 rounded-2xl border border-border/60 bg-card p-5 shadow-sm" data-technical-name="page.crm.task-monitor">
        <TechnicalNameBadge name="page.crm.task-monitor" className="absolute -top-3 right-4" />
        <div className="h-3 w-40 animate-pulse rounded-full bg-muted" />
        <div className="h-24 animate-pulse rounded-xl bg-muted/60" />
      </div>
    )
  }

  return (
    <div className="relative space-y-4" data-technical-name="page.crm.task-monitor">
      <TechnicalNameBadge name="page.crm.task-monitor" className="absolute -top-3 right-4 z-20" />
      <div className="rounded-2xl border border-border/60 bg-card px-5 py-4 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">CRM</p>
        <h1 className="mt-1 text-xl font-bold tracking-tight text-foreground">Task Monitor</h1>
        <p className="mt-1 text-sm text-muted-foreground">Monitor open follow-up tasks, overdue reminders, and recent CRM audit activity.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <div className="rounded-2xl border border-border/60 bg-card px-4 py-4 shadow-sm">
          <p className="text-xs uppercase tracking-widest text-muted-foreground">Open Tasks</p>
          <p className="mt-2 text-3xl font-bold text-foreground">{openTasks.length}</p>
        </div>
        <div className="rounded-2xl border border-border/60 bg-card px-4 py-4 shadow-sm">
          <p className="text-xs uppercase tracking-widest text-muted-foreground">Overdue Reminders</p>
          <p className="mt-2 text-3xl font-bold text-foreground">{overdueReminders.length}</p>
        </div>
        <div className="rounded-2xl border border-border/60 bg-card px-4 py-4 shadow-sm">
          <p className="text-xs uppercase tracking-widest text-muted-foreground">Audit Events</p>
          <p className="mt-2 text-3xl font-bold text-foreground">{auditEvents.length}</p>
        </div>
        <div className="rounded-2xl border border-border/60 bg-card px-4 py-4 shadow-sm">
          <p className="text-xs uppercase tracking-widest text-muted-foreground">Assignments</p>
          <p className="mt-2 text-3xl font-bold text-foreground">{assignments.length}</p>
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
        <div className="rounded-2xl border border-border/60 bg-card p-4 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Queue</p>
          <div className="mt-3 space-y-3">
            {openTasks.length === 0 ? (
              <p className="text-xs text-muted-foreground">No open CRM tasks.</p>
            ) : (
              openTasks.map((task) => (
                <button
                  key={task.crm_task_id}
                  type="button"
                  onClick={() => setSelectedTaskId(task.crm_task_id)}
                  className={`block w-full rounded-xl border bg-background p-3 text-left ${
                    selectedTaskId === task.crm_task_id
                      ? "border-accent/50 ring-1 ring-accent/30"
                      : "border-border/40"
                  }`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-foreground">{task.title}</p>
                      <p className="text-[11px] text-muted-foreground">
                        {task.assignee_name ?? "Unassigned"} | {task.priority}
                      </p>
                    </div>
                    <div className="text-right text-[11px] text-muted-foreground">
                      <p>{task.status}</p>
                      <p>{task.due_at ? new Date(task.due_at).toLocaleString() : "No due date"}</p>
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        <div className="space-y-4">
          <div className="rounded-2xl border border-border/60 bg-card p-4 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Assignment Desk</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Select an open task to review assignment history and reassign ownership.
            </p>
            <form onSubmit={handleReassignTask} className="mt-3 space-y-3">
              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
                  Assignee Name
                </label>
                <input
                  value={assignmentForm.assigneeName}
                  onChange={(event) =>
                    setAssignmentForm((current) => ({
                      ...current,
                      assigneeName: event.target.value,
                    }))
                  }
                  placeholder="CRM Manager"
                  className="mt-1 w-full rounded-lg border border-border/60 bg-background px-3 py-2 text-sm text-foreground shadow-sm"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
                  Assignee User ID
                </label>
                <input
                  value={assignmentForm.assigneeUserId}
                  onChange={(event) =>
                    setAssignmentForm((current) => ({
                      ...current,
                      assigneeUserId: event.target.value,
                    }))
                  }
                  placeholder="user-crm-manager"
                  className="mt-1 w-full rounded-lg border border-border/60 bg-background px-3 py-2 text-sm text-foreground shadow-sm"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
                  Reason
                </label>
                <input
                  value={assignmentForm.reason}
                  onChange={(event) =>
                    setAssignmentForm((current) => ({
                      ...current,
                      reason: event.target.value,
                    }))
                  }
                  placeholder="Escalated callback"
                  className="mt-1 w-full rounded-lg border border-border/60 bg-background px-3 py-2 text-sm text-foreground shadow-sm"
                />
              </div>
              <button
                type="submit"
                disabled={!selectedTaskId || submitting}
                className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-sm disabled:opacity-50"
              >
                {submitting ? "Saving..." : "Reassign Task"}
              </button>
            </form>
            <div className="mt-4 space-y-2">
              {selectedTaskAssignments.length === 0 ? (
                <p className="text-xs text-muted-foreground">No assignment history for the selected task.</p>
              ) : (
                selectedTaskAssignments.slice(0, 5).map((item) => (
                  <div key={item.assignment_id} className="rounded-xl border border-border/40 bg-background p-3">
                    <p className="text-sm font-semibold text-foreground">
                      {(item.from_assignee_name ?? "Unassigned")} to {item.to_assignee_name ?? "Unassigned"}
                    </p>
                    <p className="mt-1 text-[11px] text-muted-foreground">
                      {item.reason ?? "No reason provided"} | {new Date(item.assigned_at).toLocaleString()}
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="rounded-2xl border border-border/60 bg-card p-4 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Overdue</p>
            <div className="mt-3 space-y-3">
              {overdueReminders.length === 0 ? (
                <p className="text-xs text-muted-foreground">No overdue reminders.</p>
              ) : (
                overdueReminders.map((item) => (
                  <div key={item.reminder_id} className="rounded-xl border border-border/40 bg-background p-3">
                    <p className="text-sm font-semibold text-foreground">{item.crm_task_id}</p>
                    <p className="text-[11px] text-muted-foreground">{new Date(item.remind_at).toLocaleString()}</p>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="rounded-2xl border border-border/60 bg-card p-4 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Audit</p>
            <div className="mt-3 space-y-3">
              {auditEvents.slice(0, 8).map((item) => (
                <div key={item.audit_event_id} className="rounded-xl border border-border/40 bg-background p-3">
                  <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                    {item.action.replaceAll("_", " ")}
                  </p>
                  <p className="mt-1 text-sm text-foreground">{item.summary ?? "CRM event logged"}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
