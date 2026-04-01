import type { TaskHealthStatus, TaskPriority, TaskStatus, TaskSummary } from '@shared/index'
import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { ArrowRight, CheckCircle2, Clock3, ListTodo, Plus, Target, UserRound } from 'lucide-react'
import { useAuth } from '@framework-core/web/auth/components/auth-provider'
import { AnimatedTabs, type AnimatedContentTab } from '@/components/ui/animated-tabs'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { StatusBadge } from '@/components/ui/status-badge'
import { HttpError, listTasks } from '@/shared/api/client'

type VerifiedFilterKey = 'all' | 'verified' | 'unverified'
type ExecutionViewKey = 'now' | 'queue' | 'focus' | 'review' | 'done'

function toErrorMessage(error: unknown) {
  if (error instanceof HttpError) return error.message
  if (error instanceof Error) return error.message
  return 'Failed to load tasks.'
}

function formatDate(value: string | null) {
  if (!value) return 'Not scheduled'

  const parsedValue = new Date(value)
  if (Number.isNaN(parsedValue.getTime())) {
    return value
  }

  return new Intl.DateTimeFormat('en-IN', { dateStyle: 'medium' }).format(parsedValue)
}

function toDateInputValue(value: string | null) {
  if (!value) return ''

  const parsedValue = new Date(value)
  if (Number.isNaN(parsedValue.getTime())) {
    return ''
  }

  return parsedValue.toISOString().slice(0, 10)
}

function getStatusConfig(status: TaskStatus) {
  switch (status) {
    case 'pending':
      return { label: 'Pending', tone: 'manual' as const }
    case 'in_progress':
      return { label: 'In Progress', tone: 'publishing' as const }
    case 'review':
      return { label: 'Review', tone: 'featured' as const }
    case 'finalized':
      return { label: 'Finalized', tone: 'active' as const }
  }
}

function getPriorityConfig(priority: TaskPriority) {
  switch (priority) {
    case 'low':
      return { label: 'Low', tone: 'manual' as const }
    case 'medium':
      return { label: 'Medium', tone: 'publishing' as const }
    case 'high':
      return { label: 'High', tone: 'featured' as const }
    case 'urgent':
      return { label: 'Urgent', tone: 'active' as const }
  }
}

function WorkspaceMetric({
  label,
  value,
  hint,
  icon: Icon,
  active,
  onClick,
}: {
  label: string
  value: number
  hint: string
  icon: typeof ListTodo
  active: boolean
  onClick: () => void
}) {
  return (
    <Card
      className={[
        'cursor-pointer rounded-md shadow-none transition-colors',
        active
          ? 'border-foreground bg-muted/25'
          : 'border-border/70 hover:border-border hover:bg-muted/10',
      ].join(' ')}
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault()
          onClick()
        }
      }}
    >
      <CardContent className="flex items-start justify-between gap-4 p-4">
        <div className="space-y-1">
          <p className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">{label}</p>
          <p className="text-2xl font-semibold tracking-tight text-foreground">{value}</p>
          <p className="text-sm text-muted-foreground">{hint}</p>
        </div>
        <div className={active ? 'rounded-full border border-foreground/70 bg-foreground p-2.5' : 'rounded-full border border-border/70 bg-muted/30 p-2.5'}>
          <Icon className={active ? 'size-4 text-background' : 'size-4 text-muted-foreground'} />
        </div>
      </CardContent>
    </Card>
  )
}

function EmptyTaskState({
  title,
  description,
}: {
  title: string
  description: string
}) {
  return (
    <Card className="rounded-md border-border/70 shadow-none">
      <CardContent className="flex min-h-52 flex-col items-center justify-center gap-3 p-6 text-center">
        <div className="rounded-full border border-border/70 bg-muted/25 p-3">
          <ListTodo className="size-5 text-muted-foreground" />
        </div>
        <div className="space-y-1">
          <p className="font-medium text-foreground">{title}</p>
          <p className="max-w-md text-sm text-muted-foreground">{description}</p>
        </div>
      </CardContent>
    </Card>
  )
}

