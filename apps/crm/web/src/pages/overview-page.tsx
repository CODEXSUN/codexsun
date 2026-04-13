import { PhoneCall, Target, TrendingUp, Users } from "lucide-react"
import { useEffect, useState } from "react"
import { Link } from "react-router-dom"

import { readStoredAuthSession } from "@cxapp/web/src/auth/session-storage"
import { TechnicalNameBadge } from "../../../../ui/src/components/system/technical-name-badge"

type CrmOverviewMetrics = {
  totalLeads: number
  openTasks: number
  dueTodayTasks: number
  overdueReminders: number
  completedTasks: number
}

const overviewCards = [
  {
    id: "pipeline",
    title: "Lead pipeline",
    summary: "Track prospects from first contact through qualification and conversion.",
    icon: TrendingUp,
  },
  {
    id: "calls",
    title: "Call desk",
    summary: "Capture unknown callers, assign follow-up work, and close calls cleanly.",
    icon: PhoneCall,
  },
  {
    id: "tasks",
    title: "Task monitor",
    summary: "Monitor reminders, closures, and CRM audit activity in one queue.",
    icon: Target,
  },
  {
    id: "relationships",
    title: "Customer relationships",
    summary: "Keep long-term relationship and engagement context visible while the CRM grows.",
    icon: Users,
  },
] as const

function getHeaders() {
  const token = readStoredAuthSession()?.accessToken

  return {
    "Content-Type": "application/json",
    ...(token ? { authorization: `Bearer ${token}` } : {}),
  }
}

export function CrmOverviewPage() {
  const [metrics, setMetrics] = useState<CrmOverviewMetrics | null>(null)

  useEffect(() => {
    async function loadMetrics() {
      try {
        const response = await fetch("/internal/v1/crm/overview", { headers: getHeaders() })
        const payload = await response.json()
        setMetrics(payload.item ?? null)
      } catch (error) {
        console.error("Failed to load CRM overview metrics", error)
      }
    }

    void loadMetrics()
  }, [])

  return (
    <div className="relative space-y-4" data-technical-name="page.crm.overview">
      <TechnicalNameBadge name="page.crm.overview" className="absolute -top-3 right-4 z-20" />

      <div className="rounded-2xl border border-border/60 bg-card px-5 py-4 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">CRM</p>
        <h1 className="mt-1 text-xl font-bold tracking-tight text-foreground">Overview</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          The CRM execution program now starts with the operational slice: call intake, follow-up assignment, reminders, closure, and audit.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-5">
        {[
          { label: "Leads", value: metrics?.totalLeads ?? 0 },
          { label: "Open tasks", value: metrics?.openTasks ?? 0 },
          { label: "Due today", value: metrics?.dueTodayTasks ?? 0 },
          { label: "Overdue reminders", value: metrics?.overdueReminders ?? 0 },
          { label: "Completed tasks", value: metrics?.completedTasks ?? 0 },
        ].map((item) => (
          <div key={item.label} className="rounded-2xl border border-border/60 bg-card px-4 py-4 shadow-sm">
            <p className="text-xs uppercase tracking-widest text-muted-foreground">{item.label}</p>
            <p className="mt-2 text-2xl font-bold text-foreground">{item.value}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {overviewCards.map((item) => {
          const Icon = item.icon

          return (
            <div
              key={item.id}
              className="rounded-2xl border border-border/60 bg-card px-5 py-4 shadow-sm"
            >
              <div className="flex size-10 items-center justify-center rounded-xl bg-accent/10">
                <Icon className="size-5 text-accent" />
              </div>
              <p className="mt-4 text-sm font-semibold text-foreground">{item.title}</p>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">{item.summary}</p>
            </div>
          )
        })}
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Link
          to="/dashboard/apps/crm/cold-calls"
          className="rounded-2xl border border-border/60 bg-card px-5 py-4 shadow-sm transition hover:-translate-y-0.5 hover:border-accent/40"
        >
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Outreach</p>
          <p className="mt-2 text-base font-semibold text-foreground">Open call desk</p>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            Register unknown callers, attach follow-up work, assign users, and drive reminders from one desk.
          </p>
        </Link>

        <Link
          to="/dashboard/apps/crm/leads"
          className="rounded-2xl border border-border/60 bg-card px-5 py-4 shadow-sm transition hover:-translate-y-0.5 hover:border-accent/40"
        >
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Pipeline</p>
          <p className="mt-2 text-base font-semibold text-foreground">Open lead pipeline</p>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            Review funnel stages, prospect health, and progression across the current sales pipeline.
          </p>
        </Link>

        <Link
          to="/dashboard/apps/crm/task-monitor"
          className="rounded-2xl border border-border/60 bg-card px-5 py-4 shadow-sm transition hover:-translate-y-0.5 hover:border-accent/40"
        >
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Operations</p>
          <p className="mt-2 text-base font-semibold text-foreground">Open task monitor</p>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            Watch open CRM queues, overdue reminders, and recent audit events without leaving the workspace.
          </p>
        </Link>
      </div>
    </div>
  )
}
