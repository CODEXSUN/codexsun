import type { TaskInsights } from '@shared/index'
import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { AlertTriangle, CalendarClock, CheckCircle2, ClipboardList, ListTodo, TimerReset, UserRound } from 'lucide-react'
import { useAuth } from '@framework-core/web/auth/components/auth-provider'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { getTaskInsights, HttpError } from '@/shared/api/client'

function toErrorMessage(error: unknown) {
  if (error instanceof HttpError) return error.message
  if (error instanceof Error) return error.message
  return 'Failed to load task insights.'
}

function percent(value: number) {
  return `${Math.round(value * 100)}%`
}

function toDateInputValue(value: Date) {
  return value.toISOString().slice(0, 10)
}

function MetricCard({
  title,
  value,
  hint,
  icon: Icon,
  href,
}: {
  title: string
  value: number | string
  hint: string
  icon: typeof ListTodo
  href?: string
}) {
  const content = (
    <Card className="rounded-md border-border/70 shadow-none">
      <CardContent className="flex items-start justify-between gap-4 p-4">
        <div className="space-y-1">
          <p className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">{title}</p>
          <p className="text-2xl font-semibold tracking-tight text-foreground">{value}</p>
          <p className="text-sm text-muted-foreground">{hint}</p>
        </div>
        <div className="rounded-full border border-border/70 bg-muted/30 p-2.5">
          <Icon className="size-4 text-muted-foreground" />
        </div>
      </CardContent>
    </Card>
  )

  return href ? <Link to={href} className="block transition-transform hover:-translate-y-0.5">{content}</Link> : content
}