function TaskListSection({
  title,
  description,
  items,
}: {
  title: string
  description: string
  items: TaskSummary[]
}) {
  const navigate = useNavigate()

  if (items.length === 0) {
    return <EmptyTaskState title={`No ${title.toLowerCase()} tasks`} description={description} />
  }

  return (
    <div className="space-y-3">
      <div className="grid gap-3">
        {items.map((item, index) => {
          const status = getStatusConfig(item.status)
          const priority = getPriorityConfig(item.priority)
          const taskHref = `/admin/dashboard/task/tasks/${item.id}`
          const isOverdue = item.taskHealth.signals.overdue === true
          const isStuck = item.taskHealth.status === 'stuck' || item.taskHealth.signals.inactive === true || item.taskHealth.signals.longInSameState === true
          const isIncompleteVerification = item.taskHealth.signals.checklistIncomplete === true

          return (
            <div key={item.id} className="relative">
              <div className="pointer-events-none absolute left-0 top-1/2 z-10 -translate-x-1/2 -translate-y-1/2">
                <div className="flex size-10 items-center justify-center rounded-full border border-foreground/80 bg-foreground/60 text-sm font-semibold text-background shadow-sm">
                  {index + 1}
                </div>
              </div>

              <Card
                className="cursor-pointer rounded-md border-border/70 shadow-none transition-colors hover:border-border hover:bg-muted/10"
                role="link"
                tabIndex={0}
                onClick={() => { void navigate(taskHref) }}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault()
                    void navigate(taskHref)
                  }
                }}
              >
                <CardHeader className="space-y-3 pb-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Task ID {item.id}</p>
                      <CardTitle className="text-base">{item.title}</CardTitle>
                      <p className="line-clamp-2 max-w-2xl text-sm text-muted-foreground">
                        {item.description?.trim() || 'No task description added yet.'}
                      </p>
                      <div className="flex flex-wrap items-center gap-2 pt-1">
                        <StatusBadge tone={priority.tone}>{priority.label}</StatusBadge>
                        <StatusBadge tone="manual">{item.taskContext.domain}</StatusBadge>
                        {item.taskGroupTitle ? <StatusBadge tone="manual">{item.taskGroupTitle}</StatusBadge> : null}
                        {isOverdue ? <StatusBadge tone="manual">Overdue</StatusBadge> : null}
                        {isIncompleteVerification ? <StatusBadge tone="featured">Incomplete verification</StatusBadge> : null}
                        {isStuck ? <StatusBadge tone="publishing">Stuck</StatusBadge> : null}
                        {item.tags.map((tag) => (
                          <StatusBadge key={tag} tone="manual">{tag}</StatusBadge>
                        ))}
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2 text-right">
                      <StatusBadge tone={status.tone}>{status.label}</StatusBadge>
                      <CardDescription>
                        Created {formatDate(item.createdAt)} · Updated {formatDate(item.updatedAt)}
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-border/60 pt-3 text-sm">
                    <span className="text-muted-foreground">Due date <span className="font-medium text-foreground">{formatDate(item.dueDate)}</span></span>
                    <span className="text-muted-foreground">Assignee <span className="font-medium text-foreground">{item.assigneeName ?? 'Unassigned'}</span></span>
                    <span className="text-muted-foreground">Creator <span className="font-medium text-foreground">{item.creatorName}</span></span>
                    <span className="ml-auto inline-flex items-center gap-1 font-medium text-foreground">
                      Open task
                      <ArrowRight className="size-4" />
                    </span>
                  </div>
                </CardContent>
              </Card>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export function TaskWorkspacePage() {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const { session } = useAuth()
  const requestedView = searchParams.get('view')
  const initialView: ExecutionViewKey = requestedView === 'queue' || requestedView === 'focus' || requestedView === 'review' || requestedView === 'done'
    ? requestedView
    : 'now'
  const [items, setItems] = useState<TaskSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<ExecutionViewKey>(initialView)
  const [selectedTag, setSelectedTag] = useState('all')
  const [selectedTaskGroup, setSelectedTaskGroup] = useState('all')
  const [selectedTemplate, setSelectedTemplate] = useState('all')
  const [verifiedFilter, setVerifiedFilter] = useState<VerifiedFilterKey>('all')
  const [dueDateFrom, setDueDateFrom] = useState('')
  const [dueDateTo, setDueDateTo] = useState('')
  const selectedMilestoneId = searchParams.get('milestoneId') ?? ''

  useEffect(() => {
    const nextView = searchParams.get('view')
    if (nextView === 'queue' || nextView === 'focus' || nextView === 'review' || nextView === 'done' || nextView === 'now') {
      setActiveTab(nextView)
      return
    }
    setActiveTab('now')
  }, [searchParams])

  useEffect(() => {
    if (!session?.accessToken) {
      setLoading(false)
      setItems([])
      return
    }

    const accessToken = session.accessToken
    let cancelled = false

    async function load() {
      setLoading(true)
      setErrorMessage(null)

      try {
        const nextItems = await listTasks(accessToken, { milestoneId: selectedMilestoneId || undefined })
        if (!cancelled) {
          setItems(nextItems)
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

    return () => {
      cancelled = true
    }
  }, [selectedMilestoneId, session?.accessToken])

  const currentUserId = session?.user.id ?? ''
  const today = new Date().toISOString().slice(0, 10)

  const nowTasks = useMemo(
    () => items.filter((item) => {
      const dueDateValue = toDateInputValue(item.dueDate)
      return (
        item.status === 'in_progress'
        || item.priority === 'urgent'
        || item.taskHealth.status === 'at_risk'
        || item.taskHealth.signals.overdue === true
        || dueDateValue === today
      )
    }),
    [items, today],
  )
  const queueTasks = useMemo(
    () => items.filter((item) => item.status === 'pending' || (item.status === 'in_progress' && item.taskHealth.status === 'normal')),
    [items],
  )
  const focusTasks = useMemo(
    () => items.filter((item) => item.assigneeId === currentUserId && (item.priority === 'high' || item.priority === 'urgent' || item.taskHealth.status !== 'normal')),
    [currentUserId, items],
  )
  const reviewTasks = useMemo(() => items.filter((item) => item.status === 'review'), [items])
  const doneTasks = useMemo(() => items.filter((item) => item.status === 'finalized'), [items])

  const tagOptions = useMemo(
    () => [...new Set(items.flatMap((item) => item.tags).filter((tag) => tag.trim().length > 0))].sort((left, right) => left.localeCompare(right)),
    [items],
  )
  const taskGroupOptions = useMemo(
    () => [...new Set(items.map((item) => item.taskGroupTitle).filter((value): value is string => Boolean(value?.trim())))].sort((left, right) => left.localeCompare(right)),
    [items],
  )
  const templateOptions = useMemo(
    () => [...new Set(items.map((item) => item.templateName).filter((value): value is string => Boolean(value?.trim())))].sort((left, right) => left.localeCompare(right)),
    [items],
  )

  function applyWorkspaceFilters(sourceItems: TaskSummary[]) {
    return sourceItems.filter((item) => {
      if (selectedTag !== 'all' && !item.tags.includes(selectedTag)) {
        return false
      }

      if (selectedTaskGroup !== 'all' && item.taskGroupTitle !== selectedTaskGroup) {
        return false
      }

      if (selectedTemplate !== 'all' && item.templateName !== selectedTemplate) {
        return false
      }

      if (selectedMilestoneId && item.milestoneId !== selectedMilestoneId) {
        return false
      }

      const isVerified = item.checklistTotalCount > 0 && item.checklistCompletionCount >= item.checklistTotalCount
      if (verifiedFilter === 'verified' && !isVerified) {
        return false
      }
      if (verifiedFilter === 'unverified' && isVerified) {
        return false
      }

      const dueDateValue = toDateInputValue(item.dueDate)
      if (dueDateFrom && (!dueDateValue || dueDateValue < dueDateFrom)) {
        return false
      }
      if (dueDateTo && (!dueDateValue || dueDateValue > dueDateTo)) {
        return false
      }

      return true
    })
  }

  function clearWorkspaceFilters() {
    setSelectedTag('all')
    setSelectedTaskGroup('all')
    setSelectedTemplate('all')
    setVerifiedFilter('all')
    setDueDateFrom('')
    setDueDateTo('')
    setSearchParams((current) => {
      const next = new URLSearchParams(current)
      next.delete('milestoneId')
      return next
    })
  }

  function handleViewChange(nextView: ExecutionViewKey) {
    setActiveTab(nextView)
    setSearchParams((current) => {
      const next = new URLSearchParams(current)
      next.set('view', nextView)
      return next
    })
  }

  const taskTabs: AnimatedContentTab[] = [
    {
      label: 'Now',
      value: 'now',
      content: (
        <TaskListSection
          title="Now"
          description="Urgent, due-today, overdue, at-risk, and active execution work is collected here."
          items={applyWorkspaceFilters(nowTasks)}
        />
      ),
      contentClassName: 'border-0 bg-transparent p-0 shadow-none',
    },
    {
      label: 'Queue',
      value: 'queue',
      content: (
        <TaskListSection
          title="Queue"
          description="Pending and upcoming work stays here until it becomes active execution."
          items={applyWorkspaceFilters(queueTasks)}
        />
      ),
      contentClassName: 'border-0 bg-transparent p-0 shadow-none',
    },
    {
      label: 'Focus',
      value: 'focus',
      content: (
        <TaskListSection
          title="Focus"
          description="Your owned high-priority and non-normal health tasks stay in this focused lane."
          items={applyWorkspaceFilters(focusTasks)}
        />
      ),
      contentClassName: 'border-0 bg-transparent p-0 shadow-none',
    },
    {
      label: 'Review',
      value: 'review',
      content: (
        <TaskListSection
          title="Review"
          description="Tasks waiting for approval, rejection, or final sign-off are grouped here."
          items={applyWorkspaceFilters(reviewTasks)}
        />
      ),
      contentClassName: 'border-0 bg-transparent p-0 shadow-none',
    },
    {
      label: 'Done',
      value: 'done',
      content: (
        <TaskListSection
          title="Done"
          description="Finalized work records stay here once execution is closed."
          items={applyWorkspaceFilters(doneTasks)}
        />
      ),
      contentClassName: 'border-0 bg-transparent p-0 shadow-none',
    },
  ]

  const activeViewDescription: Record<ExecutionViewKey, string> = {
    now: 'Triage what needs attention first.',
    queue: 'Sequence upcoming work without opening every record.',
    focus: 'Keep your critical owned work in one lane.',
    review: 'Resolve approvals and feedback quickly.',
    done: 'Inspect completed work without cluttering active execution.',
  }

  const healthCounts = useMemo(() => {
    return items.reduce<Record<TaskHealthStatus, number>>((accumulator, item) => {
      accumulator[item.taskHealth.status] += 1
      return accumulator
    }, { normal: 0, at_risk: 0, stuck: 0, blocked: 0 })
  }, [items])

  if (loading) {
    return (
      <Card className="rounded-md border-border/70 shadow-none">
        <CardContent className="p-8 text-sm text-muted-foreground">Loading task workspace...</CardContent>
      </Card>
    )
  }

  return (
    <div className="mx-auto max-w-7xl space-y-4 pt-1">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div className="space-y-2">
          <div className="inline-flex w-fit items-center gap-2 rounded-full border border-border/70 bg-muted/20 px-3 py-1 text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">
            <UserRound className="size-3.5" />
            Task Management
          </div>
          <div className="space-y-1">
            <h1 className="text-2xl font-semibold tracking-tight">Operate work by execution mode, not by list overload.</h1>
            <p className="max-w-3xl text-sm text-muted-foreground">
              Move between active execution, queued work, focused ownership, review, and done without depending on project hierarchy.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Button type="button" variant="outline" onClick={() => window.location.reload()}>
            Refresh
          </Button>
          <Button type="button" onClick={() => { void navigate('/admin/dashboard/task/tasks/new') }}>
            <Plus className="size-4" />
            New Task
          </Button>
        </div>
      </div>

      {errorMessage ? (
        <Card className="rounded-md border-destructive/30 bg-destructive/5 shadow-none">
          <CardContent className="p-4 text-sm text-destructive">{errorMessage}</CardContent>
        </Card>
      ) : null}

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
        <WorkspaceMetric
          label="Now"
          value={nowTasks.length}
          hint="Active, urgent, due-today, and at-risk work."
          icon={Clock3}
          active={activeTab === 'now'}
          onClick={() => handleViewChange('now')}
        />
        <WorkspaceMetric
          label="Queue"
          value={queueTasks.length}
          hint="Pending and upcoming work waiting to start."
          icon={ListTodo}
          active={activeTab === 'queue'}
          onClick={() => handleViewChange('queue')}
        />
        <WorkspaceMetric
          label="Focus"
          value={focusTasks.length}
          hint="Your critical owned tasks with pressure signals."
          icon={Target}
          active={activeTab === 'focus'}
          onClick={() => handleViewChange('focus')}
        />
        <WorkspaceMetric
          label="Review"
          value={reviewTasks.length}
          hint="Tasks waiting for approval or feedback."
          icon={UserRound}
          active={activeTab === 'review'}
          onClick={() => handleViewChange('review')}
        />
        <WorkspaceMetric
          label="Done"
          value={doneTasks.length}
          hint="Closed work records already finalized."
          icon={CheckCircle2}
          active={activeTab === 'done'}
          onClick={() => handleViewChange('done')}
        />
      </div>

      <Card className="rounded-md border-border/70 shadow-none">
        <CardContent className="grid gap-3 p-4 md:grid-cols-2 xl:grid-cols-[1.1fr_1fr_1fr_1fr_auto] xl:items-end">
          <div className="rounded-md border border-border/60 bg-muted/15 p-3">
            <p className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">Execution View</p>
            <p className="mt-1 text-sm font-semibold text-foreground">{taskTabs.find((tab) => tab.value === activeTab)?.label}</p>
            <p className="mt-1 text-xs text-muted-foreground">{activeViewDescription[activeTab]}</p>
          </div>
          <div className="rounded-md border border-border/60 bg-muted/15 p-3">
            <p className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">Health Signals</p>
            <p className="mt-1 text-sm font-semibold text-foreground">
              {healthCounts.at_risk} at risk · {healthCounts.stuck} stuck
            </p>
            <p className="mt-1 text-xs text-muted-foreground">{healthCounts.blocked} blocked · {healthCounts.normal} normal</p>
          </div>
          <div className="rounded-md border border-border/60 bg-muted/15 p-3">
            <p className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">Assigned To You</p>
            <p className="mt-1 text-sm font-semibold text-foreground">{items.filter((item) => item.assigneeId === currentUserId).length}</p>
            <p className="mt-1 text-xs text-muted-foreground">Owned work across all execution modes.</p>
          </div>
          <div className="rounded-md border border-border/60 bg-muted/15 p-3">
            <p className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">Overdue</p>
            <p className="mt-1 text-sm font-semibold text-foreground">{items.filter((item) => item.taskHealth.signals.overdue === true).length}</p>
            <p className="mt-1 text-xs text-muted-foreground">Tasks already past due and not finalized.</p>
          </div>
          <Button type="button" variant="outline" onClick={clearWorkspaceFilters}>
            Reset filters
          </Button>
        </CardContent>
      </Card>

      {selectedMilestoneId ? (
        <div className="flex items-center justify-between gap-3 rounded-md border border-border/70 bg-muted/15 px-4 py-3 text-sm">
          <p className="text-muted-foreground">
            Milestone overlay <span className="font-medium text-foreground">{selectedMilestoneId}</span>
          </p>
          <Button type="button" variant="ghost" size="sm" onClick={() => {
            setSearchParams((current) => {
              const next = new URLSearchParams(current)
              next.delete('milestoneId')
              return next
            })
          }}>
            Clear milestone
          </Button>
        </div>
      ) : null}

      <Card className="rounded-md border-border/70 shadow-none">
        <CardContent className="grid gap-4 p-4 md:grid-cols-2 xl:grid-cols-6 xl:items-end">
          <div className="space-y-2">
            <Label htmlFor="task-filter-template">Template</Label>
            <select
              id="task-filter-template"
              className="h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm outline-none transition-[color,box-shadow] focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
              value={selectedTemplate}
              onChange={(event) => setSelectedTemplate(event.target.value)}
            >
              <option value="all">All templates</option>
              {templateOptions.map((templateName) => (
                <option key={templateName} value={templateName}>{templateName}</option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="task-filter-tag">Tag</Label>
            <select
              id="task-filter-tag"
              className="h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm outline-none transition-[color,box-shadow] focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
              value={selectedTag}
              onChange={(event) => setSelectedTag(event.target.value)}
            >
              <option value="all">All tags</option>
              {tagOptions.map((tag) => (
                <option key={tag} value={tag}>{tag}</option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="task-filter-group">Task Group</Label>
            <select
              id="task-filter-group"
              className="h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm outline-none transition-[color,box-shadow] focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
              value={selectedTaskGroup}
              onChange={(event) => setSelectedTaskGroup(event.target.value)}
            >
              <option value="all">All groups</option>
              {taskGroupOptions.map((groupTitle) => (
                <option key={groupTitle} value={groupTitle}>{groupTitle}</option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="task-filter-verified">Verification</Label>
            <select
              id="task-filter-verified"
              className="h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm outline-none transition-[color,box-shadow] focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
              value={verifiedFilter}
              onChange={(event) => setVerifiedFilter(event.target.value as VerifiedFilterKey)}
            >
              <option value="all">All tasks</option>
              <option value="verified">Verified</option>
              <option value="unverified">Unverified</option>
            </select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="task-filter-due-from">Due date from</Label>
            <Input id="task-filter-due-from" type="date" value={dueDateFrom} onChange={(event) => setDueDateFrom(event.target.value)} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="task-filter-due-to">Due date to</Label>
            <Input id="task-filter-due-to" type="date" value={dueDateTo} onChange={(event) => setDueDateTo(event.target.value)} />
          </div>
        </CardContent>
      </Card>

      <AnimatedTabs defaultTabValue="now" selectedTabValue={activeTab} onTabChange={(value) => handleViewChange(value as ExecutionViewKey)} tabs={taskTabs} />
    </div>
  )
}
