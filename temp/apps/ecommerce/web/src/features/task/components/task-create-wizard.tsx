import type { MilestoneSummary, TaskPriority, TaskScopeType, TaskTemplateSummary, TaskUpsertPayload } from '@shared/index'
import { useEffect, useMemo, useState } from 'react'
import { ArrowRight, CalendarClock, ClipboardList, FileText, Flag, Link2, Tag, UserRound } from 'lucide-react'
import { AutocompleteLookup } from '@/components/lookups/AutocompleteLookup'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { StatusBadge } from '@/components/ui/status-badge'
import { Textarea } from '@/components/ui/textarea'

type WizardStep = 'title' | 'description' | 'template' | 'scope' | 'assignment' | 'schedule' | 'review'

interface TaskCreateWizardProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  templates: TaskTemplateSummary[]
  milestones: MilestoneSummary[]
  users: { id: string; name: string }[]
  products: { id: string; name: string }[]
  currentUserId: string | null
  currentUserName: string | null
  onContinue: (payload: TaskUpsertPayload) => void | Promise<void>
}

interface WizardDraft {
  title: string
  description: string
  tags: string[]
  milestoneId: string | null
  templateId: string | null
  scopeType: TaskScopeType
  entityType: TaskScopeType | null
  entityId: string | null
  entityLabel: string | null
  assigneeId: string | null
  priority: TaskPriority
  dueDate: string | null
}

const steps: WizardStep[] = ['title', 'description', 'template', 'scope', 'assignment', 'schedule', 'review']

const scopeOptions: Array<{ value: TaskScopeType; label: string; description: string }> = [
  { value: 'product', label: 'Product', description: 'Link the task to one product record.' },
  { value: 'invoice', label: 'Invoice', description: 'Attach the task to one invoice or tax check.' },
  { value: 'user', label: 'User', description: 'Use this for follow-up tied to a person.' },
  { value: 'general', label: 'General', description: 'Keep it as a standalone operational task.' },
]

const priorityOptions: Array<{ value: TaskPriority; label: string }> = [
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
  { value: 'urgent', label: 'Urgent' },
]

function createDefaultDraft(): WizardDraft {
  return {
    title: '',
    description: '',
    tags: [],
    milestoneId: null,
    templateId: null,
    scopeType: 'general',
    entityType: null,
    entityId: null,
    entityLabel: null,
    assigneeId: null,
    priority: 'medium',
    dueDate: null,
  }
}

function toDateInputValue(date: Date) {
  return date.toISOString().slice(0, 10)
}

function addDays(date: Date, days: number) {
  const nextDate = new Date(date)
  nextDate.setDate(nextDate.getDate() + days)
  return toDateInputValue(nextDate)
}

function dueOptionValue(option: 'today' | 'tomorrow' | 'none') {
  if (option === 'today') return toDateInputValue(new Date())
  if (option === 'tomorrow') return addDays(new Date(), 1)
  return null
}

function ScopeCard(props: {
  label: string
  description: string
  active: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={props.onClick}
      className={`rounded-md border p-4 text-left transition ${props.active ? 'border-foreground bg-foreground text-background' : 'border-border/70 bg-background text-foreground hover:border-foreground/50'}`}
    >
      <div className="space-y-1">
        <p className="text-sm font-semibold">{props.label}</p>
        <p className={`text-xs ${props.active ? 'text-background/80' : 'text-muted-foreground'}`}>{props.description}</p>
      </div>
    </button>
  )
}