export function TaskInsightsPage() {
  const { session } = useAuth()
  const [insights, setInsights] = useState<TaskInsights | null>(null)
  const [loading, setLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  useEffect(() => {
    if (!session?.accessToken) {
      setLoading(false)
      return
    }
    const accessToken = session.accessToken

    let cancelled = false
    async function load() {
      setLoading(true)
      setErrorMessage(null)
      try {
        const nextInsights = await getTaskInsights(accessToken)
        if (!cancelled) {
          setInsights(nextInsights)
        }
      } catch (error) {
        if (!cancelled) {
          setErrorMessage(toErrorMessage(error))
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    void load()
    return () => { cancelled = true }
  }, [session?.accessToken])

  const quickSignals = useMemo(() => {
    if (!insights) return []
    return [
      {
        label: 'Overdue Tasks',
        value: insights.urgency.overdue,
        description: 'Tasks already past due and not finalized.',
        route: '/admin/dashboard/task/audit?isOverdue=true',
      },
      {
        label: 'Incomplete Verification',
        value: insights.signals.incompleteVerification,
        description: 'Checklist-backed tasks where proof is still incomplete.',
        route: '/admin/dashboard/task/audit?isIncompleteVerification=true',
      },
      {
        label: 'Stuck Tasks',
        value: insights.signals.stuck,
        description: 'Tasks in progress without movement for several days.',
        route: '/admin/dashboard/task/audit?isStuck=true',
      },
      {
        label: 'At Risk',
        value: insights.signals.atRisk,
        description: 'Tasks whose current health has shifted into risk.',
        route: '/admin/dashboard/task/audit?isOverdue=true',
      },
    ]
  }, [insights])

  const todayValue = useMemo(() => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    return toDateInputValue(today)
  }, [])

  const weekBoundaryValue = useMemo(() => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const weekBoundary = new Date(today)
    weekBoundary.setDate(weekBoundary.getDate() + 7)
    return toDateInputValue(weekBoundary)
  }, [])

  if (loading) {
    return (
      <Card className="rounded-md border-border/70 shadow-none">
        <CardContent className="p-8 text-sm text-muted-foreground">Loading task insights...</CardContent>
      </Card>
    )
  }

  if (!insights) {
    return (
      <Card className="rounded-md border-border/70 shadow-none">
        <CardContent className="p-8 text-sm text-muted-foreground">{errorMessage ?? 'No task insight data is available yet.'}</CardContent>
      </Card>
    )
  }

  return (
    <div className="mx-auto max-w-7xl space-y-4 pt-1">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div className="space-y-2">
          <div className="inline-flex w-fit items-center gap-2 rounded-full border border-border/70 bg-muted/20 px-3 py-1 text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">
            <ClipboardList className="size-3.5" />
            Intelligence Layer
          </div>
          <div className="space-y-1">
            <h1 className="text-2xl font-semibold tracking-tight">Observe task flow before it slips.</h1>
            <p className="max-w-3xl text-sm text-muted-foreground">
              This is the command view for operational truth: system status, ownership concentration, urgency, and signals that need action now.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Button type="button" variant="outline" asChild>
            <Link to="/admin/dashboard/task/tasks">Open Tasks</Link>
          </Button>
          <Button type="button" asChild>
            <Link to="/admin/dashboard/task/audit">Open Audit</Link>
          </Button>
        </div>
      </div>

      {errorMessage ? (
        <Card className="rounded-md border-destructive/30 bg-destructive/5 shadow-none">
          <CardContent className="p-4 text-sm text-destructive">{errorMessage}</CardContent>
        </Card>
      ) : null}

      <div className="space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-[0.16em] text-muted-foreground">System Status</h2>
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
          <MetricCard title="Total Tasks" value={insights.systemStatus.totalTasks} hint="All tracked tasks in the current system." icon={ListTodo} href="/admin/dashboard/task/audit" />
          <MetricCard title="Pending" value={insights.systemStatus.pending} hint="Work that has not started yet." icon={ClipboardList} href="/admin/dashboard/task/audit?status=pending" />
          <MetricCard title="In Progress" value={insights.systemStatus.inProgress} hint="Tasks currently being worked." icon={TimerReset} href="/admin/dashboard/task/audit?status=in_progress" />
          <MetricCard title="In Review" value={insights.systemStatus.inReview} hint="Tasks waiting for sign-off." icon={AlertTriangle} href="/admin/dashboard/task/audit?status=review" />
          <MetricCard title="Finalized" value={insights.systemStatus.finalized} hint="Tasks completed and closed." icon={CheckCircle2} href="/admin/dashboard/task/audit?status=finalized" />
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <Card className="rounded-md border-border/70 shadow-none">
          <CardHeader className="pb-4">
            <CardTitle>Ownership View</CardTitle>
            <CardDescription>Where work is landing and who is carrying it.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 md:grid-cols-3">
            <MetricCard title="Assigned To Me" value={insights.ownership.assignedToMe} hint="Tasks directly on your plate." icon={UserRound} href="/admin/dashboard/task/tasks" />
            <MetricCard title="Created By Me" value={insights.ownership.createdByMe} hint="Tasks you pushed into execution." icon={ClipboardList} href="/admin/dashboard/task/tasks" />
            <MetricCard title="Unassigned" value={insights.ownership.unassigned} hint="Work with no owner yet." icon={AlertTriangle} href="/admin/dashboard/task/audit?assigneeId=unassigned" />
          </CardContent>
        </Card>

        <Card className="rounded-md border-border/70 shadow-none">
          <CardHeader className="pb-4">
            <CardTitle>Urgency View</CardTitle>
            <CardDescription>What is slipping or likely to slip next.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 md:grid-cols-3">
            <MetricCard title="Overdue" value={insights.urgency.overdue} hint="Past due and still open." icon={AlertTriangle} href="/admin/dashboard/task/audit?isOverdue=true" />
            <MetricCard title="Due Today" value={insights.urgency.dueToday} hint="Needs closure before day end." icon={CalendarClock} href={`/admin/dashboard/task/audit?dateFrom=${todayValue}&dateTo=${todayValue}`} />
            <MetricCard title="Due This Week" value={insights.urgency.dueThisWeek} hint="Upcoming deadlines in the current week." icon={TimerReset} href={`/admin/dashboard/task/audit?dateFrom=${todayValue}&dateTo=${weekBoundaryValue}`} />
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.25fr)_minmax(0,0.75fr)]">
        <Card className="rounded-md border-border/70 shadow-none">
          <CardHeader className="pb-4">
            <CardTitle>Action Signals</CardTitle>
            <CardDescription>Derived flags meant to expose risk instead of decorate the page.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3">
            {quickSignals.map((signal) => (
              <Link
                key={signal.label}
                to={signal.route}
                className="rounded-md border border-border/60 bg-muted/10 p-4 transition-colors hover:border-border hover:bg-muted/20"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <p className="font-medium text-foreground">{signal.label}</p>
                    <p className="text-sm text-muted-foreground">{signal.description}</p>
                  </div>
                  <div className="text-2xl font-semibold tracking-tight text-foreground">{signal.value}</div>
                </div>
              </Link>
            ))}
          </CardContent>
        </Card>

        <Card className="rounded-md border-border/70 shadow-none">
          <CardHeader className="pb-4">
            <CardTitle>Completion Rate</CardTitle>
            <CardDescription>Finalized tasks divided by total tasks, with risk carried by task health.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-4xl font-semibold tracking-tight text-foreground">{percent(insights.signals.completionRate)}</p>
              <p className="mt-2 text-sm text-muted-foreground">This is a health signal, not a vanity metric. Use it together with overdue and incomplete verification counts.</p>
            </div>
            <div className="rounded-md border border-border/60 bg-muted/10 p-3 text-sm text-muted-foreground">
              At risk: <span className="font-medium text-foreground">{insights.signals.atRisk}</span><br />
              Stuck tasks: <span className="font-medium text-foreground">{insights.signals.stuck}</span><br />
              Incomplete verification: <span className="font-medium text-foreground">{insights.signals.incompleteVerification}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="rounded-md border-border/70 shadow-none">
        <CardHeader className="pb-4">
          <CardTitle>Domain View</CardTitle>
          <CardDescription>Task context domains replace milestone grouping for default operational visibility.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
          {insights.domains.length === 0 ? (
            <p className="text-sm text-muted-foreground">No task domains have been inferred yet.</p>
          ) : insights.domains.map((domain) => (
            <div key={domain.domain} className="rounded-md border border-border/60 bg-muted/10 p-4">
              <p className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">{domain.domain}</p>
              <p className="mt-1 text-2xl font-semibold tracking-tight text-foreground">{domain.total}</p>
              <p className="mt-1 text-sm text-muted-foreground">{domain.atRisk} at risk</p>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}
