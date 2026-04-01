import type { TaskPriority, TaskScopeType, TaskTemplateChecklistItemInput, TaskTemplateUpsertPayload } from '@shared/index'
import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ArrowDown, ArrowLeft, ArrowUp, ClipboardList, Plus, Trash2 } from 'lucide-react'
import { AutocompleteLookup } from '@/components/lookups/AutocompleteLookup'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { createTaskTemplate, getTaskTemplate, HttpError, updateTaskTemplate } from '@/shared/api/client'
import { showFailedActionToast, showSavedToast } from '@/shared/notifications/toast'
import { useAuth } from '@framework-core/web/auth/components/auth-provider'

type TemplateFormValues = TaskTemplateUpsertPayload

const scopeOptions = [
  { value: 'general', label: 'General' },
  { value: 'product', label: 'Product' },
  { value: 'invoice', label: 'Invoice' },
  { value: 'order', label: 'Order' },
  { value: 'customer', label: 'Customer' },
  { value: 'user', label: 'User' },
]

const priorityOptions = [
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
  { value: 'urgent', label: 'Urgent' },
]

function createDefaultChecklistItem(sortOrder: number): TaskTemplateChecklistItemInput {
  return {
    label: '',
    isRequired: true,
    sortOrder,
  }
}

function createDefaultValues(): TemplateFormValues {
  return {
    name: '',
    scopeType: 'general',
    titleTemplate: '',
    descriptionTemplate: null,
    defaultPriority: 'medium',
    defaultTags: [],
    isActive: true,
    checklistItems: [createDefaultChecklistItem(0)],
  }
}

function toErrorMessage(error: unknown) {
  if (error instanceof HttpError) return error.message
  if (error instanceof Error) return error.message
  return 'Failed to save task template.'
}

function normalizeChecklistItems(items: TaskTemplateChecklistItemInput[]) {
  return items.map((item, index) => ({ ...item, sortOrder: index }))
}

