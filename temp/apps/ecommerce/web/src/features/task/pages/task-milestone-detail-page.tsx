import type { TaskSummary } from '@shared/index'
import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, ArrowRight, CalendarClock, CheckCircle2, FolderKanban, Layers3, ListTodo } from 'lucide-react'
import { useAuth } from '@framework-core/web/auth/components/auth-provider'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { StatusBadge } from '@/components/ui/status-badge'
import { getMilestone, HttpError, listTasks } from '@/shared/api/client'

function toErrorMessage(error: unknown) {
  if (error instanceof HttpError) return error.message
  if (error instanceof Error) return error.message
  return 'Failed to load milestone.'
}

function formatDate(value: string | null) {
  if (!value) return 'Not scheduled'
  const parsedValue = new Date(value)
  if (Number.isNaN(parsedValue.getTime())) return value
  return new Intl.DateTimeFormat('en-IN', { dateStyle: 'medium' }).format(parsedValue)
}

function getStatusTone(status: string) {
  switch (status) {
    case 'pending':
      return 'manual' as const
    case 'in_progress':
      return 'publishing' as const
    case 'review':
      return 'featured' as const
    case 'finalized':
      return 'active' as const
    case 'completed':
      return 'active' as const
    default:
      return 'manual' as const
  }
}

function isOverdueTask(item: Pick<TaskSummary, 'dueDate' | 'status'>) {
  if (!item.dueDate || item.status === 'finalized') return false
  const dueDate = new Date(item.dueDate)
  if (Number.isNaN(dueDate.getTime())) return false
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return dueDate < today
}

function WorkspaceMetric({
  label,
  value,
  hint,
  icon: Icon,
}: {
  label: string
  value: number
  hint: string
  icon: typeof FolderKanban
}) {
  return (
    <Card className="rounded-md border-border/70 shadow-none transition-colors hover:border-border hover:bg-muted/10">
      <CardContent className="flex items-start justify-between gap-4 p-4">
        <div className="space-y-1">
          <p className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">{label}</p>
          <p className="text-2xl font-semibold tracking-tight text-foreground">{value}</p>
          <p className="text-sm text-muted-foreground">{hint}</p>
        </div>
        <div className="rounded-full border border-border/70 bg-muted/30 p-2.5">
          <Icon className="size-4 text-muted-foreground" />
        </div>
      </CardContent>
    </Card>
  )
}

