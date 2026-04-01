import type { TaskTemplateSummary } from '@shared/index'
import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowRight, FileStack, Plus, Sparkles } from 'lucide-react'
import { useAuth } from '@framework-core/web/auth/components/auth-provider'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { StatusBadge } from '@/components/ui/status-badge'
import { HttpError, listTaskTemplates } from '@/shared/api/client'

function toErrorMessage(error: unknown) {
  if (error instanceof HttpError) return error.message
  if (error instanceof Error) return error.message
  return 'Failed to load task templates.'
}

function formatDate(value: string) {
  const parsedValue = new Date(value)
  if (Number.isNaN(parsedValue.getTime())) {
    return value
  }

  return new Intl.DateTimeFormat('en-IN', { dateStyle: 'medium' }).format(parsedValue)
}

export function TaskTemplateListPage() {
  const navigate = useNavigate()
  const { session } = useAuth()
  const [items, setItems] = useState<TaskTemplateSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [query, setQuery] = useState('')
  const [scopeFilter, setScopeFilter] = useState('all')
  const [stateFilter, setStateFilter] = useState('all')

  useEffect(() => {
    if (!session?.accessToken) {
      setItems([])
      setLoading(false)
      return
    }
    const accessToken = session.accessToken

    let cancelled = false
    async function load() {
      setLoading(true)
      setErrorMessage(null)
      try {
        const templates = await listTaskTemplates(accessToken)
        if (!cancelled) {
          setItems(templates)
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
    const normalizedQuery = query.trim().toLowerCase()
    if (normalizedQuery) {
      const matchesQuery = [
        item.name,
        item.scopeType,
        item.titleTemplate,
        item.descriptionTemplate ?? '',
        ...item.defaultTags,
      ].some((value) => value.toLowerCase().includes(normalizedQuery))
      if (!matchesQuery) {
        return false
      }
    }

    if (scopeFilter !== 'all' && item.scopeType !== scopeFilter) {
      return false
    }

    if (stateFilter === 'active' && !item.isActive) {
      return false
    }

    if (stateFilter === 'inactive' && item.isActive) {
      return false
    }

    return true
  }), [items, query, scopeFilter, stateFilter])

  const activeCount = items.filter((item) => item.isActive).length
  const inactiveCount = items.length - activeCount
  const totalChecklistItems = items.reduce((sum, item) => sum + item.checklistItemCount, 0)

  if (loading) {
    return (
      <Card className="rounded-md border-border/70 shadow-none">
        <CardContent className="p-8 text-sm text-muted-foreground">Loading task templates...</CardContent>
      </Card>
    )
  }

  return (
    <div className="mx-auto max-w-7xl space-y-4 pt-1">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div className="space-y-2">
          <div className="inline-flex w-fit items-center gap-2 rounded-full border border-border/70 bg-muted/20 px-3 py-1 text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">
            <FileStack className="size-3.5" />
            Template Control
          </div>
          <div className="space-y-1">
            <h1 className="text-2xl font-semibold tracking-tight">Keep reusable starters ready for fast task creation.</h1>
            <p className="max-w-3xl text-sm text-muted-foreground">
              Templates prefill task title, description, tags, and starter checklist items. After creation, each task stays fully independent.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Button type="button" variant="outline" onClick={() => { void navigate('/admin/dashboard/task/bulk') }}>
            Bulk Generator
          </Button>
          <Button type="button" onClick={() => { void navigate('/admin/dashboard/task/templates/new') }}>
            <Plus className="size-4" />
            New Template
          </Button>
        </div>
      </div>

      {errorMessage ? (
        <Card className="rounded-md border-destructive/30 bg-destructive/5 shadow-none">
          <CardContent className="p-4 text-sm text-destructive">{errorMessage}</CardContent>
        </Card>
      ) : null}

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <Card className="rounded-md border-border/70 shadow-none">
          <CardContent className="p-4">
            <p className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">Templates</p>
            <p className="mt-1 text-2xl font-semibold tracking-tight">{items.length}</p>
            <p className="mt-1 text-sm text-muted-foreground">Reusable starters available to operations.</p>
          </CardContent>
        </Card>
        <Card className="rounded-md border-border/70 shadow-none">
          <CardContent className="p-4">
            <p className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">Active</p>
            <p className="mt-1 text-2xl font-semibold tracking-tight">{activeCount}</p>
            <p className="mt-1 text-sm text-muted-foreground">Starters ready for immediate task creation.</p>
          </CardContent>
        </Card>
        <Card className="rounded-md border-border/70 shadow-none">
          <CardContent className="p-4">
            <p className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">Checklist Points</p>
            <p className="mt-1 text-2xl font-semibold tracking-tight">{totalChecklistItems}</p>
            <p className="mt-1 text-sm text-muted-foreground">Starter checklist items available for seeding new tasks.</p>
          </CardContent>
        </Card>
        <Card className="rounded-md border-border/70 shadow-none">
          <CardContent className="p-4">
            <p className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">Inactive</p>
            <p className="mt-1 text-2xl font-semibold tracking-tight">{inactiveCount}</p>
            <p className="mt-1 text-sm text-muted-foreground">Templates kept as drafts or paused from active use.</p>
          </CardContent>
        </Card>
      </div>

      <Card className="rounded-md border-border/70 shadow-none">
        <CardContent className="grid gap-4 p-4 md:grid-cols-[minmax(0,1.4fr)_220px_220px]">
          <div className="space-y-2">
            <label htmlFor="template-query" className="text-sm font-medium text-foreground">Search</label>
            <Input id="template-query" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search name, scope, title template, tags" />
          </div>
          <div className="space-y-2">
            <label htmlFor="template-scope" className="text-sm font-medium text-foreground">Scope</label>
            <select
              id="template-scope"
              className="h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm outline-none transition-[color,box-shadow] focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
              value={scopeFilter}
              onChange={(event) => setScopeFilter(event.target.value)}
            >
              <option value="all">All scopes</option>
              <option value="general">General</option>
              <option value="product">Product</option>
              <option value="invoice">Invoice</option>
              <option value="order">Order</option>
              <option value="customer">Customer</option>
              <option value="user">User</option>
            </select>
          </div>
          <div className="space-y-2">
            <label htmlFor="template-state" className="text-sm font-medium text-foreground">State</label>
            <select
              id="template-state"
              className="h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm outline-none transition-[color,box-shadow] focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
              value={stateFilter}
              onChange={(event) => setStateFilter(event.target.value)}
            >
              <option value="all">All</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-3">
        {filteredItems.map((item) => (
          <Card
            key={item.id}
            className="cursor-pointer rounded-md border-border/70 shadow-none transition-colors hover:border-border hover:bg-muted/10"
            role="link"
            tabIndex={0}
            onClick={() => { void navigate(`/admin/dashboard/task/templates/${item.id}/edit`) }}
            onKeyDown={(event) => {
              if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault()
                void navigate(`/admin/dashboard/task/templates/${item.id}/edit`)
              }
            }}
          >
            <CardHeader className="space-y-3 pb-3">
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1">
                  <CardTitle className="text-base">{item.name}</CardTitle>
                  <CardDescription className="line-clamp-2 max-w-3xl">
                    {item.descriptionTemplate?.trim() || item.titleTemplate}
                  </CardDescription>
                </div>
                <div className="flex flex-wrap items-center justify-end gap-2">
                  <StatusBadge tone={item.isActive ? 'active' : 'manual'}>{item.isActive ? 'Active' : 'Inactive'}</StatusBadge>
                  <StatusBadge tone="publishing">{item.scopeType}</StatusBadge>
                  <StatusBadge tone="featured">{item.defaultPriority}</StatusBadge>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-border/60 pt-3 text-sm">
                <span className="text-muted-foreground">Template ID <span className="font-medium text-foreground">{item.id}</span></span>
                <span className="text-muted-foreground">Checklist <span className="font-medium text-foreground">{item.checklistItemCount}</span></span>
                <span className="text-muted-foreground">Updated <span className="font-medium text-foreground">{formatDate(item.updatedAt)}</span></span>
                <div className="flex flex-wrap items-center gap-2">
                  {item.defaultTags.length > 0 ? item.defaultTags.map((tag) => (
                    <StatusBadge key={tag} tone="manual">{tag}</StatusBadge>
                  )) : <span className="text-muted-foreground">No default tags</span>}
                </div>
                <span className="ml-auto inline-flex items-center gap-1 font-medium text-foreground">
                  Edit template
                  <ArrowRight className="size-4" />
                </span>
              </div>
            </CardContent>
          </Card>
        ))}

        {filteredItems.length === 0 ? (
          <Card className="rounded-md border-border/70 shadow-none">
            <CardContent className="flex min-h-56 flex-col items-center justify-center gap-3 p-6 text-center">
              <div className="rounded-full border border-border/70 bg-muted/25 p-3">
                <Sparkles className="size-5 text-muted-foreground" />
              </div>
              <div className="space-y-1">
                <p className="font-medium text-foreground">No templates matched these filters.</p>
                <p className="max-w-md text-sm text-muted-foreground">Broaden the scope, clear a filter, or create the first starter template for this workflow.</p>
              </div>
              <div className="flex items-center gap-3">
                <Button type="button" variant="outline" onClick={() => { setQuery(''); setScopeFilter('all'); setStateFilter('all') }}>
                  Clear filters
                </Button>
                <Button type="button" asChild>
                  <Link to="/admin/dashboard/task/templates/new">Create template</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : null}
      </div>
    </div>
  )
}