export function TaskCreateWizard(props: TaskCreateWizardProps) {
  const [stepIndex, setStepIndex] = useState(0)
  const [draft, setDraft] = useState<WizardDraft>(createDefaultDraft())
  const [tagInput, setTagInput] = useState('')
  const [templateMode, setTemplateMode] = useState<'template' | 'none'>('none')
  const [selectedDuePreset, setSelectedDuePreset] = useState<'today' | 'tomorrow' | 'none' | 'custom'>('none')
  const [localAttachments, setLocalAttachments] = useState<string[]>([])

  const activeStep = steps[stepIndex]
  const selectedTemplate = useMemo(
    () => props.templates.find((template) => template.id === draft.templateId) ?? null,
    [draft.templateId, props.templates],
  )

  const templateOptions = useMemo(
    () => props.templates.filter((template) => template.isActive).map((template) => ({ value: template.id, label: template.name })),
    [props.templates],
  )
  const productOptions = useMemo(
    () => props.products.map((product) => ({ value: product.id, label: product.name })),
    [props.products],
  )
  const userOptions = useMemo(
    () => props.users.map((user) => ({ value: user.id, label: user.name })),
    [props.users],
  )
  const suggestedTags = useMemo(
    () => Array.from(new Set(props.templates.flatMap((template) => template.defaultTags))).slice(0, 12),
    [props.templates],
  )

  useEffect(() => {
    if (!props.open) {
      setStepIndex(0)
      setDraft(createDefaultDraft())
      setTagInput('')
      setTemplateMode('none')
      setSelectedDuePreset('none')
      setLocalAttachments([])
    }
  }, [props.open])

  function updateDraft(partial: Partial<WizardDraft>) {
    setDraft((current) => ({ ...current, ...partial }))
  }

  function applyTemplate(templateId: string | null) {
    const template = props.templates.find((entry) => entry.id === templateId) ?? null
    if (!template) {
      updateDraft({
        templateId: null,
        checklistItems: undefined as never,
      } as never)
      return
    }

    updateDraft({
      templateId: template.id,
      title: draft.title.trim() ? draft.title : template.titleTemplate,
      description: draft.description.trim() ? draft.description : (template.descriptionTemplate ?? ''),
      tags: draft.tags.length > 0 ? draft.tags : template.defaultTags,
      priority: draft.priority === 'medium' ? template.defaultPriority : draft.priority,
      scopeType: template.scopeType,
      entityType: template.scopeType === 'general' ? null : template.scopeType,
    })
  }

  function addTag(tag: string) {
    const normalized = tag.trim()
    if (!normalized) return
    if (draft.tags.some((entry) => entry.toLowerCase() === normalized.toLowerCase())) {
      setTagInput('')
      return
    }
    updateDraft({ tags: [...draft.tags, normalized] })
    setTagInput('')
  }

  function removeTag(tag: string) {
    updateDraft({ tags: draft.tags.filter((entry) => entry !== tag) })
  }

  function canContinue() {
    if (activeStep === 'title') return draft.title.trim().length >= 3
    if (activeStep === 'template') return templateMode === 'none' || Boolean(draft.templateId)
    if (activeStep === 'scope') {
      if (draft.scopeType === 'general') return true
      return Boolean(draft.entityId && draft.entityLabel)
    }
    if (activeStep === 'assignment') return true
    if (activeStep === 'schedule') return true
    return true
  }

  function goNext() {
    if (!canContinue()) return
    setStepIndex((current) => Math.min(current + 1, steps.length - 1))
  }

  function goBack() {
    setStepIndex((current) => Math.max(current - 1, 0))
  }

  async function handleContinueToEdit() {
    const payload: TaskUpsertPayload = {
      title: draft.title.trim(),
      description: draft.description.trim() || null,
      status: 'pending',
      priority: draft.priority,
      tags: draft.tags,
      taskGroupId: null,
      milestoneId: draft.milestoneId,
      scopeType: draft.scopeType,
      entityType: draft.scopeType === 'general' ? null : draft.entityType ?? draft.scopeType,
      entityId: draft.scopeType === 'general' ? null : draft.entityId,
      entityLabel: draft.scopeType === 'general' ? null : draft.entityLabel,
      templateId: draft.templateId,
      assigneeId: draft.assigneeId,
      dueDate: draft.dueDate,
      reviewComment: null,
      checklistItems: [],
    }
    await props.onContinue(payload)
  }

  function renderStep() {
    if (activeStep === 'title') {
      return (
        <div className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="task-wizard-title">What needs to be done?</Label>
            <Input
              id="task-wizard-title"
              value={draft.title}
              onChange={(event) => updateDraft({ title: event.target.value })}
              placeholder="Type task title"
              autoFocus
            />
          </div>

          <div className="space-y-3">
            <Label htmlFor="task-wizard-tags">Tags</Label>
            <div className="flex gap-2">
              <Input
                id="task-wizard-tags"
                value={tagInput}
                onChange={(event) => setTagInput(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' || event.key === ',') {
                    event.preventDefault()
                    addTag(tagInput)
                  }
                }}
                placeholder="Add tag and press Enter"
              />
              <Button type="button" variant="outline" onClick={() => addTag(tagInput)}>Add Tag</Button>
            </div>

            {draft.tags.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {draft.tags.map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => removeTag(tag)}
                    className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-background px-3 py-1 text-xs font-medium text-foreground"
                  >
                    <Tag className="size-3" />
                    {tag}
                  </button>
                ))}
              </div>
            ) : null}

            {suggestedTags.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {suggestedTags.map((tag) => (
                  <Button key={tag} type="button" variant="outline" size="sm" onClick={() => addTag(tag)}>
                    {tag}
                  </Button>
                ))}
              </div>
            ) : null}
          </div>
        </div>
      )
    }

    if (activeStep === 'description') {
      return (
        <div className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="task-wizard-description">Add more details</Label>
            <Textarea
              id="task-wizard-description"
              value={draft.description}
              onChange={(event) => updateDraft({ description: event.target.value })}
              placeholder="Describe context, expected output, or verification notes."
              className="min-h-28"
              autoFocus
            />
          </div>

          <div className="space-y-3 rounded-md border border-dashed border-border/70 bg-muted/10 p-4">
            <div>
              <p className="text-sm font-medium text-foreground">Attachments</p>
            </div>
            <Input
              type="file"
              multiple
              onChange={(event) => setLocalAttachments(Array.from(event.target.files ?? []).map((file) => file.name))}
            />
            {localAttachments.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {localAttachments.map((fileName) => <StatusBadge key={fileName} tone="manual">{fileName}</StatusBadge>)}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground">No files selected.</p>
            )}
          </div>
        </div>
      )
    }

    if (activeStep === 'template') {
      return (
        <div className="space-y-5">
          <div className="grid gap-3 sm:grid-cols-2">
            <ScopeCard
              label="Use Starter"
              description="Use a template as a starter for title, tags, and checklist draft."
              active={templateMode === 'template'}
              onClick={() => setTemplateMode('template')}
            />
            <ScopeCard
              label="No Starter"
              description="Keep this task fully manual with no starter template."
              active={templateMode === 'none'}
              onClick={() => {
                setTemplateMode('none')
                updateDraft({ templateId: null })
              }}
            />
          </div>

          {templateMode === 'template' ? (
            <div className="space-y-2">
              <Label>Starter Template</Label>
              <AutocompleteLookup
                value={draft.templateId ?? ''}
                onChange={(value) => applyTemplate(value || null)}
                options={templateOptions}
                placeholder="Use template as starter"
              />
              {selectedTemplate ? (
                <Card className="rounded-md border-border/70 shadow-none">
                  <CardContent className="grid gap-2 p-4 text-sm">
                    <div className="flex items-center justify-between gap-3">
                      <p className="font-medium text-foreground">{selectedTemplate.name}</p>
                      <StatusBadge tone="featured">{selectedTemplate.scopeType}</StatusBadge>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <StatusBadge tone="publishing">{selectedTemplate.defaultPriority}</StatusBadge>
                      <StatusBadge tone="manual">{selectedTemplate.checklistItemCount} checks</StatusBadge>
                      {selectedTemplate.defaultTags.map((tag) => <StatusBadge key={tag} tone="manual">{tag}</StatusBadge>)}
                    </div>
                  </CardContent>
                </Card>
              ) : null}
            </div>
          ) : null}
        </div>
      )
    }

    if (activeStep === 'scope') {
      return (
        <div className="space-y-5">
          <div className="grid gap-3 sm:grid-cols-2">
            {scopeOptions.map((scope) => (
              <ScopeCard
                key={scope.value}
                label={scope.label}
                description={scope.description}
                active={draft.scopeType === scope.value}
                onClick={() => {
                  updateDraft({
                    scopeType: scope.value,
                    entityType: scope.value === 'general' ? null : scope.value,
                    entityId: scope.value === 'general' ? null : draft.entityId,
                    entityLabel: scope.value === 'general' ? null : draft.entityLabel,
                  })
                }}
              />
            ))}
          </div>

          {draft.scopeType === 'product' ? (
            <div className="space-y-2">
              <Label>Product</Label>
              <AutocompleteLookup
                value={draft.entityId ?? ''}
                onChange={(value) => {
                  const match = props.products.find((product) => product.id === value) ?? null
                  updateDraft({
                    entityType: 'product',
                    entityId: match?.id ?? null,
                    entityLabel: match?.name ?? null,
                  })
                }}
                options={productOptions}
                placeholder="Search product"
              />
            </div>
          ) : null}

          {draft.scopeType === 'invoice' ? (
            <div className="grid gap-3 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Invoice ID</Label>
                <Input
                  value={draft.entityId ?? ''}
                  onChange={(event) => updateDraft({ entityType: 'invoice', entityId: event.target.value || null })}
                  placeholder="Enter invoice id"
                />
              </div>
              <div className="space-y-2">
                <Label>Invoice Label</Label>
                <Input
                  value={draft.entityLabel ?? ''}
                  onChange={(event) => updateDraft({ entityType: 'invoice', entityLabel: event.target.value || null })}
                  placeholder="Enter invoice label"
                />
              </div>
            </div>
          ) : null}

          {draft.scopeType === 'user' ? (
            <div className="space-y-2">
              <Label>User</Label>
              <AutocompleteLookup
                value={draft.entityId ?? ''}
                onChange={(value) => {
                  const match = props.users.find((user) => user.id === value) ?? null
                  updateDraft({
                    entityType: 'user',
                    entityId: match?.id ?? null,
                    entityLabel: match?.name ?? null,
                  })
                }}
                options={userOptions}
                placeholder="Select user"
              />
            </div>
          ) : null}
        </div>
      )
    }

    if (activeStep === 'assignment') {
      const isMySelf = draft.assigneeId === props.currentUserId
      const isUnassigned = !draft.assigneeId

      return (
        <div className="space-y-5">
          <div className="grid gap-3 sm:grid-cols-3">
            <ScopeCard
              label="My Self"
              description="Assign the task to your own queue."
              active={isMySelf}
              onClick={() => updateDraft({ assigneeId: props.currentUserId })}
            />
            <ScopeCard
              label="Select User"
              description="Route the task to someone else."
              active={!isMySelf && !isUnassigned}
              onClick={() => {
                if (props.users[0]) updateDraft({ assigneeId: props.users[0].id })
              }}
            />
            <ScopeCard
              label="Leave Unassigned"
              description="Create the task without an owner for now."
              active={isUnassigned}
              onClick={() => updateDraft({ assigneeId: null })}
            />
          </div>

          {!isMySelf && !isUnassigned ? (
            <div className="space-y-2">
              <Label>Assignee</Label>
              <AutocompleteLookup
                value={draft.assigneeId ?? ''}
                onChange={(value) => updateDraft({ assigneeId: value || null })}
                options={userOptions}
                placeholder="Search assignee"
                allowEmptyOption
                emptyOptionLabel="Unassigned"
              />
            </div>
          ) : null}
        </div>
      )
    }

    if (activeStep === 'schedule') {
      return (
        <div className="space-y-5">
          <div className="space-y-3">
            <Label>Priority</Label>
            <div className="grid gap-3 sm:grid-cols-4">
              {priorityOptions.map((option) => (
                <ScopeCard
                  key={option.value}
                  label={option.label}
                  description="Task urgency"
                  active={draft.priority === option.value}
                  onClick={() => updateDraft({ priority: option.value })}
                />
              ))}
            </div>
          </div>

          <div className="space-y-3">
            <Label>Due Date</Label>
            <div className="grid gap-3 sm:grid-cols-4">
              <ScopeCard
                label="Today"
                description="Set due date for today."
                active={selectedDuePreset === 'today'}
                onClick={() => {
                  setSelectedDuePreset('today')
                  updateDraft({ dueDate: dueOptionValue('today') })
                }}
              />
              <ScopeCard
                label="Tomorrow"
                description="Set due date for tomorrow."
                active={selectedDuePreset === 'tomorrow'}
                onClick={() => {
                  setSelectedDuePreset('tomorrow')
                  updateDraft({ dueDate: dueOptionValue('tomorrow') })
                }}
              />
              <ScopeCard
                label="Pick Date"
                description="Choose a custom deadline."
                active={selectedDuePreset === 'custom'}
                onClick={() => setSelectedDuePreset('custom')}
              />
              <ScopeCard
                label="No Due Date"
                description="Leave the task unscheduled."
                active={selectedDuePreset === 'none'}
                onClick={() => {
                  setSelectedDuePreset('none')
                  updateDraft({ dueDate: null })
                }}
              />
            </div>

            {selectedDuePreset === 'custom' ? (
              <Input
                type="date"
                value={draft.dueDate ?? ''}
                onChange={(event) => updateDraft({ dueDate: event.target.value || null })}
              />
            ) : null}
          </div>
        </div>
      )
    }

    return (
      <div className="space-y-4">
        <Card className="rounded-md border-border/70 shadow-none">
          <CardContent className="grid gap-4 p-5">
            <div className="grid gap-3 md:grid-cols-2">
              <div className="space-y-1">
                <p className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">Title</p>
                <p className="text-sm font-semibold text-foreground">{draft.title || 'Untitled task'}</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">Starter Template</p>
                <p className="text-sm text-foreground">{selectedTemplate?.name ?? 'No starter template'}</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">Related To</p>
                <p className="text-sm text-foreground">{draft.entityLabel ?? draft.scopeType}</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">Assignee</p>
                <p className="text-sm text-foreground">
                  {props.users.find((user) => user.id === draft.assigneeId)?.name ?? (draft.assigneeId === props.currentUserId ? props.currentUserName : 'Unassigned')}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">Priority</p>
                <p className="text-sm text-foreground">{draft.priority}</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">Due</p>
                <p className="text-sm text-foreground">{draft.dueDate ?? 'No due date'}</p>
              </div>
            </div>

            {draft.description ? (
              <div className="space-y-1 border-t border-border/60 pt-4">
                <p className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">Description</p>
                <p className="text-sm text-muted-foreground">{draft.description}</p>
              </div>
            ) : null}

            {draft.tags.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {draft.tags.map((tag) => <StatusBadge key={tag} tone="manual">{tag}</StatusBadge>)}
              </div>
            ) : null}

          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <Dialog open={props.open} onOpenChange={props.onOpenChange}>
      <DialogContent className="flex max-h-[92vh] w-[min(96vw,50rem)] max-w-4xl flex-col overflow-hidden border border-border/70 bg-background p-0">
        <div className="border-b border-border/70 px-5 py-4">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-1">
              <p className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">IFZ Beta</p>
              <h2 className="text-xl font-semibold tracking-tight text-foreground">Task setup flow</h2>
            </div>
            <StatusBadge tone="publishing">Step {stepIndex + 1} of {steps.length}</StatusBadge>
          </div>

          <div
            className="mt-4 grid gap-2"
            style={{ gridTemplateColumns: `repeat(${steps.length}, minmax(0, 1fr))` }}
          >
            {steps.map((step, index) => (
              <div key={step} className={`h-1.5 rounded-full ${index <= stepIndex ? 'bg-foreground' : 'bg-muted'}`} />
            ))}
          </div>
        </div>

        <div className="overflow-y-auto px-5 py-5">
          <div className="grid gap-4 lg:grid-cols-[minmax(0,1.45fr)_16rem]">
            <div className="space-y-4">
              {renderStep()}

              <div className="flex items-center justify-between gap-3 border-t border-border/70 pt-3">
                <Button type="button" variant="ghost" onClick={goBack} disabled={stepIndex === 0}>Back</Button>
                {activeStep === 'review' ? (
                  <Button type="button" onClick={() => { void handleContinueToEdit() }}>
                    Continue To Edit
                    <ArrowRight className="size-4" />
                  </Button>
                ) : (
                  <Button type="button" onClick={goNext} disabled={!canContinue()}>
                    Next
                    <ArrowRight className="size-4" />
                  </Button>
                )}
              </div>
            </div>

            <Card className="rounded-md border-border/70 bg-muted/10 shadow-none">
              <CardContent className="grid gap-3 p-4">
                <div className="space-y-1">
                  <p className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">Draft</p>
                  <p className="text-sm font-semibold text-foreground">{draft.title || 'Untitled task'}</p>
                </div>

                <div className="space-y-3 text-sm">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Tag className="size-4" />
                    <span>{draft.tags.length > 0 ? draft.tags.join(', ') : 'No tags yet'}</span>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <ClipboardList className="size-4" />
                    <span>{selectedTemplate?.name ?? 'No starter template selected'}</span>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Link2 className="size-4" />
                    <span>{draft.entityLabel ?? draft.scopeType}</span>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <UserRound className="size-4" />
                    <span>{props.users.find((user) => user.id === draft.assigneeId)?.name ?? (draft.assigneeId === props.currentUserId ? props.currentUserName : 'Unassigned')}</span>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Flag className="size-4" />
                    <span>{draft.priority}</span>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <CalendarClock className="size-4" />
                    <span>{draft.dueDate ?? 'No due date'}</span>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <FileText className="size-4" />
                    <span>{draft.description.trim() ? 'Description added' : 'No description yet'}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