export function TaskMilestoneDetailPage() {
  const navigate = useNavigate()
  const { session } = useAuth()
  const { milestoneId } = useParams()
  const [milestone, setMilestone] = useState<Awaited<ReturnType<typeof getMilestone>> | null>(null)
  const [tasks, setTasks] = useState<TaskSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  useEffect(() => {
    const accessToken = session?.accessToken
    if (!milestoneId || !accessToken) {
      setLoading(false)
      return
    }
    const token: string = accessToken
    const id: string = milestoneId

    let cancelled = false
    async function load() {
      setLoading(true)
      setErrorMessage(null)
      try {
        const [nextMilestone, nextTasks] = await Promise.all([
          getMilestone(token, id),
          listTasks(token, { milestoneId: id }),
        ])
        if (!cancelled) {
          setMilestone(nextMilestone)
          setTasks(nextTasks)
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
  }, [milestoneId, session?.accessToken])

  const overdueTasks = useMemo(() => tasks.filter(isOverdueTask), [tasks])

  if (loading) {
    return <Card className="rounded-md border-border/70 shadow-none"><CardContent className="p-8 text-sm text-muted-foreground">Loading milestone...</CardContent></Card>
  }

  if (!milestone) {
    return <Card className="rounded-md border-border/70 shadow-none"><CardContent className="p-8 text-sm text-muted-foreground">{errorMessage ?? 'Milestone not found.'}</CardContent></Card>
  }

  return (
    <div className="mx-auto max-w-7xl space-y-4 pt-1">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div className="space-y-2">
          <Button variant="ghost" size="sm" asChild className="-ml-3 mb-2">
            <Link to="/admin/dashboard/task/milestones"><ArrowLeft className="size-4" />Back to milestones</Link>
          </Button>
          <div className="inline-flex w-fit items-center gap-2 rounded-full border border-border/70 bg-muted/20 px-3 py-1 text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">
            <FolderKanban className="size-3.5" />
            Milestone Record
          </div>
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-2xl font-semibold tracking-tight">{milestone.title}</h1>
              <StatusBadge tone={getStatusTone(milestone.status)}>{milestone.status}</StatusBadge>
            </div>
            <p className="max-w-3xl text-sm text-muted-foreground">{milestone.description?.trim() || 'No milestone description added yet.'}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Button type="button" variant="outline" onClick={() => { void navigate(`/admin/dashboard/task/tasks?milestoneId=${encodeURIComponent(milestone.id)}`) }}>
            View In Tasks
          </Button>
          <Button type="button" onClick={() => { void navigate(`/admin/dashboard/task/tasks/new?milestoneId=${encodeURIComponent(milestone.id)}`) }}>
            Create Task
          </Button>
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <WorkspaceMetric label="Total Tasks" value={milestone.taskStats.totalTasks} hint="Execution units linked to this milestone." icon={FolderKanban} />
        <WorkspaceMetric label="In Flight" value={milestone.taskStats.pending + milestone.taskStats.inProgress + milestone.taskStats.review} hint="Work that still needs movement or sign-off." icon={ListTodo} />
        <WorkspaceMetric label="Finalized" value={milestone.taskStats.finalized} hint="Tasks already completed under this milestone." icon={CheckCircle2} />
        <WorkspaceMetric label="Overdue" value={milestone.taskStats.overdue} hint="Open risk that is already past its due date." icon={CalendarClock} />
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.45fr)_minmax(18rem,0.9fr)]">
        <Card className="rounded-md border-border/70 shadow-none">
          <CardHeader className="pb-4">
            <CardTitle>Linked Tasks</CardTitle>
            <CardDescription>Execution work grouped under this milestone.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {tasks.length === 0 ? (
              <p className="text-sm text-muted-foreground">No tasks are linked to this milestone yet.</p>
            ) : tasks.map((task) => (
              <Card
                key={task.id}
                className="cursor-pointer rounded-md border-border/70 shadow-none transition-colors hover:border-border hover:bg-muted/10"
                role="link"
                tabIndex={0}
                onClick={() => { void navigate(`/admin/dashboard/task/tasks/${task.id}`) }}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault()
                    void navigate(`/admin/dashboard/task/tasks/${task.id}`)
                  }
                }}
              >
                <CardContent className="grid gap-3 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Task ID {task.id}</p>
                      <p className="text-base font-semibold text-foreground">{task.title}</p>
                      <p className="line-clamp-2 text-sm text-muted-foreground">{task.description?.trim() || 'No task description added yet.'}</p>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <StatusBadge tone={getStatusTone(task.status)}>{task.status.replace('_', ' ')}</StatusBadge>
                      {isOverdueTask(task) ? <StatusBadge tone="manual">Overdue</StatusBadge> : null}
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-border/60 pt-3 text-sm">
                    <span className="text-muted-foreground">Assignee <span className="font-medium text-foreground">{task.assigneeName ?? 'Unassigned'}</span></span>
                    <span className="text-muted-foreground">Due <span className="font-medium text-foreground">{formatDate(task.dueDate)}</span></span>
                    <span className="text-muted-foreground">Checklist <span className="font-medium text-foreground">{task.checklistCompletionCount}/{task.checklistTotalCount}</span></span>
                    <span className="ml-auto inline-flex items-center gap-1 font-medium text-foreground">Open task <ArrowRight className="size-4" /></span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card className="rounded-md border-border/70 shadow-none">
            <CardHeader className="pb-4">
              <CardTitle>Milestone Context</CardTitle>
              <CardDescription>Execution metadata for this grouped workstream.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-3">
              <div className="rounded-md border border-border/60 bg-muted/10 p-3">
                <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Status</p>
                <p className="mt-2 text-sm font-medium text-foreground">{milestone.status}</p>
              </div>
              <div className="rounded-md border border-border/60 bg-muted/10 p-3">
                <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Due Date</p>
                <p className="mt-2 text-sm font-medium text-foreground">{formatDate(milestone.dueDate)}</p>
              </div>
              <div className="rounded-md border border-border/60 bg-muted/10 p-3">
                <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Entity</p>
                <p className="mt-2 text-sm font-medium text-foreground">{milestone.entityType ?? 'General'}</p>
                <p className="text-xs text-muted-foreground">{milestone.entityId ?? 'Not linked'}</p>
              </div>
              <div className="rounded-md border border-border/60 bg-muted/10 p-3">
                <div className="flex items-start gap-3">
                  <div className="rounded-full border border-border/70 bg-background p-2">
                    <CalendarClock className="size-4 text-muted-foreground" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-foreground">{overdueTasks.length} overdue task{overdueTasks.length === 1 ? '' : 's'}</p>
                    <p className="text-xs text-muted-foreground">Milestone rollup updates from its linked tasks automatically.</p>
                  </div>
                </div>
              </div>
              <div className="rounded-md border border-border/60 bg-muted/10 p-3">
                <div className="flex items-start gap-3">
                  <div className="rounded-full border border-border/70 bg-background p-2">
                    <Layers3 className="size-4 text-muted-foreground" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-foreground">Grouped execution context</p>
                    <p className="text-xs text-muted-foreground">Tasks stay individually governed while this milestone tracks the broader objective.</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
