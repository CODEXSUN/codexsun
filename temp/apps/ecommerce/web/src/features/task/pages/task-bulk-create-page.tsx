import type { MilestoneSummary, ProductSummary, TaskGroupSummary, TaskPriority, TaskTemplateSummary } from '@shared/index'
import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowLeft, Boxes, Layers3, Package, Users } from 'lucide-react'
import { AutocompleteLookup } from '@/components/lookups/AutocompleteLookup'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { StatusBadge } from '@/components/ui/status-badge'
import { createTasksFromTemplateBulk, HttpError, listMilestones, listProducts, listTaskGroups, listTaskTemplates, listUsers } from '@/shared/api/client'
import { showFailedActionToast, showSavedToast } from '@/shared/notifications/toast'
import { useAuth } from '@framework-core/web/auth/components/auth-provider'

type AssignmentMode = 'specific' | 'self' | 'unassigned'

function toErrorMessage(error: unknown) {
  if (error instanceof HttpError) return error.message
  if (error instanceof Error) return error.message
  return 'Failed to create tasks in bulk.'
}

export function TaskBulkCreatePage() {
  const navigate = useNavigate()
  const { session } = useAuth()
  const [templates, setTemplates] = useState<TaskTemplateSummary[]>([])
  const [products, setProducts] = useState<ProductSummary[]>([])
  const [users, setUsers] = useState<{ id: string; name: string }[]>([])
  const [milestones, setMilestones] = useState<MilestoneSummary[]>([])
  const [taskGroups, setTaskGroups] = useState<TaskGroupSummary[]>([])
  const [selectedTemplateId, setSelectedTemplateId] = useState('')
  const [selectedMilestoneId, setSelectedMilestoneId] = useState('')
  const [selectedTaskGroupId, setSelectedTaskGroupId] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [selectedTag, setSelectedTag] = useState('all')
  const [assignmentMode, setAssignmentMode] = useState<AssignmentMode>('unassigned')
  const [assigneeId, setAssigneeId] = useState('')
  const [dueDate, setDueDate] = useState('')
  const [priority, setPriority] = useState<TaskPriority | ''>('')
  const [extraTagsInput, setExtraTagsInput] = useState('')
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
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
        const [templateItems, productItems, userItems, milestoneItems, taskGroupItems] = await Promise.all([
          listTaskTemplates(accessToken, 'product'),
          listProducts(),
          listUsers(accessToken),
          listMilestones(accessToken),
          listTaskGroups(accessToken, { status: 'active' }),
        ])
        if (!cancelled) {
          setTemplates(templateItems.filter((item) => (item.scopeType === 'general' || item.scopeType === 'product') && item.isActive))
          setProducts(productItems.filter((item) => item.isActive))
          setUsers(userItems.map((user) => ({ id: user.id, name: user.displayName || user.email })))
          setMilestones(milestoneItems)
          setTaskGroups(taskGroupItems)
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

  const selectedTemplate = templates.find((item) => item.id === selectedTemplateId) ?? null
  const categoryOptions = useMemo(
    () => [...new Set(products.map((item) => item.categoryName).filter((value): value is string => Boolean(value?.trim())))].sort((left, right) => left.localeCompare(right)),
    [products],
  )
  const tagOptions = useMemo(
    () => [...new Set(products.flatMap((item) => item.tagNames))].sort((left, right) => left.localeCompare(right)),
    [products],
  )
  const userOptions = useMemo(
    () => users.map((user) => ({ value: user.id, label: user.name })),
    [users],
  )
  const milestoneOptions = useMemo(
    () => milestones.filter((milestone) => milestone.status === 'active').map((milestone) => ({ value: milestone.id, label: milestone.title })),
    [milestones],
  )
  const taskGroupOptions = useMemo(
    () => taskGroups.filter((group) => group.status === 'active').map((group) => ({ value: group.id, label: group.title })),
    [taskGroups],
  )
  const templateOptions = useMemo(
    () => templates.map((template) => ({ value: template.id, label: template.name })),
    [templates],
  )

  const filteredProducts = useMemo(() => products.filter((item) => {
    const normalizedQuery = searchQuery.trim().toLowerCase()
    if (normalizedQuery) {
      const matchesQuery = [
        item.name,
        item.sku,
        item.slug,
        item.categoryName ?? '',
        ...item.tagNames,
      ].some((value) => value.toLowerCase().includes(normalizedQuery))
      if (!matchesQuery) {
        return false
      }
    }

    if (selectedCategory !== 'all' && item.categoryName !== selectedCategory) {
      return false
    }

    if (selectedTag !== 'all' && !item.tagNames.includes(selectedTag)) {
      return false
    }

    return true
  }), [products, searchQuery, selectedCategory, selectedTag])

  const filteredProductIds = filteredProducts.map((item) => item.id)
  const selectedFilteredCount = filteredProductIds.filter((id) => selectedProductIds.includes(id)).length
  const selectedCount = selectedProductIds.length
  const mergedTags = useMemo(() => {
    const manualTags = extraTagsInput.split(',').map((tag) => tag.trim()).filter(Boolean)
    return [...new Set([...(selectedTemplate?.defaultTags ?? []), ...manualTags])]
  }, [extraTagsInput, selectedTemplate?.defaultTags])

  function toggleProduct(productId: string) {
    setSelectedProductIds((current) => current.includes(productId)
      ? current.filter((id) => id !== productId)
      : [...current, productId])
  }

  function toggleFilteredSelection(checked: boolean) {
    setSelectedProductIds((current) => checked
      ? [...new Set([...current, ...filteredProductIds])]
      : current.filter((id) => !filteredProductIds.includes(id)))
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!session?.accessToken) {
      setErrorMessage('Authorization token is required.')
      return
    }
    if (!selectedTemplateId) {
      setErrorMessage('Choose a product starter template first.')
      return
    }
    if (!selectedMilestoneId) {
      setErrorMessage('Choose a milestone before creating tasks in bulk.')
      return
    }
    if (selectedProductIds.length === 0) {
      setErrorMessage('Select at least one product for bulk task creation.')
      return
    }
    if (assignmentMode === 'specific' && !assigneeId) {
      setErrorMessage('Choose an assignee when using specific assignment.')
      return
    }

    setSaving(true)
    setErrorMessage(null)
    try {
      const response = await createTasksFromTemplateBulk(session.accessToken, {
        templateId: selectedTemplateId,
        milestoneId: selectedMilestoneId,
        taskGroupId: selectedTaskGroupId || null,
        entityType: 'product',
        entityIds: selectedProductIds,
        assigneeMode: assignmentMode,
        assigneeId: assignmentMode === 'specific' ? assigneeId : null,
        dueDate: dueDate || null,
        priority: priority || undefined,
        tags: mergedTags,
      })
      showSavedToast({
        entityLabel: 'bulk task run',
        recordName: `${response.createdCount} product tasks`,
        referenceId: selectedTemplate?.name ?? selectedTemplateId,
        mode: 'create',
      })
      void navigate('/admin/dashboard/task/tasks')
    } catch (error) {
      const message = toErrorMessage(error)
      setErrorMessage(message)
      showFailedActionToast({ entityLabel: 'bulk task run', action: 'create', detail: message })
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <Card className="rounded-md border-border/70 shadow-none">
        <CardContent className="p-8 text-sm text-muted-foreground">Loading bulk generator...</CardContent>
      </Card>
    )
  }

  return (
    <form className="mx-auto max-w-7xl space-y-4 pt-1" onSubmit={(event) => { void handleSubmit(event) }}>
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <Button variant="ghost" size="sm" asChild className="-ml-3 mb-2">
            <Link to="/admin/dashboard/task"><ArrowLeft className="size-4" />Back to task app</Link>
          </Button>
          <h1 className="text-2xl font-semibold tracking-tight">Structured Bulk Generator</h1>
          <p className="mt-1 text-sm text-muted-foreground">Use a starter template plus milestone overlay to create many product tasks under one structured run.</p>
        </div>
        <div className="flex items-center gap-3">
          <Button type="button" variant="outline" onClick={() => { void navigate('/admin/dashboard/task/templates') }}>
            Manage Templates
          </Button>
          <Button type="submit" disabled={saving}>{saving ? 'Creating...' : `Create ${selectedCount} Tasks`}</Button>
        </div>
      </div>

      {errorMessage ? (
        <Card className="rounded-md border-destructive/30 bg-destructive/5 shadow-none">
          <CardContent className="p-4 text-sm text-destructive">{errorMessage}</CardContent>
        </Card>
      ) : null}

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.15fr)_minmax(0,1.85fr)]">
        <div className="space-y-4">
          <Card className="rounded-md border-border/70 shadow-none">
            <CardHeader className="pb-4">
              <CardTitle>Generation Rules</CardTitle>
              <CardDescription>Choose the structured run context first, then apply a starter template, ownership, deadline, and tags.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4">
              <div className="grid gap-2">
                <Label>Milestone Overlay</Label>
                <AutocompleteLookup value={selectedMilestoneId} onChange={setSelectedMilestoneId} options={milestoneOptions} placeholder="Select milestone" />
              </div>

              <div className="grid gap-2">
                <Label>Task Group</Label>
                <AutocompleteLookup value={selectedTaskGroupId} onChange={setSelectedTaskGroupId} options={taskGroupOptions} placeholder="Select task group" allowEmptyOption emptyOptionLabel="No group" />
              </div>

              <div className="grid gap-2">
                <Label>Starter Template</Label>
                <AutocompleteLookup value={selectedTemplateId} onChange={setSelectedTemplateId} options={templateOptions} placeholder="Select product starter template" />
              </div>

              <div className="grid gap-2">
                <Label>Assignment Rule</Label>
                <select
                  className="h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm outline-none transition-[color,box-shadow] focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
                  value={assignmentMode}
                  onChange={(event) => setAssignmentMode(event.target.value as AssignmentMode)}
                >
                  <option value="unassigned">Leave unassigned</option>
                  <option value="self">Assign to my self</option>
                  <option value="specific">Assign to specific user</option>
                </select>
              </div>

              {assignmentMode === 'specific' ? (
                <div className="grid gap-2">
                  <Label>Assignee</Label>
                  <AutocompleteLookup value={assigneeId} onChange={setAssigneeId} options={userOptions} placeholder="Select assignee" />
                </div>
              ) : null}

              <div className="grid gap-4 md:grid-cols-2">
                <div className="grid gap-2">
                  <Label>Due Date</Label>
                  <Input type="date" value={dueDate} onChange={(event) => setDueDate(event.target.value)} />
                </div>
                <div className="grid gap-2">
                  <Label>Priority Override</Label>
                  <select
                    className="h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm outline-none transition-[color,box-shadow] focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
                    value={priority}
                    onChange={(event) => setPriority(event.target.value as TaskPriority | '')}
                  >
                    <option value="">Use starter default</option>
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>
              </div>

              <div className="grid gap-2">
                <Label>Extra Tags</Label>
                <Input value={extraTagsInput} onChange={(event) => setExtraTagsInput(event.target.value)} placeholder="Ex: march-audit, owner-check" />
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-md border-border/70 shadow-none">
            <CardHeader className="pb-4">
              <CardTitle>Run Snapshot</CardTitle>
              <CardDescription>Quick readback before creating tasks.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-3">
              <div className="rounded-md border border-border/60 bg-muted/10 p-3">
                <div className="flex items-start gap-3">
                  <div className="rounded-full border border-border/70 bg-background p-2">
                    <Layers3 className="size-4 text-muted-foreground" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-foreground">{selectedTemplate?.name ?? 'No starter template selected'}</p>
                    <p className="text-xs text-muted-foreground">{selectedTemplate?.checklistItemCount ?? 0} starter checklist items and defaults will be copied into each created task.</p>
                  </div>
                </div>
              </div>
              <div className="rounded-md border border-border/60 bg-muted/10 p-3">
                <div className="flex items-start gap-3">
                  <div className="rounded-full border border-border/70 bg-background p-2">
                    <Boxes className="size-4 text-muted-foreground" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-foreground">{taskGroups.find((item) => item.id === selectedTaskGroupId)?.title ?? 'No task group selected'}</p>
                    <p className="text-xs text-muted-foreground">New tasks can also be collected into a lightweight task group for execution views.</p>
                  </div>
                </div>
              </div>
              <div className="rounded-md border border-border/60 bg-muted/10 p-3">
                <div className="flex items-start gap-3">
                  <div className="rounded-full border border-border/70 bg-background p-2">
                    <Layers3 className="size-4 text-muted-foreground" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-foreground">{milestones.find((item) => item.id === selectedMilestoneId)?.title ?? 'No milestone selected'}</p>
                    <p className="text-xs text-muted-foreground">Bulk-created tasks will be created under this structured milestone context.</p>
                  </div>
                </div>
              </div>
              <div className="rounded-md border border-border/60 bg-muted/10 p-3">
                <div className="flex items-start gap-3">
                  <div className="rounded-full border border-border/70 bg-background p-2">
                    <Package className="size-4 text-muted-foreground" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-foreground">{selectedCount} products selected</p>
                    <p className="text-xs text-muted-foreground">{selectedFilteredCount} of the currently filtered products are included in this run.</p>
                  </div>
                </div>
              </div>
              <div className="rounded-md border border-border/60 bg-muted/10 p-3">
                <div className="flex items-start gap-3">
                  <div className="rounded-full border border-border/70 bg-background p-2">
                    <Users className="size-4 text-muted-foreground" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-foreground">
                      {assignmentMode === 'specific'
                        ? users.find((user) => user.id === assigneeId)?.name ?? 'Specific assignee'
                        : assignmentMode === 'self'
                          ? 'My self'
                          : 'Unassigned'}
                    </p>
                    <p className="text-xs text-muted-foreground">Due date {dueDate || 'not scheduled'}{mergedTags.length > 0 ? ` • Tags ${mergedTags.join(', ')}` : ''}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          <Card className="rounded-md border-border/70 shadow-none">
            <CardHeader className="pb-4">
              <CardTitle>Product Filter</CardTitle>
              <CardDescription>Filter the catalog by name, category, and tag, then select the products that need tasks from this structured run.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4">
              <div className="grid gap-4 md:grid-cols-[minmax(0,1.2fr)_220px_220px]">
                <div className="grid gap-2">
                  <Label>Search</Label>
                  <Input value={searchQuery} onChange={(event) => setSearchQuery(event.target.value)} placeholder="Search product, SKU, slug, tag" />
                </div>
                <div className="grid gap-2">
                  <Label>Category</Label>
                  <select
                    className="h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm outline-none transition-[color,box-shadow] focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
                    value={selectedCategory}
                    onChange={(event) => setSelectedCategory(event.target.value)}
                  >
                    <option value="all">All categories</option>
                    {categoryOptions.map((item) => (
                      <option key={item} value={item}>{item}</option>
                    ))}
                  </select>
                </div>
                <div className="grid gap-2">
                  <Label>Tag</Label>
                  <select
                    className="h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm outline-none transition-[color,box-shadow] focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
                    value={selectedTag}
                    onChange={(event) => setSelectedTag(event.target.value)}
                  >
                    <option value="all">All tags</option>
                    {tagOptions.map((item) => (
                      <option key={item} value={item}>{item}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-border/60 bg-muted/10 p-3">
                <label className="flex items-center gap-3 text-sm font-medium text-foreground">
                  <Checkbox
                    checked={filteredProducts.length > 0 && selectedFilteredCount === filteredProducts.length}
                    onCheckedChange={(checked) => toggleFilteredSelection(Boolean(checked))}
                  />
                  Select all filtered products
                </label>
                <div className="flex items-center gap-2">
                  <StatusBadge tone="publishing">{filteredProducts.length} filtered</StatusBadge>
                  <StatusBadge tone="featured">{selectedCount} selected</StatusBadge>
                </div>
              </div>

              <div className="max-h-[38rem] space-y-3 overflow-y-auto pr-1">
                {filteredProducts.map((product) => (
                  <label key={product.id} className="flex cursor-pointer items-start gap-3 rounded-md border border-border/60 bg-background p-4 transition-colors hover:border-border hover:bg-muted/10">
                    <Checkbox checked={selectedProductIds.includes(product.id)} onCheckedChange={() => toggleProduct(product.id)} />
                    <div className="min-w-0 flex-1 space-y-1">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <p className="font-medium text-foreground">{product.name}</p>
                          <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground">SKU {product.sku} · {product.slug}</p>
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                          {product.categoryName ? <StatusBadge tone="publishing">{product.categoryName}</StatusBadge> : null}
                          <StatusBadge tone="active">Active</StatusBadge>
                        </div>
                      </div>
                      <p className="line-clamp-2 text-sm text-muted-foreground">{product.shortDescription?.trim() || product.description?.trim() || 'No description available.'}</p>
                      <div className="flex flex-wrap items-center gap-2">
                        {product.tagNames.length > 0 ? product.tagNames.map((tag) => (
                          <StatusBadge key={tag} tone="manual">{tag}</StatusBadge>
                        )) : <span className="text-xs text-muted-foreground">No tags</span>}
                      </div>
                    </div>
                  </label>
                ))}

                {filteredProducts.length === 0 ? (
                  <div className="flex min-h-56 flex-col items-center justify-center gap-3 rounded-md border border-border/60 bg-muted/10 p-6 text-center">
                    <div className="rounded-full border border-border/70 bg-background p-3">
                      <Boxes className="size-5 text-muted-foreground" />
                    </div>
                    <div className="space-y-1">
                      <p className="font-medium text-foreground">No products matched this filter set.</p>
                      <p className="max-w-md text-sm text-muted-foreground">Change the search, clear a category or tag filter, or widen the selection set before generating tasks.</p>
                    </div>
                  </div>
                ) : null}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </form>
  )
}
