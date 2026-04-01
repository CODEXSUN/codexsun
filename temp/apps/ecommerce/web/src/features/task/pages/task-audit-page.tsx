import type { TaskAuditItem, TaskStatus, TaskTemplateSummary } from '@shared/index'
import { useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { AlertTriangle, ClipboardList, Search } from 'lucide-react'
import { useAuth } from '@framework-core/web/auth/components/auth-provider'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { StatusBadge } from '@/components/ui/status-badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { getTaskAuditList, HttpError, listTaskTemplates, listUsers } from '@/shared/api/client'

type VerificationFilter = 'all' | 'not_started' | 'partial' | 'completed'

function toErrorMessage(error: unknown) {
  if (error instanceof HttpError) return error.message
  if (error instanceof Error) return error.message
  return 'Failed to load task audit.'
}

function formatDate(value: string | null) {
  if (!value) return 'Not scheduled'
  const parsedValue = new Date(value)
  if (Number.isNaN(parsedValue.getTime())) {
    return value
  }

  return new Intl.DateTimeFormat('en-IN', { dateStyle: 'medium' }).format(parsedValue)
}

function getStatusTone(status: TaskStatus) {
  switch (status) {
    case 'pending':
      return 'manual' as const
    case 'in_progress':
      return 'publishing' as const
    case 'review':
      return 'featured' as const
    case 'finalized':
      return 'active' as const
  }
}

function verificationLabel(value: TaskAuditItem['verificationState']) {
  switch (value) {
    case 'not_started':
      return 'Not Started'
    case 'partial':
      return 'Partial'
    case 'completed':
      return 'Completed'
  }
}

function sortByProblemSeverity(items: TaskAuditItem[]) {
  return [...items].sort((left, right) => {
    const leftScore = Number(left.isOverdue) * 8 + Number(left.isStuck) * 4 + Number(left.isIncompleteVerification) * 2
    const rightScore = Number(right.isOverdue) * 8 + Number(right.isStuck) * 4 + Number(right.isIncompleteVerification) * 2

    if (leftScore !== rightScore) {
      return rightScore - leftScore
    }

    const leftUpdatedAt = new Date(left.updatedAt).getTime()
    const rightUpdatedAt = new Date(right.updatedAt).getTime()
    if (leftUpdatedAt !== rightUpdatedAt) {
      return leftUpdatedAt - rightUpdatedAt
    }

    return left.id.localeCompare(right.id)
  })
}

export function TaskAuditPage() {
  const { session } = useAuth()
  const [searchParams, setSearchParams] = useSearchParams()
  const [items, setItems] = useState<TaskAuditItem[]>([])
  const [templates, setTemplates] = useState<TaskTemplateSummary[]>([])
  const [users, setUsers] = useState<{ id: string; name: string }[]>([])
  const [loading, setLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const query = searchParams.get('q') ?? ''
  const templateId = searchParams.get('templateId') ?? 'all'
  const assigneeId = searchParams.get('assigneeId') ?? 'all'
  const status = searchParams.get('status') ?? 'all'
  const verificationState = (searchParams.get('verificationState') as VerificationFilter | null) ?? 'all'
  const dateFrom = searchParams.get('dateFrom') ?? ''
  const dateTo = searchParams.get('dateTo') ?? ''
  const isOverdueFilter = searchParams.get('isOverdue') === 'true'
  const isStuckFilter = searchParams.get('isStuck') === 'true'
  const isIncompleteFilter = searchParams.get('isIncompleteVerification') === 'true'

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
        const [nextItems, nextTemplates, nextUsers] = await Promise.all([
          getTaskAuditList(accessToken, {
            templateId: templateId !== 'all' ? templateId : undefined,
            assigneeId: assigneeId !== 'all' && assigneeId !== 'unassigned' ? assigneeId : undefined,
            status: status !== 'all' ? status : undefined,
            verificationState: verificationState !== 'all' ? verificationState : undefined,
            dateFrom: dateFrom || undefined,
            dateTo: dateTo || undefined,
          }),
          listTaskTemplates(accessToken),
          listUsers(accessToken),
        ])

        if (!cancelled) {
          setItems(nextItems)
          setTemplates(nextTemplates)
          setUsers(nextUsers.map((user) => ({ id: user.id, name: user.displayName || user.email })))
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
  }, [assigneeId, dateFrom, dateTo, session?.accessToken, status, templateId, verificationState])

  const filteredItems = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase()
    const searchedItems = !normalizedQuery
      ? items
      : items.filter((item) => [
          item.id,
          item.title,
          item.templateName ?? '',
          item.entityLabel ?? '',
          item.assigneeName ?? '',
          item.creatorName,
        ].some((value) => value.toLowerCase().includes(normalizedQuery)))

    return sortByProblemSeverity(searchedItems.filter((item) => {
      if (assigneeId === 'unassigned' && item.assigneeId) {
        return false
      }

      if (isOverdueFilter && !item.isOverdue) {
        return false
      }

      if (isStuckFilter && !item.isStuck) {
        return false
      }

      if (isIncompleteFilter && !item.isIncompleteVerification) {
        return false
      }

      return true
    }))
  }, [assigneeId, isIncompleteFilter, isOverdueFilter, isStuckFilter, items, query])

  const incompleteCount = filteredItems.filter((item) => item.isIncompleteVerification).length
  const overdueCount = filteredItems.filter((item) => item.isOverdue).length
  const stuckCount = filteredItems.filter((item) => item.isStuck).length

  function updateFilter(name: string, value: string) {
    const nextParams = new URLSearchParams(searchParams)
    if (!value || value === 'all') {
      nextParams.delete(name)
    } else {
      nextParams.set(name, value)
    }
    setSearchParams(nextParams)
  }

  function clearFilters() {
    setSearchParams({})
  }

  if (loading) {
    return (
      <Card className="rounded-md border-border/70 shadow-none">
        <CardContent className="p-8 text-sm text-muted-foreground">Loading task audit...</CardContent>
      </Card>
    )
  }

  return (
    <div className="mx-auto max-w-7xl space-y-4 pt-1">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div className="space-y-2">
          <div className="inline-flex w-fit items-center gap-2 rounded-full border border-border/70 bg-muted/20 px-3 py-1 text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">
            <ClipboardList className="size-3.5" />
            Audit View
          </div>
          <div className="space-y-1">
            <h1 className="text-2xl font-semibold tracking-tight">Expose incomplete verification before it gets reported as done.</h1>
            <p className="max-w-3xl text-sm text-muted-foreground">
              Each row shows a task with its proof state, ownership, due date, and freshness. Use this to detect fake completion, delays, and stalled execution.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Button type="button" variant="outline" asChild>
            <Link to="/admin/dashboard/task/insights">Open Insights</Link>
          </Button>
          <Button type="button" variant="outline" onClick={clearFilters}>Clear filters</Button>
        </div>
      </div>

      {errorMessage ? (
        <Card className="rounded-md border-destructive/30 bg-destructive/5 shadow-none">
          <CardContent className="p-4 text-sm text-destructive">{errorMessage}</CardContent>
        </Card>
      ) : null}

      <div className="grid gap-3 md:grid-cols-3">
        <Card className="rounded-md border-border/70 shadow-none">
          <CardContent className="p-4">
            <p className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">Incomplete Verification</p>
            <p className="mt-1 text-2xl font-semibold tracking-tight">{incompleteCount}</p>
            <p className="mt-1 text-sm text-muted-foreground">Checklist-backed tasks where completion is still below the required proof.</p>
          </CardContent>
        </Card>
        <Card className="rounded-md border-border/70 shadow-none">
          <CardContent className="p-4">
            <p className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">Overdue</p>
            <p className="mt-1 text-2xl font-semibold tracking-tight">{overdueCount}</p>
            <p className="mt-1 text-sm text-muted-foreground">Tasks past due and still not finalized.</p>
          </CardContent>
        </Card>
        <Card className="rounded-md border-border/70 shadow-none">
          <CardContent className="p-4">
            <p className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">Stuck</p>
            <p className="mt-1 text-2xl font-semibold tracking-tight">{stuckCount}</p>
            <p className="mt-1 text-sm text-muted-foreground">In-progress tasks that have not moved for several days.</p>
          </CardContent>
        </Card>
      </div>

      <Card className="rounded-md border-border/70 shadow-none">
        <CardContent className="grid gap-4 p-4 md:grid-cols-2 xl:grid-cols-[minmax(0,1.1fr)_220px_220px_220px_180px_180px]">
          <div className="space-y-2">
            <Label htmlFor="task-audit-query">Search</Label>
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input id="task-audit-query" className="pl-9" value={query} onChange={(event) => updateFilter('q', event.target.value)} placeholder="Search task, template, entity, assignee" />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="task-audit-template">Template</Label>
            <select id="task-audit-template" className="h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm outline-none transition-[color,box-shadow] focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50" value={templateId} onChange={(event) => updateFilter('templateId', event.target.value)}>
              <option value="all">All templates</option>
              {templates.map((template) => (
                <option key={template.id} value={template.id}>{template.name}</option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="task-audit-assignee">Assignee</Label>
            <select id="task-audit-assignee" className="h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm outline-none transition-[color,box-shadow] focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50" value={assigneeId} onChange={(event) => updateFilter('assigneeId', event.target.value)}>
              <option value="all">All assignees</option>
              <option value="unassigned">Unassigned</option>
              {users.map((user) => (
                <option key={user.id} value={user.id}>{user.name}</option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="task-audit-status">Status</Label>
            <select id="task-audit-status" className="h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm outline-none transition-[color,box-shadow] focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50" value={status} onChange={(event) => updateFilter('status', event.target.value)}>
              <option value="all">All statuses</option>
              <option value="pending">Pending</option>
              <option value="in_progress">In Progress</option>
              <option value="review">Review</option>
              <option value="finalized">Finalized</option>
            </select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="task-audit-verification">Verification</Label>
            <select id="task-audit-verification" className="h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm outline-none transition-[color,box-shadow] focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50" value={verificationState} onChange={(event) => updateFilter('verificationState', event.target.value)}>
              <option value="all">All</option>
              <option value="not_started">Not started</option>
              <option value="partial">Partial</option>
              <option value="completed">Completed</option>
            </select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="task-audit-date-from">Due From</Label>
            <Input id="task-audit-date-from" type="date" value={dateFrom} onChange={(event) => updateFilter('dateFrom', event.target.value)} />
          </div>
          <div className="space-y-2 xl:col-start-6">
            <Label htmlFor="task-audit-date-to">Due To</Label>
            <Input id="task-audit-date-to" type="date" value={dateTo} onChange={(event) => updateFilter('dateTo', event.target.value)} />
          </div>
          <div className="flex flex-wrap items-center gap-2 md:col-span-2 xl:col-span-6">
            <Button type="button" variant={isOverdueFilter ? 'default' : 'outline'} size="sm" onClick={() => updateFilter('isOverdue', isOverdueFilter ? '' : 'true')}>
              Overdue only
            </Button>
            <Button type="button" variant={isStuckFilter ? 'default' : 'outline'} size="sm" onClick={() => updateFilter('isStuck', isStuckFilter ? '' : 'true')}>
              Stuck only
            </Button>
            <Button type="button" variant={isIncompleteFilter ? 'default' : 'outline'} size="sm" onClick={() => updateFilter('isIncompleteVerification', isIncompleteFilter ? '' : 'true')}>
              Incomplete only
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="rounded-md border-border/70 shadow-none">
        <CardHeader className="pb-4">
          <CardTitle>Task Audit</CardTitle>
          <CardDescription>One row per task with proof status, due date, and ownership context.</CardDescription>
        </CardHeader>
        <CardContent className="pt-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Task</TableHead>
                <TableHead>Template</TableHead>
                <TableHead>Entity</TableHead>
                <TableHead>Assignee</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Verification</TableHead>
                <TableHead>Due Date</TableHead>
                <TableHead>Last Updated</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredItems.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="py-10 text-center text-muted-foreground">
                    No tasks matched this audit filter.
                  </TableCell>
                </TableRow>
              ) : filteredItems.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>
                    <Link to={`/admin/dashboard/task/tasks/${item.id}`} className="space-y-1 hover:underline">
                      <div className="font-medium text-foreground">{item.title}</div>
                      <div className="text-xs uppercase tracking-[0.14em] text-muted-foreground">Task ID {item.id}</div>
                    </Link>
                  </TableCell>
                  <TableCell>{item.templateName ?? 'General task'}</TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      <div>{item.entityLabel ?? item.entityId ?? '-'}</div>
                      <div className="text-xs uppercase tracking-[0.14em] text-muted-foreground">{item.taskContext.domain}</div>
                    </div>
                  </TableCell>
                  <TableCell>{item.assigneeName ?? 'Unassigned'}</TableCell>
                  <TableCell>
                    <div className="flex flex-wrap items-center gap-2">
                      <StatusBadge tone={getStatusTone(item.status)}>{item.status}</StatusBadge>
                      {item.isStuck ? <StatusBadge tone="featured">Stuck</StatusBadge> : null}
                      {item.isOverdue ? <StatusBadge tone="manual">Overdue</StatusBadge> : null}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      <StatusBadge tone={item.verificationState === 'completed' ? 'active' : item.verificationState === 'partial' ? 'featured' : 'manual'}>
                        {verificationLabel(item.verificationState)}
                      </StatusBadge>
                      <div className="text-xs text-muted-foreground">
                        {item.checklistCompletionCount}/{item.checklistTotalCount}
                        {item.isIncompleteVerification ? (
                          <span className="ml-2 inline-flex items-center gap-1 text-amber-700">
                            <AlertTriangle className="size-3" />
                            Incomplete
                          </span>
                        ) : null}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>{formatDate(item.dueDate)}</TableCell>
                  <TableCell>{formatDate(item.updatedAt)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
