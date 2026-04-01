import type { MilestoneStatus, MilestoneUpsertPayload } from '@shared/index'
import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { CalendarClock, CheckCircle2, FolderKanban, Layers3, Plus } from 'lucide-react'
import { useAuth } from '@framework-core/web/auth/components/auth-provider'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { StatusBadge } from '@/components/ui/status-badge'
import { Textarea } from '@/components/ui/textarea'
import { createMilestone, HttpError, listMilestones } from '@/shared/api/client'
import { showFailedActionToast, showSavedToast } from '@/shared/notifications/toast'

function toErrorMessage(error: unknown) {
  if (error instanceof HttpError) return error.message
  if (error instanceof Error) return error.message
  return 'Failed to load milestones.'
}

function formatDate(value: string | null) {
  if (!value) return 'Not scheduled'
  const parsedValue = new Date(value)
  if (Number.isNaN(parsedValue.getTime())) return value
  return new Intl.DateTimeFormat('en-IN', { dateStyle: 'medium' }).format(parsedValue)
}

function getStatusTone(status: MilestoneStatus) {
  switch (status) {
    case 'active':
      return 'publishing' as const
    case 'completed':
      return 'active' as const
    case 'archived':
      return 'manual' as const
  }
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

export function TaskMilestoneListPage() {
  const navigate = useNavigate()
  const { session } = useAuth()
  const [items, setItems] = useState<Awaited<ReturnType<typeof listMilestones>>>([])
  const [loading, setLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [query, setQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | MilestoneStatus>('all')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState<MilestoneUpsertPayload>({
    title: '',
    description: null,
    entityType: null,
    entityId: null,
    status: 'active',
    dueDate: null,
  })

  useEffect(() => {
    const accessToken = session?.accessToken
    if (!accessToken) {
      setLoading(false)
      return
    }
    const token: string = accessToken

    let cancelled = false
    async function load() {
      setLoading(true)
      setErrorMessage(null)
      try {
        const nextItems = await listMilestones(token)
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
    return () => { cancelled = true }
  }, [session?.accessToken])

  const filteredItems = useMemo(() => items.filter((item) => {
    if (statusFilter !== 'all' && item.status !== statusFilter) {
      return false
    }
    const normalizedQuery = query.trim().toLowerCase()
    if (!normalizedQuery) {
      return true
    }
    return [
      item.title,
      item.description ?? '',
      item.entityType ?? '',
      item.entityId ?? '',
    ].some((value) => value.toLowerCase().includes(normalizedQuery))
  }), [items, query, statusFilter])

  const totals = useMemo(() => ({
    total: items.length,
    active: items.filter((item) => item.status === 'active').length,
    completed: items.filter((item) => item.status === 'completed').length,
    overdueTasks: items.reduce((sum, item) => sum + item.taskStats.overdue, 0),
  }), [items])

  async function handleCreateMilestone(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!session?.accessToken) {
      setErrorMessage('Authorization token is required.')
      return
    }
    setSaving(true)
    setErrorMessage(null)
    try {
      const created = await createMilestone(session.accessToken, form)
      setItems((current) => [created, ...current])
      setDialogOpen(false)
      setForm({
        title: '',
        description: null,
        entityType: null,
        entityId: null,
        status: 'active',
        dueDate: null,
      })
      showSavedToast({
        entityLabel: 'milestone',
        recordName: created.title,
        referenceId: created.id,
        mode: 'create',
      })
      void navigate(`/admin/dashboard/task/milestones/${created.id}`)
    } catch (error) {
      const message = toErrorMessage(error)
      setErrorMessage(message)
      showFailedActionToast({ entityLabel: 'milestone', action: 'create', detail: message })
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return <Card className="rounded-md border-border/70 shadow-none"><CardContent className="p-8 text-sm text-muted-foreground">Loading milestones...</CardContent></Card>
  }

  return (
    <div className="mx-auto max-w-7xl space-y-4 pt-1">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div className="space-y-2">
          <div className="inline-flex w-fit items-center gap-2 rounded-full border border-border/70 bg-muted/20 px-3 py-1 text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">
            <FolderKanban className="size-3.5" />
            Milestone Management
          </div>
          <div className="space-y-1">
            <h1 className="text-2xl font-semibold tracking-tight">Group execution into milestones, not scattered task lists.</h1>
            <p className="max-w-3xl text-sm text-muted-foreground">
              Use milestones as the operating context for linked work, due dates, and task rollups so the team can execute against one shared objective.
            </p>
          </div>
        </div>
        <Button type="button" onClick={() => setDialogOpen(true)}>
          <Plus className="size-4" />
          New Milestone
        </Button>
      </div>

      {errorMessage ? (
        <Card className="rounded-md border-destructive/30 bg-destructive/5 shadow-none">
          <CardContent className="p-4 text-sm text-destructive">{errorMessage}</CardContent>
        </Card>
      ) : null}

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <WorkspaceMetric label="Total Milestones" value={totals.total} hint="All execution groups currently in the system." icon={FolderKanban} />
        <WorkspaceMetric label="Active" value={totals.active} hint="Live milestones still driving team work." icon={Layers3} />
        <WorkspaceMetric label="Completed" value={totals.completed} hint="Milestones already closed out by the team." icon={CheckCircle2} />
        <WorkspaceMetric label="Overdue Tasks" value={totals.overdueTasks} hint="Open risk carried by linked milestone work." icon={CalendarClock} />
      </div>

      <Card className="rounded-md border-border/70 shadow-none">
        <CardHeader className="pb-4">
          <CardTitle>Milestone Records</CardTitle>
          <CardDescription>Filter execution groups, inspect their task rollups, and open the one that needs attention.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_220px]">
            <div className="grid gap-2">
              <Label htmlFor="milestone-query">Search</Label>
              <Input id="milestone-query" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search title, description, entity" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="milestone-status">Status</Label>
              <select id="milestone-status" className="h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm outline-none transition-[color,box-shadow] focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as 'all' | MilestoneStatus)}>
                <option value="all">All statuses</option>
                <option value="active">Active</option>
                <option value="completed">Completed</option>
                <option value="archived">Archived</option>
              </select>
            </div>
          </div>

          {filteredItems.length === 0 ? (
            <Card className="rounded-md border-border/70 shadow-none">
              <CardContent className="flex min-h-52 flex-col items-center justify-center gap-3 p-6 text-center">
                <div className="rounded-full border border-border/70 bg-muted/25 p-3">
                  <Layers3 className="size-5 text-muted-foreground" />
                </div>
                <div className="space-y-1">
                  <p className="font-medium text-foreground">No milestones matched these filters.</p>
                  <p className="max-w-md text-sm text-muted-foreground">Create a new milestone or broaden the current filters.</p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-3">
              {filteredItems.map((item) => (
                <Card
                  key={item.id}
                  className="cursor-pointer rounded-md border-border/70 shadow-none transition-colors hover:border-border hover:bg-muted/10"
                  role="link"
                  tabIndex={0}
                  onClick={() => { void navigate(`/admin/dashboard/task/milestones/${item.id}`) }}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' || event.key === ' ') {
                      event.preventDefault()
                      void navigate(`/admin/dashboard/task/milestones/${item.id}`)
                    }
                  }}
                >
                  <CardHeader className="space-y-3 pb-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-1">
                        <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Milestone ID {item.id}</p>
                        <CardTitle className="text-base">{item.title}</CardTitle>
                        <CardDescription className="line-clamp-2 max-w-3xl">
                          {item.description?.trim() || 'No milestone description added yet.'}
                        </CardDescription>
                      </div>
                      <div className="flex flex-col items-end gap-2 text-right">
                        <StatusBadge tone={getStatusTone(item.status)}>{item.status}</StatusBadge>
                        <CardDescription>Due {formatDate(item.dueDate)}</CardDescription>
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 pt-1">
                      <StatusBadge tone="publishing">{item.taskStats.totalTasks} tasks</StatusBadge>
                      <StatusBadge tone="manual">{item.taskStats.pending} pending</StatusBadge>
                      <StatusBadge tone="publishing">{item.taskStats.inProgress} in progress</StatusBadge>
                      <StatusBadge tone="featured">{item.taskStats.review} review</StatusBadge>
                      <StatusBadge tone="active">{item.taskStats.finalized} finalized</StatusBadge>
                      {item.taskStats.overdue > 0 ? <StatusBadge tone="manual">{item.taskStats.overdue} overdue</StatusBadge> : null}
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-border/60 pt-3 text-sm">
                      <span className="text-muted-foreground">Entity <span className="font-medium text-foreground">{item.entityType ?? 'General'}</span></span>
                      <span className="text-muted-foreground">Link <span className="font-medium text-foreground">{item.entityId ?? 'Not linked'}</span></span>
                      <span className="ml-auto font-medium text-foreground">Open milestone</span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-xl">
          <form className="grid gap-4" onSubmit={(event) => { void handleCreateMilestone(event) }}>
            <DialogHeader>
              <DialogTitle>Create Milestone</DialogTitle>
            </DialogHeader>
            <div className="grid gap-2">
              <Label htmlFor="milestone-title">Title</Label>
              <Input id="milestone-title" value={form.title} onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))} placeholder="Ex: Product price verification" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="milestone-description">Description</Label>
              <Textarea id="milestone-description" rows={4} value={form.description ?? ''} onChange={(event) => setForm((current) => ({ ...current, description: event.target.value || null }))} placeholder="Short execution goal for this milestone." />
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="grid gap-2">
                <Label htmlFor="milestone-status-input">Status</Label>
                <select id="milestone-status-input" className="h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm outline-none transition-[color,box-shadow] focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50" value={form.status} onChange={(event) => setForm((current) => ({ ...current, status: event.target.value as MilestoneStatus }))}>
                  <option value="active">Active</option>
                  <option value="completed">Completed</option>
                  <option value="archived">Archived</option>
                </select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="milestone-due-date">Due Date</Label>
                <Input id="milestone-due-date" type="date" value={form.dueDate ?? ''} onChange={(event) => setForm((current) => ({ ...current, dueDate: event.target.value || null }))} />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={saving}>{saving ? 'Creating...' : 'Create Milestone'}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