export function TaskTemplateFormPage() {
  const navigate = useNavigate()
  const { templateId } = useParams()
  const { session } = useAuth()
  const isEditMode = Boolean(templateId)
  const [values, setValues] = useState<TemplateFormValues>(createDefaultValues())
  const [loading, setLoading] = useState(isEditMode)
  const [saving, setSaving] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  useEffect(() => {
    if (!templateId || !session?.accessToken) {
      return
    }
    const accessToken = session.accessToken
    const resolvedTemplateId = templateId

    let cancelled = false
    async function load() {
      setLoading(true)
      setErrorMessage(null)
      try {
        const template = await getTaskTemplate(accessToken, resolvedTemplateId)
        if (!cancelled) {
          setValues({
            name: template.name,
            scopeType: template.scopeType,
            titleTemplate: template.titleTemplate,
            descriptionTemplate: template.descriptionTemplate,
            defaultPriority: template.defaultPriority,
            defaultTags: template.defaultTags,
            isActive: template.isActive,
            checklistItems: template.checklistItems.map((item) => ({
              label: item.label,
              isRequired: item.isRequired,
              sortOrder: item.sortOrder,
            })),
          })
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
  }, [session?.accessToken, templateId])

  const checklistCompletionHint = useMemo(
    () => `${values.checklistItems.filter((item) => item.isRequired).length}/${values.checklistItems.length} required`,
    [values.checklistItems],
  )

  function updateChecklistItem(index: number, nextItem: TaskTemplateChecklistItemInput) {
    setValues((current) => ({
      ...current,
      checklistItems: normalizeChecklistItems(current.checklistItems.map((item, itemIndex) => itemIndex === index ? nextItem : item)),
    }))
  }

  function moveChecklistItem(index: number, direction: -1 | 1) {
    setValues((current) => {
      const nextIndex = index + direction
      if (nextIndex < 0 || nextIndex >= current.checklistItems.length) {
        return current
      }

      const nextItems = [...current.checklistItems]
      const [movedItem] = nextItems.splice(index, 1)
      nextItems.splice(nextIndex, 0, movedItem)
      return {
        ...current,
        checklistItems: normalizeChecklistItems(nextItems),
      }
    })
  }

  function removeChecklistItem(index: number) {
    setValues((current) => {
      const remainingItems = current.checklistItems.filter((_, itemIndex) => itemIndex !== index)
      return {
        ...current,
        checklistItems: normalizeChecklistItems(remainingItems.length > 0 ? remainingItems : [createDefaultChecklistItem(0)]),
      }
    })
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!session?.accessToken) {
      setErrorMessage('Authorization token is required.')
      return
    }

    const normalizedValues: TemplateFormValues = {
      ...values,
      name: values.name.trim(),
      titleTemplate: values.titleTemplate.trim(),
      descriptionTemplate: values.descriptionTemplate?.trim() || null,
      defaultTags: values.defaultTags.map((tag) => tag.trim()).filter(Boolean),
      checklistItems: normalizeChecklistItems(values.checklistItems.map((item) => ({
        ...item,
        label: item.label.trim(),
      })).filter((item) => item.label.length > 0)),
    }

    if (!normalizedValues.name || !normalizedValues.titleTemplate || normalizedValues.checklistItems.length === 0) {
      setErrorMessage('Template name, title template, and at least one checklist item are required.')
      return
    }

    setSaving(true)
    setErrorMessage(null)
    try {
      const savedTemplate = templateId
        ? await updateTaskTemplate(session.accessToken, templateId, normalizedValues)
        : await createTaskTemplate(session.accessToken, normalizedValues)
      showSavedToast({
        entityLabel: 'task template',
        recordName: savedTemplate.name,
        referenceId: savedTemplate.id,
        mode: templateId ? 'update' : 'create',
      })
      void navigate('/admin/dashboard/task/templates')
    } catch (error) {
      const message = toErrorMessage(error)
      setErrorMessage(message)
      showFailedActionToast({
        entityLabel: 'task template',
        action: templateId ? 'update' : 'save',
        detail: message,
      })
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <Card className="rounded-md border-border/70 shadow-none">
        <CardContent className="p-8 text-sm text-muted-foreground">Loading template...</CardContent>
      </Card>
    )
  }

  return (
    <form className="space-y-4 pt-1" onSubmit={(event) => { void handleSubmit(event) }}>
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <Button variant="ghost" size="sm" asChild className="-ml-3 mb-2">
            <Link to="/admin/dashboard/task/templates"><ArrowLeft className="size-4" />Back to templates</Link>
          </Button>
          <h1 className="text-2xl font-semibold tracking-tight">{isEditMode ? values.name || 'Edit Template' : 'New Task Template'}</h1>
          <p className="mt-1 text-sm text-muted-foreground">Define the starter defaults and checklist that will prefill new tasks.</p>
        </div>
        <div className="flex items-center gap-3">
          <Button type="button" variant="outline" onClick={() => { void navigate('/admin/dashboard/task/templates') }}>Cancel</Button>
          <Button type="submit" disabled={saving}>{saving ? 'Saving...' : isEditMode ? 'Save Template' : 'Create Template'}</Button>
        </div>
      </div>

      {errorMessage ? (
        <Card className="rounded-md border-destructive/30 bg-destructive/5 shadow-none">
          <CardContent className="p-4 text-sm text-destructive">{errorMessage}</CardContent>
        </Card>
      ) : null}

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.55fr)_minmax(18rem,0.88fr)]">
        <Card className="rounded-md border-border/70 shadow-none">
          <CardContent className="grid gap-4 pt-6">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="grid gap-2">
                <Label>Template Name</Label>
                <Input value={values.name} onChange={(event) => setValues((current) => ({ ...current, name: event.target.value }))} placeholder="Ex: Verify Product Price" />
              </div>
              <div className="grid gap-2">
                <Label>Scope Type</Label>
                <AutocompleteLookup value={values.scopeType} onChange={(value) => setValues((current) => ({ ...current, scopeType: value as TaskScopeType }))} options={scopeOptions} placeholder="Select scope" />
              </div>
            </div>

            <div className="grid gap-2">
              <Label>Title Template</Label>
              <Input value={values.titleTemplate} onChange={(event) => setValues((current) => ({ ...current, titleTemplate: event.target.value }))} placeholder="Ex: Verify product price for selected product" />
            </div>

            <div className="grid gap-2">
              <Label>Description Template</Label>
              <Textarea value={values.descriptionTemplate ?? ''} onChange={(event) => setValues((current) => ({ ...current, descriptionTemplate: event.target.value || null }))} placeholder="Starter context that will be copied into the new task." className="min-h-32" />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="grid gap-2">
                <Label>Default Priority</Label>
                <AutocompleteLookup value={values.defaultPriority} onChange={(value) => setValues((current) => ({ ...current, defaultPriority: value as TaskPriority }))} options={priorityOptions} placeholder="Select priority" />
              </div>
              <div className="grid gap-2">
                <Label>Default Tags</Label>
                <Input value={values.defaultTags.join(', ')} onChange={(event) => setValues((current) => ({ ...current, defaultTags: event.target.value.split(',').map((tag) => tag.trim()).filter(Boolean) }))} placeholder="Ex: price, verification, product" />
              </div>
            </div>

            <div className="rounded-md border border-border/60 bg-muted/10 p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-foreground">Checklist Builder</p>
                  <p className="text-xs text-muted-foreground">These checklist items are copied into each task created from this starter and can be changed per task later.</p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setValues((current) => ({
                    ...current,
                    checklistItems: normalizeChecklistItems([...current.checklistItems, createDefaultChecklistItem(current.checklistItems.length)]),
                  }))}
                >
                  <Plus className="size-4" />
                  Add Item
                </Button>
              </div>

              <div className="mt-4 space-y-3">
                {values.checklistItems.map((item, index) => (
                  <div key={`${item.sortOrder}-${index}`} className="rounded-md border border-border/60 bg-background p-3">
                    <div className="flex items-start gap-3">
                      <div className="flex min-w-0 flex-1 items-start gap-3">
                        <div className="mt-2 flex size-8 shrink-0 items-center justify-center rounded-full border border-border/70 text-xs font-semibold text-muted-foreground">
                          {index + 1}
                        </div>
                        <div className="grid min-w-0 flex-1 gap-3">
                          <Input value={item.label} onChange={(event) => updateChecklistItem(index, { ...item, label: event.target.value })} placeholder="Checklist instruction" />
                          <label className="flex items-center gap-3 text-sm text-foreground">
                            <Checkbox checked={item.isRequired} onCheckedChange={(checked) => updateChecklistItem(index, { ...item, isRequired: Boolean(checked) })} />
                            Required item
                          </label>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <Button type="button" variant="ghost" size="icon" onClick={() => moveChecklistItem(index, -1)} disabled={index === 0}>
                          <ArrowUp className="size-4" />
                        </Button>
                        <Button type="button" variant="ghost" size="icon" onClick={() => moveChecklistItem(index, 1)} disabled={index === values.checklistItems.length - 1}>
                          <ArrowDown className="size-4" />
                        </Button>
                        <Button type="button" variant="ghost" size="icon" onClick={() => removeChecklistItem(index)}>
                          <Trash2 className="size-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card className="rounded-md border-border/70 shadow-none">
            <CardHeader className="pb-4">
              <CardTitle>Template Controls</CardTitle>
              <CardDescription>Manage starter readiness, checklist coverage, and default values.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4">
              <div className="flex items-center justify-between rounded-md border border-border/60 bg-muted/10 p-3">
                <div className="space-y-1">
                  <p className="text-sm font-medium text-foreground">Active</p>
                  <p className="text-xs text-muted-foreground">Inactive starters stay editable but should not be used for new task creation.</p>
                </div>
                <Switch checked={values.isActive} onCheckedChange={(checked) => setValues((current) => ({ ...current, isActive: checked }))} />
              </div>

              <div className="rounded-md border border-border/60 bg-muted/10 p-3">
                <p className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">Checklist Coverage</p>
                <p className="mt-2 text-lg font-semibold text-foreground">{checklistCompletionHint}</p>
                <p className="mt-1 text-xs text-muted-foreground">Required items mark the non-negotiable starter checks that should usually be copied into the task.</p>
              </div>

              <div className="rounded-md border border-border/60 bg-muted/10 p-3">
                <p className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">Defaults</p>
                <div className="mt-3 grid gap-2 text-sm">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-muted-foreground">Scope</span>
                    <span className="font-medium text-foreground">{values.scopeType}</span>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-muted-foreground">Priority</span>
                    <span className="font-medium text-foreground">{values.defaultPriority}</span>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-muted-foreground">Tags</span>
                    <span className="font-medium text-foreground">{values.defaultTags.length > 0 ? values.defaultTags.join(', ') : 'None'}</span>
                  </div>
                </div>
              </div>

              <div className="rounded-md border border-border/60 bg-muted/10 p-3">
                <div className="flex items-start gap-3">
                  <div className="rounded-full border border-border/70 bg-background p-2">
                    <ClipboardList className="size-4 text-muted-foreground" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-foreground">Snapshot Rule</p>
                    <p className="text-xs text-muted-foreground">Existing tasks keep a copied checklist snapshot. Editing this template will affect only new tasks created after the change.</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </form>
  )
}
