import type { LookupOption } from '@/shared/forms/common-lookup'
import type { MilestoneSummary, MilestoneUpsertPayload, TaskGroupSummary, TaskGroupUpsertPayload, TaskPriority, TaskScopeType, TaskStatus, TaskTemplateSummary, TaskUpsertPayload } from '@shared/index'
import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { ArrowLeft, CalendarClock, CheckCircle2, ClipboardList, Flag, Paperclip, Plus, Sparkles, Tags, UserRound } from 'lucide-react'
import { AutocompleteLookup } from '@/components/lookups/AutocompleteLookup'
import { TaskCreateWizard } from '@/features/task/components/task-create-wizard'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { StatusBadge } from '@/components/ui/status-badge'
import { Textarea } from '@/components/ui/textarea'
import { createFieldErrors, inputErrorClassName, isBlank, setFieldError, summarizeFieldErrors, type FieldErrors, warningCardClassName } from '@/shared/forms/validation'
import { HttpError, createMilestone, createTask, createTaskGroup, getTask, getTaskTemplate, listMilestones, listProducts, listTaskGroups, listTaskTemplates, listUsers, markNotificationsReadByTask, updateTask } from '@/shared/api/client'
import { showFailedActionToast, showSavedToast, showValidationToast } from '@/shared/notifications/toast'
import { useAuth } from '@framework-core/web/auth/components/auth-provider'

type TaskFormValues = TaskUpsertPayload
const TASK_DRAFT_STORAGE_KEY = 'task:create-draft'
const PLAN_SECTION_MARKER = '## Plan'

interface TaskPlanItem {
  id: string
  text: string
}

interface TaskPlanState {
  steps: TaskPlanItem[]
  notes: string
  attachments: TaskPlanItem[]
}

const taskStatusOptions: Array<LookupOption & { tone: 'manual' | 'publishing' | 'featured' | 'active' }> = [
  { value: 'pending', label: 'Pending', tone: 'manual' },
  { value: 'in_progress', label: 'In Progress', tone: 'publishing' },
  { value: 'review', label: 'Review', tone: 'featured' },
  { value: 'finalized', label: 'Finalized', tone: 'active' },
]

const taskPriorityOptions: Array<LookupOption & { tone: 'manual' | 'publishing' | 'featured' | 'active' }> = [
  { value: 'low', label: 'Low', tone: 'manual' },
  { value: 'medium', label: 'Medium', tone: 'publishing' },
  { value: 'high', label: 'High', tone: 'featured' },
  { value: 'urgent', label: 'Urgent', tone: 'active' },
]

const taskScopeOptions: LookupOption[] = [
  { value: 'general', label: 'General' },
  { value: 'product', label: 'Product' },
  { value: 'invoice', label: 'Invoice' },
  { value: 'order', label: 'Order' },
  { value: 'customer', label: 'Customer' },
  { value: 'user', label: 'User' },
]

function createDefaultValues(): TaskFormValues {
  return {
    title: '',
    description: null,
    status: 'pending',
    priority: 'medium',
    tags: [],
    taskGroupId: null,
    milestoneId: null,
    scopeType: 'general',
    entityType: null,
    entityId: null,
    entityLabel: null,
    templateId: null,
    assigneeId: null,
    dueDate: null,
    reviewComment: null,
    checklistItems: [],
  }
}

function createPlanItem(text = ''): TaskPlanItem {
  return {
    id: crypto.randomUUID(),
    text,
  }
}

function createDefaultPlan(): TaskPlanState {
  return {
    steps: [],
    notes: '',
    attachments: [],
  }
}

function normalizePlanItems(values: string[], options?: { keepEmpty?: boolean }) {
  return values
    .map((value) => createPlanItem(value.trim()))
    .filter((item) => options?.keepEmpty ? true : item.text.length > 0)
}

function upsertNumberedStepLine(value: string) {
  const currentText = value.trimEnd()
  const lines = currentText ? currentText.split('\n') : []
  const stepsHeaderIndex = lines.findIndex((line) => /^#{1,3}\s+steps\s*$/i.test(line.trim()))

  if (stepsHeaderIndex < 0) {
    return [currentText, '## Steps\n1. '].filter(Boolean).join('\n\n')
  }

  let nextSectionIndex = lines.length
  for (let index = stepsHeaderIndex + 1; index < lines.length; index += 1) {
    if (/^#{1,3}\s+\w+/i.test(lines[index].trim())) {
      nextSectionIndex = index
      break
    }
  }

  const stepLines = lines.slice(stepsHeaderIndex + 1, nextSectionIndex)
  const existingStepNumbers = stepLines
    .map((line) => {
      const match = line.trim().match(/^(\d+)\.\s*/)
      return match ? Number.parseInt(match[1], 10) : null
    })
    .filter((number): number is number => number !== null && Number.isFinite(number) && number > 0)
  const nextStepNumber = (existingStepNumbers.length > 0 ? Math.max(...existingStepNumbers) : 0) + 1
  const nextLines = [...lines]
  nextLines.splice(nextSectionIndex, 0, `${nextStepNumber}. `)
  return nextLines.join('\n').trimEnd()
}

function serializePlanEditor(plan: TaskPlanState) {
  const sections: string[] = []

  if (plan.steps.length > 0) {
    sections.push('## Steps', ...plan.steps.map((step, index) => `${index + 1}. ${step.text.trim()}`))
  }
  if (plan.notes.trim()) {
    sections.push('## Notes', plan.notes.trim())
  }
  if (plan.attachments.length > 0) {
    sections.push('## Attachments', ...plan.attachments.map((attachment) => `📎 ${attachment.text.trim()}`))
  }

  return sections.join('\n\n').trim()
}

function parsePlanEditor(value: string) {
  const plan = createDefaultPlan()
  const lines = value.replace(/\r\n/g, '\n').split('\n')
  let activeSection: 'steps' | 'notes' | 'attachments' | null = null
  const noteLines: string[] = []
  const stepLines: string[] = []
  const attachmentLines: string[] = []

  for (const rawLine of lines) {
    const line = rawLine.trim()
    if (!line) continue

    if (/^#{1,3}\s+steps$/i.test(line)) {
      activeSection = 'steps'
      continue
    }
    if (/^#{1,3}\s+notes$/i.test(line)) {
      activeSection = 'notes'
      continue
    }
    if (/^#{1,3}\s+attachments$/i.test(line)) {
      activeSection = 'attachments'
      continue
    }

    if (line === '/attach' || line === '[attach]') {
      attachmentLines.push('Attachment')
      activeSection = 'attachments'
      continue
    }

    if (/^📎\s+/.test(line)) {
      attachmentLines.push(line.replace(/^📎\s+/, '').trim())
      activeSection = 'attachments'
      continue
    }

    if (/^\d+\.\s*/.test(line)) {
      stepLines.push(line.replace(/^\d+\.\s*/, '').trim())
      activeSection = 'steps'
      continue
    }

    if (/^- \[[ xX]\]\s+/.test(line)) {
      noteLines.push(line.replace(/^- \[[ xX]\]\s+/, '').trim())
      activeSection = 'notes'
      continue
    }

    if (/^[-*]\s+/.test(line)) {
      noteLines.push(line.replace(/^[-*]\s+/, '').trim())
      activeSection = 'notes'
      continue
    }

    if (activeSection === 'notes') {
      noteLines.push(line)
    } else if (activeSection === 'attachments') {
      attachmentLines.push(line)
    } else {
      noteLines.push(line)
      activeSection = 'notes'
    }
  }

  plan.steps = normalizePlanItems(stepLines, { keepEmpty: true })
  plan.notes = noteLines.join('\n').trim()
  plan.attachments = normalizePlanItems(attachmentLines)

  return plan
}

function serializeTaskDescription(shortDescription: string, planText: string) {
  const blocks: string[] = []
  if (shortDescription.trim()) {
    blocks.push(shortDescription.trim())
  }

  if (planText.trim()) {
    blocks.push(PLAN_SECTION_MARKER, planText.trim())
  }

  return blocks.join('\n\n').trim() || null
}

function parseTaskDescription(rawDescription: string | null | undefined) {
  if (!rawDescription?.trim()) {
    return {
      shortDescription: '',
      plan: createDefaultPlan(),
      planText: '',
    }
  }

  const normalized = rawDescription.replace(/\r\n/g, '\n')
  const markerIndex = normalized.indexOf(PLAN_SECTION_MARKER)
  const shortDescription = markerIndex >= 0 ? normalized.slice(0, markerIndex).trim() : normalized.trim()
  if (markerIndex < 0) {
    return {
      shortDescription,
      plan: createDefaultPlan(),
      planText: '',
    }
  }

  const planText = normalized.slice(markerIndex + PLAN_SECTION_MARKER.length).trim()
  const plan = parsePlanEditor(planText)

  return {
    shortDescription,
    plan,
    planText,
  }
}

function toErrorMessage(error: unknown) {
  if (error instanceof HttpError) return error.message
  if (error instanceof Error) return error.message
  return 'Failed to save task.'
}

function FieldError({ message }: { message?: string }) {
  return message ? <p className="text-[0.8rem] text-destructive">{message}</p> : null
}

function validateTask(values: TaskFormValues) {
  const errors = createFieldErrors()
  if (isBlank(values.title)) setFieldError(errors, 'title', 'Title is required.')
  return errors
}

function getStatusMeta(status: TaskStatus) {
  return taskStatusOptions.find((option) => option.value === status) ?? taskStatusOptions[0]
}

function getPriorityMeta(priority: TaskPriority) {
  return taskPriorityOptions.find((option) => option.value === priority) ?? taskPriorityOptions[1]
}

function TaskStat({ label, value, hint, icon: Icon }: { label: string; value: string; hint: string; icon: typeof ClipboardList }) {
  return (
    <div className="min-w-0 rounded-md border border-border/60 bg-muted/15 p-2.5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 space-y-1">
          <p className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">{label}</p>
          <p className="break-words text-sm font-semibold text-foreground">{value}</p>
          {hint ? <p className="whitespace-pre-wrap break-words text-xs text-muted-foreground">{hint}</p> : null}
        </div>
        <div className="shrink-0 rounded-full border border-border/70 bg-background p-1.5">
          <Icon className="size-4 text-muted-foreground" />
        </div>
      </div>
    </div>
  )
}

export function TaskFormPage() {
  const navigate = useNavigate()
  const { session } = useAuth()
  const { taskId } = useParams()
  const [searchParams] = useSearchParams()
  const isEditMode = Boolean(taskId)
  const [values, setValues] = useState<TaskFormValues>(createDefaultValues())
  const [loading, setLoading] = useState(isEditMode)
  const [saving, setSaving] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>(createFieldErrors())
  const [users, setUsers] = useState<{ id: string; name: string }[]>([])
  const [products, setProducts] = useState<{ id: string; name: string }[]>([])
  const [templates, setTemplates] = useState<TaskTemplateSummary[]>([])
  const [milestones, setMilestones] = useState<MilestoneSummary[]>([])
  const [taskGroups, setTaskGroups] = useState<TaskGroupSummary[]>([])
  const [checklistLabels, setChecklistLabels] = useState<Record<string, string>>({})
  const [wizardOpen, setWizardOpen] = useState(false)
  const [draftLoaded, setDraftLoaded] = useState(false)
  const [shortDescription, setShortDescription] = useState('')
  const [plan, setPlan] = useState<TaskPlanState>(createDefaultPlan())
  const [planEditorText, setPlanEditorText] = useState('')
  const [planEditorOpen, setPlanEditorOpen] = useState(false)
  const [showMilestoneControls, setShowMilestoneControls] = useState(false)
  const planFileInputRef = useRef<HTMLInputElement | null>(null)
  const [taskGroupDialogOpen, setTaskGroupDialogOpen] = useState(false)
  const [taskGroupSaving, setTaskGroupSaving] = useState(false)
  const [taskGroupForm, setTaskGroupForm] = useState<TaskGroupUpsertPayload>({
    title: '',
    type: 'focus',
    status: 'active',
    description: null,
  })
  const [milestoneDialogOpen, setMilestoneDialogOpen] = useState(false)
  const [milestoneSaving, setMilestoneSaving] = useState(false)
  const [milestoneForm, setMilestoneForm] = useState<MilestoneUpsertPayload>({
    title: '',
    description: null,
    entityType: null,
    entityId: null,
    status: 'active',
    dueDate: null,
  })

  function updatePlanEditor(nextValue: string) {
    setPlanEditorText(nextValue)
    setPlan(parsePlanEditor(nextValue))
  }

  function insertPlanBlock(kind: 'steps' | 'notes') {
    setPlanEditorText((currentValue) => {
      const currentText = currentValue.trimEnd()

      let nextText = currentText

      if (kind === 'steps') {
        nextText = upsertNumberedStepLine(currentText)
      } else {
        const blockMap = {
          notes: '## Notes\n',
        } satisfies Record<'notes', string>
        nextText = [currentText, blockMap[kind]].filter(Boolean).join('\n\n')
      }

      setPlan(parsePlanEditor(nextText))
      return nextText
    })
  }

  function openAttachPicker() {
    planFileInputRef.current?.click()
  }

  function handlePlanFiles(fileList: FileList | null) {
    if (!fileList || fileList.length === 0) return
    const nextLines = Array.from(fileList)
      .map((file) => `📎 ${file.name.trim()}`)
      .filter(Boolean)
      .filter((line) => !planEditorText.includes(line))
    if (nextLines.length === 0) return
    const attachmentsBlock = ['## Attachments', ...nextLines].join('\n')
    const nextText = plan.attachments.length > 0
      ? `${planEditorText.trim()}\n${nextLines.join('\n')}`
      : [planEditorText.trim(), attachmentsBlock].filter(Boolean).join('\n\n')
    updatePlanEditor(nextText)
  }

  useEffect(() => {
    let cancelled = false
    async function loadBootstrap() {
      if (!session?.accessToken) return
      try {
        const [userList, templateList, productList, milestoneList, taskGroupList] = await Promise.all([
          listUsers(session.accessToken),
          listTaskTemplates(session.accessToken),
          listProducts(),
          listMilestones(session.accessToken),
          listTaskGroups(session.accessToken, { status: 'active' }),
        ])
        if (!cancelled) {
          setUsers(userList.map((user) => ({ id: user.id, name: user.displayName || user.email })))
          setTemplates(templateList)
          setProducts(productList.map((product) => ({ id: product.id, name: product.name })))
          setMilestones(milestoneList)
          setTaskGroups(taskGroupList)
        }
      } catch {
        if (!cancelled) {
          setUsers([])
          setProducts([])
          setTemplates([])
          setMilestones([])
          setTaskGroups([])
        }
      }
    }
    void loadBootstrap()
    return () => { cancelled = true }
  }, [session?.accessToken])

  useEffect(() => {
    const composedDescription = serializeTaskDescription(shortDescription, planEditorText)
    setValues((current) => current.description === composedDescription ? current : {
      ...current,
      description: composedDescription,
    })
  }, [planEditorText, shortDescription])

  useEffect(() => {
    if (taskId) {
      return
    }

    const rawDraft = sessionStorage.getItem(TASK_DRAFT_STORAGE_KEY)
    if (!rawDraft) {
      return
    }

    try {
      const draft = JSON.parse(rawDraft) as TaskUpsertPayload
      const parsed = parseTaskDescription(draft.description)
      setValues((current) => ({
        ...current,
        ...draft,
      }))
      setShortDescription(parsed.shortDescription)
      setPlan(parsed.plan)
      setPlanEditorText(parsed.planText)
      setDraftLoaded(true)
    } catch {
      sessionStorage.removeItem(TASK_DRAFT_STORAGE_KEY)
      return
    }

    sessionStorage.removeItem(TASK_DRAFT_STORAGE_KEY)
  }, [taskId])

  useEffect(() => {
    if (taskId) {
      return
    }

    const seededMilestoneId = searchParams.get('milestoneId')
    if (!seededMilestoneId) {
      return
    }

    setValues((current) => current.milestoneId ? current : {
      ...current,
      milestoneId: seededMilestoneId,
    })
    setShowMilestoneControls(true)
  }, [searchParams, taskId])

  useEffect(() => {
    let cancelled = false
    async function loadTask() {
      if (!taskId || !session?.accessToken) return
      setLoading(true)
      setErrorMessage(null)
      try {
        const task = await getTask(session.accessToken, taskId)
        const parsed = parseTaskDescription(task.description)
        if (!cancelled) {
          setShowMilestoneControls(Boolean(task.milestoneId))
          setChecklistLabels(Object.fromEntries(task.checklistItems.map((item) => [item.id, item.label])))
          setShortDescription(parsed.shortDescription)
          setPlan(parsed.plan)
          setPlanEditorText(parsed.planText)
          setValues({
            title: task.title,
            description: serializeTaskDescription(parsed.shortDescription, parsed.planText),
            status: task.status,
            priority: task.priority,
            tags: task.tags,
            taskGroupId: task.taskGroupId,
            milestoneId: task.milestoneId,
            scopeType: task.scopeType,
            entityType: task.entityType,
            entityId: task.entityId,
            entityLabel: task.entityLabel,
            templateId: task.templateId,
            assigneeId: task.assigneeId,
            dueDate: task.dueDate,
            reviewComment: task.reviewComment,
            checklistItems: task.checklistItems.map((item) => ({
              id: item.id,
              isChecked: item.isChecked,
              note: item.note,
            })),
          })
        }
      } catch (error) {
        if (!cancelled) setErrorMessage(toErrorMessage(error))
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    void loadTask()
    return () => { cancelled = true }
  }, [session?.accessToken, taskId])

  useEffect(() => {
    if (!taskId || !session?.accessToken) {
      return
    }

    void markNotificationsReadByTask(session.accessToken, taskId).catch(() => null)
  }, [session?.accessToken, taskId])

  const assigneeOptions = useMemo<LookupOption[]>(() => users.map((user) => ({ value: user.id, label: user.name })), [users])
  const taskGroupOptions = useMemo<LookupOption[]>(() => taskGroups
    .filter((group) => group.status === 'active' || group.id === values.taskGroupId)
    .map((group) => ({ value: group.id, label: group.title })), [taskGroups, values.taskGroupId])
  const milestoneOptions = useMemo<LookupOption[]>(() => milestones
    .filter((milestone) => milestone.status === 'active' || milestone.id === values.milestoneId)
    .map((milestone) => ({ value: milestone.id, label: milestone.title })), [milestones, values.milestoneId])
  const templateOptions = useMemo<LookupOption[]>(() => templates.map((template) => ({ value: template.id, label: template.name })), [templates])
  const selectedStatus = getStatusMeta(values.status)
  const selectedPriority = getPriorityMeta(values.priority)
  const selectedAssigneeLabel = users.find((user) => user.id === values.assigneeId)?.name ?? 'Unassigned'
  const selectedTaskGroupLabel = taskGroups.find((group) => group.id === values.taskGroupId)?.title ?? 'No group'
  const selectedMilestoneLabel = milestones.find((milestone) => milestone.id === values.milestoneId)?.title ?? 'No milestone'
  const headerTitle = values.title?.trim() || (isEditMode ? 'Untitled Task' : 'New Task')

  async function handleTemplateSelect(templateId: string) {
    if (!session?.accessToken) return
    if (!templateId) {
      setValues((current) => ({ ...current, templateId: null }))
      return
    }
    const template = await getTaskTemplate(session.accessToken, templateId)
    const checklistSeed = values.checklistItems.length > 0
      ? values.checklistItems
      : template.checklistItems.map((item) => ({
          id: crypto.randomUUID(),
          label: item.label,
          isChecked: false,
          note: null,
        }))
    setChecklistLabels(Object.fromEntries(checklistSeed.map((item) => [item.id, item.label ?? item.id])))
    const nextPlan = {
      ...plan,
    }
    setPlan(nextPlan)
    setPlanEditorText(serializePlanEditor(nextPlan))
    setValues((current) => ({
      ...current,
      templateId: template.id,
      title: current.title.trim() ? current.title : template.titleTemplate,
      priority: template.defaultPriority,
      tags: current.tags.length > 0 ? current.tags : template.defaultTags,
      scopeType: template.scopeType,
      entityType: template.scopeType === 'general' ? null : template.scopeType,
      checklistItems: checklistSeed,
    }))
    if (!shortDescription.trim() && template.descriptionTemplate?.trim()) {
      setShortDescription(template.descriptionTemplate)
    }
  }

  async function handleCreateMilestone() {
    if (!session?.accessToken) {
      setErrorMessage('Authorization token is required.')
      return
    }
    if (isBlank(milestoneForm.title)) {
      setErrorMessage('Milestone title is required.')
      return
    }

    setMilestoneSaving(true)
    try {
      const createdMilestone = await createMilestone(session.accessToken, milestoneForm)
      setMilestones((current) => [createdMilestone, ...current])
      setValues((current) => ({ ...current, milestoneId: createdMilestone.id }))
      setMilestoneDialogOpen(false)
      setMilestoneForm({
        title: '',
        description: null,
        entityType: null,
        entityId: null,
        status: 'active',
        dueDate: null,
      })
      showSavedToast({
        entityLabel: 'milestone',
        recordName: createdMilestone.title,
        referenceId: createdMilestone.id,
        mode: 'create',
      })
    } catch (error) {
      const message = toErrorMessage(error)
      setErrorMessage(message)
      showFailedActionToast({ entityLabel: 'milestone', action: 'create', detail: message })
    } finally {
      setMilestoneSaving(false)
    }
  }

  async function handleCreateTaskGroup() {
    if (!session?.accessToken) {
      setErrorMessage('Authorization token is required.')
      return
    }
    if (isBlank(taskGroupForm.title)) {
      setErrorMessage('Task group title is required.')
      return
    }

    setTaskGroupSaving(true)
    try {
      const createdTaskGroup = await createTaskGroup(session.accessToken, taskGroupForm)
      setTaskGroups((current) => [createdTaskGroup, ...current])
      setValues((current) => ({ ...current, taskGroupId: createdTaskGroup.id }))
      setTaskGroupDialogOpen(false)
      setTaskGroupForm({
        title: '',
        type: 'focus',
        status: 'active',
        description: null,
      })
      showSavedToast({
        entityLabel: 'task group',
        recordName: createdTaskGroup.title,
        referenceId: createdTaskGroup.id,
        mode: 'create',
      })
    } catch (error) {
      const message = toErrorMessage(error)
      setErrorMessage(message)
      showFailedActionToast({ entityLabel: 'task group', action: 'create', detail: message })
    } finally {
      setTaskGroupSaving(false)
    }
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!session?.accessToken) {
      setErrorMessage('Authorization token is required.')
      return
    }
    const nextFieldErrors = validateTask(values)
    setFieldErrors(nextFieldErrors)
    if (Object.keys(nextFieldErrors).length > 0) {
      setErrorMessage('Validation failed.')
      showValidationToast('task')
      return
    }

    setSaving(true)
    setErrorMessage(null)
    try {
      const payload: TaskUpsertPayload = {
        ...values,
        description: serializeTaskDescription(shortDescription, planEditorText),
      }
      const savedTask = taskId
        ? await updateTask(session.accessToken, taskId, payload)
        : await createTask(session.accessToken, payload)
      showSavedToast({
        entityLabel: 'task',
        recordName: savedTask.title,
        referenceId: savedTask.id,
        mode: taskId ? 'update' : 'create',
      })
      void navigate(taskId ? `/admin/dashboard/task/tasks/${savedTask.id}` : `/admin/dashboard/task/tasks/${savedTask.id}`)
    } catch (error) {
      const message = toErrorMessage(error)
      setErrorMessage(message)
      showFailedActionToast({ entityLabel: 'task', action: taskId ? 'update' : 'save', detail: message })
    } finally {
      setSaving(false)
    }
  }

  async function handleWizardContinue(payload: TaskUpsertPayload) {
    sessionStorage.setItem(TASK_DRAFT_STORAGE_KEY, JSON.stringify(payload))
    await navigate('/admin/dashboard/task/tasks/new')
  }

  if (loading) {
    return <Card className="rounded-md border-border/70 shadow-none"><CardContent className="p-8 text-sm text-muted-foreground">Loading task...</CardContent></Card>
  }

  return (
    <form className="mx-auto w-full max-w-7xl space-y-3 pt-1" onSubmit={(event) => { void handleSubmit(event) }}>
      <div className="flex flex-col justify-between gap-3 md:flex-row md:items-end">
        <div className="space-y-1">
          <Button variant="ghost" size="sm" asChild className="-ml-3 mb-2">
            <Link to={taskId ? `/admin/dashboard/task/tasks/${taskId}` : '/admin/dashboard/task/tasks'}><ArrowLeft className="size-4" />Back to tasks</Link>
          </Button>
          <h1 className="text-2xl font-semibold tracking-tight">{headerTitle}</h1>
          {!isEditMode ? <p className="text-sm text-muted-foreground">Create task</p> : null}
        </div>
        <div className="flex items-center gap-3">
          {!isEditMode ? (
            <Button type="button" variant="outline" onClick={() => setWizardOpen(true)}>
              <Sparkles className="size-4" />
              Try IFZ Beta
            </Button>
          ) : null}
          <Button type="button" variant="outline" onClick={() => { void navigate(taskId ? `/admin/dashboard/task/tasks/${taskId}` : '/admin/dashboard/task/tasks') }}>Cancel</Button>
          <Button type="submit" disabled={saving}>{saving ? 'Saving...' : isEditMode ? 'Save Changes' : 'Create Task'}</Button>
        </div>
      </div>

      {!isEditMode ? (
        <TaskCreateWizard
          open={wizardOpen}
          onOpenChange={setWizardOpen}
          templates={templates}
          milestones={milestones}
          users={users}
          products={products}
          currentUserId={session?.user.id ?? null}
          currentUserName={session?.user.displayName ?? null}
          onContinue={handleWizardContinue}
        />
      ) : null}

      {!isEditMode && draftLoaded ? (
        <Card className="rounded-md border-border/70 bg-muted/10 shadow-none">
          <CardContent className="flex items-center gap-3 p-3 text-sm">
            <div className="rounded-full border border-border/70 bg-background p-2">
              <Sparkles className="size-4 text-muted-foreground" />
            </div>
            <div>
              <p className="font-medium text-foreground">Prefilled from IFZ Beta</p>
            </div>
          </CardContent>
        </Card>
      ) : null}

      {errorMessage ? (
        <Card className={`${warningCardClassName} rounded-md`}>
          <CardContent className="rounded-md p-3 text-sm">
            <p className="font-medium">{errorMessage}</p>
            {Object.keys(fieldErrors).length > 0 ? <ul className="mt-2 list-disc space-y-1 pl-5">{summarizeFieldErrors(fieldErrors).map((message) => <li key={message}>{message}</li>)}</ul> : null}
          </CardContent>
        </Card>
      ) : null}

      <div className="grid gap-3 xl:grid-cols-[minmax(0,1fr)_minmax(18rem,22rem)]">
        <Card className="rounded-md border-border/70 shadow-none">
          <CardContent className="grid gap-3 pt-4">
            <div className="grid gap-2">
              <Label className={fieldErrors.title ? 'text-destructive' : undefined}>Title</Label>
              <Input className={inputErrorClassName(Boolean(fieldErrors.title))} value={values.title} onChange={(event) => setValues((current) => ({ ...current, title: event.target.value }))} placeholder="Ex: Verify product price update" />
              <FieldError message={fieldErrors.title} />
            </div>

            <div className="grid gap-2">
              <div className="flex items-center justify-between gap-3">
                <Label>Task Group</Label>
                <Button type="button" variant="outline" size="sm" onClick={() => setTaskGroupDialogOpen(true)}>
                  <Plus className="size-4" />
                  New
                </Button>
              </div>
              <AutocompleteLookup
                value={values.taskGroupId ?? ''}
                onChange={(value) => setValues((current) => ({ ...current, taskGroupId: value || null }))}
                options={taskGroupOptions}
                placeholder="Select task group"
                allowEmptyOption
                emptyOptionLabel="No group"
              />
            </div>

            {showMilestoneControls || values.milestoneId ? (
              <div className="grid gap-2">
                <div className="flex items-center justify-between gap-3">
                  <Label>Milestone Overlay</Label>
                  <div className="flex items-center gap-2">
                    <Button type="button" variant="outline" size="sm" onClick={() => setMilestoneDialogOpen(true)}>
                      <Plus className="size-4" />
                      New
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setValues((current) => ({ ...current, milestoneId: null }))
                        setShowMilestoneControls(false)
                      }}
                    >
                      Remove
                    </Button>
                  </div>
                </div>
                <AutocompleteLookup
                  value={values.milestoneId ?? ''}
                  onChange={(value) => setValues((current) => ({ ...current, milestoneId: value || null }))}
                  options={milestoneOptions}
                  placeholder="Select milestone"
                  allowEmptyOption
                  emptyOptionLabel="No milestone"
                />
              </div>
            ) : (
              <div className="flex items-center justify-between rounded-md border border-dashed border-border/60 bg-muted/10 px-3 py-2">
                <div>
                  <p className="text-sm font-medium text-foreground">Milestone Overlay</p>
                  <p className="text-xs text-muted-foreground">Optional structured coordination for project or bulk mode.</p>
                </div>
                <Button type="button" variant="outline" size="sm" onClick={() => setShowMilestoneControls(true)}>
                  Add milestone
                </Button>
              </div>
            )}

            <div className="grid gap-2">
              <Label>Description</Label>
              <Textarea rows={2} value={shortDescription} onChange={(event) => setShortDescription(event.target.value)} placeholder="Short context only." className="min-h-16 resize-none" />
            </div>

            <div className="grid gap-2">
              <Label>Plan</Label>
              <div className="rounded-md border border-border/60 bg-muted/10 p-3">
                <div className="space-y-3">
                  <Textarea
                    rows={7}
                    value={planEditorText}
                    onChange={(event) => {
                      const nextValue = event.target.value
                      if ((nextValue.includes('/attach') || nextValue.includes('[attach]')) && !planEditorText.includes('/attach') && !planEditorText.includes('[attach]')) {
                        openAttachPicker()
                        updatePlanEditor(nextValue.replace('/attach', '').replace('[attach]', '').trim())
                        return
                      }
                      updatePlanEditor(nextValue)
                    }}
                    onPaste={(event) => {
                      handlePlanFiles(event.clipboardData.files)
                    }}
                    placeholder="Type naturally or use light structure like ## Steps, 1. Step, and ## Notes."
                    className="min-h-32 w-full min-w-0 resize-none border-none bg-background font-mono text-sm shadow-none"
                    style={{ fieldSizing: 'fixed' as 'fixed' }}
                  />

                  <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border/60 pt-3">
                    <div className="flex flex-wrap gap-2">
                      <Button type="button" variant="outline" size="sm" onClick={openAttachPicker}>
                        <Paperclip className="size-4" />
                        Attach
                      </Button>
                      <Button type="button" variant="outline" size="sm" onClick={() => insertPlanBlock('steps')}>
                        <Plus className="size-4" />
                        Steps
                      </Button>
                      <Button type="button" variant="outline" size="sm" onClick={() => insertPlanBlock('notes')}>
                        <Plus className="size-4" />
                        Note
                      </Button>
                    </div>
                    <Button type="button" size="sm" onClick={() => setPlanEditorOpen(true)}>Open Full Editor</Button>
                  </div>

                  <input ref={planFileInputRef} type="file" multiple className="hidden" onChange={(event) => handlePlanFiles(event.target.files)} />

                  <div className="grid gap-2 md:grid-cols-2">
                    <div className="rounded-md border border-border/60 bg-background p-3">
                      <p className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">Steps</p>
                      <p className="mt-2 text-sm text-foreground">{plan.steps.length} step{plan.steps.length === 1 ? '' : 's'}</p>
                    </div>
                    <div className="rounded-md border border-border/60 bg-background p-3">
                      <p className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">Attachments</p>
                      <p className="mt-2 text-sm text-foreground">{plan.attachments.length} file{plan.attachments.length === 1 ? '' : 's'}</p>
                    </div>
                  </div>

                  {plan.attachments.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {plan.attachments.map((attachment) => <StatusBadge key={attachment.id} tone="manual">{attachment.text}</StatusBadge>)}
                    </div>
                  ) : null}
                </div>
              </div>
            </div>

            <div className="grid gap-2">
              <Label>Tags</Label>
              <Input value={values.tags.join(', ')} onChange={(event) => setValues((current) => ({ ...current, tags: event.target.value.split(',').map((tag) => tag.trim()).filter(Boolean) }))} placeholder="Ex: product, price, verification" />
            </div>

            <div className="grid gap-2 md:grid-cols-2">
              <div className="grid gap-2">
                <Label>Starter Template</Label>
                <AutocompleteLookup value={values.templateId ?? ''} onChange={(value) => { void handleTemplateSelect(value) }} options={templateOptions} placeholder="Use template as starter" allowEmptyOption emptyOptionLabel="No template" />
              </div>
              <div className="grid gap-2">
                <Label>Scope</Label>
                <AutocompleteLookup value={values.scopeType} onChange={(value) => setValues((current) => ({ ...current, scopeType: value as TaskScopeType, entityType: value === 'general' ? null : value as TaskScopeType }))} options={taskScopeOptions} placeholder="Select scope" />
              </div>
            </div>

            <div className="grid gap-2 md:grid-cols-2">
              <div className="grid gap-2">
                <Label>Entity ID</Label>
                <Input value={values.entityId ?? ''} onChange={(event) => setValues((current) => ({ ...current, entityId: event.target.value || null }))} placeholder="Ex: product:codexsun-polo" />
              </div>
              <div className="grid gap-2">
                <Label>Entity Label</Label>
                <Input value={values.entityLabel ?? ''} onChange={(event) => setValues((current) => ({ ...current, entityLabel: event.target.value || null }))} placeholder="Ex: codexsun Polo" />
              </div>
            </div>

            <div className="grid gap-3 rounded-md border border-border/60 bg-muted/10 p-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-foreground">Task Checklist</p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const id = crypto.randomUUID()
                    const label = 'New checklist item'
                    setChecklistLabels((current) => ({ ...current, [id]: label }))
                    setValues((current) => ({
                      ...current,
                      checklistItems: [...current.checklistItems, { id, label, isChecked: false, note: null }],
                    }))
                  }}
                >
                  <Plus className="size-4" />
                  Add Item
                </Button>
              </div>

              {values.checklistItems.length === 0 ? (
                <p className="text-sm text-muted-foreground">No checklist items yet.</p>
              ) : values.checklistItems.map((item, index) => (
                <div key={item.id} className="rounded-md border border-border/60 bg-background p-3">
                  <div className="flex items-start gap-3">
                    <div className="flex min-w-0 flex-1 items-start gap-3">
                      <div className="mt-2 flex size-8 shrink-0 items-center justify-center rounded-full border border-border/70 text-xs font-semibold text-muted-foreground">
                        {index + 1}
                      </div>
                      <div className="grid min-w-0 flex-1 gap-3">
                        <Input
                          value={item.label ?? checklistLabels[item.id] ?? item.id}
                          onChange={(event) => {
                            const label = event.target.value
                            setChecklistLabels((current) => ({ ...current, [item.id]: label }))
                            setValues((current) => ({
                              ...current,
                              checklistItems: current.checklistItems.map((entry, entryIndex) => entryIndex === index ? { ...entry, label } : entry),
                            }))
                          }}
                          placeholder="Checklist instruction"
                        />
                        <Input
                          value={item.note ?? ''}
                          onChange={(event) => setValues((current) => ({
                            ...current,
                            checklistItems: current.checklistItems.map((entry, entryIndex) => entryIndex === index ? { ...entry, note: event.target.value || null } : entry),
                          }))}
                          placeholder="Optional note"
                        />
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setValues((current) => ({
                          ...current,
                          checklistItems: current.checklistItems.filter((_, entryIndex) => entryIndex !== index),
                        }))}
                      >
                        Remove
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card className="rounded-md border-border/70 shadow-none">
            <CardHeader className="pb-4">
              <CardTitle>Assignment</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-3">
              <div className="grid gap-2">
                <Label>Status</Label>
                <AutocompleteLookup value={values.status} onChange={(value) => setValues((current) => ({ ...current, status: value as TaskStatus }))} options={taskStatusOptions} placeholder="Search status" />
              </div>
              <div className="grid gap-2">
                <Label>Priority</Label>
                <AutocompleteLookup value={values.priority} onChange={(value) => setValues((current) => ({ ...current, priority: value as TaskPriority }))} options={taskPriorityOptions} placeholder="Search priority" />
              </div>
              <div className="grid gap-2">
                <Label>Assignee</Label>
                <AutocompleteLookup value={values.assigneeId ?? ''} onChange={(value) => setValues((current) => ({ ...current, assigneeId: value || null }))} options={assigneeOptions} placeholder="Search assignee" allowEmptyOption emptyOptionLabel="Unassigned" />
                {session?.user.id ? (
                  <div className="flex justify-start">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setValues((current) => ({ ...current, assigneeId: session.user.id }))}
                    >
                      My Self
                    </Button>
                  </div>
                ) : null}
              </div>
              <div className="grid gap-2">
                <Label>Due Date</Label>
                <Input type="date" value={values.dueDate ?? ''} onChange={(event) => setValues((current) => ({ ...current, dueDate: event.target.value || null }))} />
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-md border-border/70 shadow-none">
            <CardHeader className="pb-4">
              <CardTitle>At A Glance</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-2.5">
              <TaskStat label="Workflow State" value={selectedStatus.label} hint="" icon={CheckCircle2} />
              <TaskStat label="Priority" value={selectedPriority.label} hint="" icon={Flag} />
              <TaskStat label="Owner" value={selectedAssigneeLabel} hint="" icon={UserRound} />
              <TaskStat label="Task Group" value={selectedTaskGroupLabel} hint="" icon={ClipboardList} />
              {values.milestoneId ? <TaskStat label="Milestone" value={selectedMilestoneLabel} hint="" icon={ClipboardList} /> : null}
              <TaskStat label="Due" value={values.dueDate || 'Not scheduled'} hint="" icon={CalendarClock} />
              <TaskStat label="Tags" value={values.tags.length > 0 ? values.tags.join(', ') : 'No tags'} hint="" icon={Tags} />
              <TaskStat label="Checklist" value={`${values.checklistItems.filter((item) => item.isChecked).length}/${values.checklistItems.length}`} hint="" icon={ClipboardList} />

              <div className="rounded-md border border-border/60 bg-muted/15 p-3">
                <p className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">Status And Priority</p>
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <StatusBadge tone={selectedStatus.tone}>{selectedStatus.label}</StatusBadge>
                  <StatusBadge tone={selectedPriority.tone}>{selectedPriority.label}</StatusBadge>
                  {values.tags.map((tag) => <StatusBadge key={tag} tone="manual">{tag}</StatusBadge>)}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <Dialog open={planEditorOpen} onOpenChange={setPlanEditorOpen}>
        <DialogContent className="flex max-h-[92vh] w-[min(96vw,58rem)] max-w-5xl flex-col overflow-hidden border border-border/70 bg-background p-0">
          <DialogHeader className="border-b border-border/70 px-5 py-4">
            <DialogTitle>Plan Builder</DialogTitle>
          </DialogHeader>

          <div className="overflow-y-auto px-5 py-5">
            <div className="grid gap-4 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,0.95fr)]">
              <div className="min-w-0 space-y-3">
                <div className="rounded-md border border-border/60 bg-muted/10 p-3">
                  <Textarea
                    rows={20}
                    value={planEditorText}
                    onChange={(event) => {
                      const nextValue = event.target.value
                      if ((nextValue.includes('/attach') || nextValue.includes('[attach]')) && !planEditorText.includes('/attach') && !planEditorText.includes('[attach]')) {
                        openAttachPicker()
                        updatePlanEditor(nextValue.replace('/attach', '').replace('[attach]', '').trim())
                        return
                      }
                      updatePlanEditor(nextValue)
                    }}
                    onPaste={(event) => handlePlanFiles(event.clipboardData.files)}
                    onDragOver={(event) => event.preventDefault()}
                    onDrop={(event) => {
                      event.preventDefault()
                      handlePlanFiles(event.dataTransfer.files)
                    }}
                    placeholder="Type naturally or use light syntax like ## Steps, 1. Step, and ## Notes."
                    className="min-h-[24rem] w-full min-w-0 resize-none border-none bg-background font-mono text-sm shadow-none"
                    style={{ fieldSizing: 'fixed' as 'fixed' }}
                  />
                </div>
              </div>

              <div className="min-w-0 space-y-3">
                <Card className="rounded-md border-border/70 shadow-none">
                  <CardHeader className="pb-3">
                    <CardTitle>Structure Panel</CardTitle>
                  </CardHeader>
                  <CardContent className="grid gap-3">
                    <TaskStat
                      label="Steps"
                      value={`${plan.steps.length}`}
                      hint={plan.steps.length > 0
                        ? plan.steps.slice(0, 3).map((step, index) => `${index + 1}. ${step.text || 'Untitled step'}`).join('\n')
                          + (plan.steps.length > 3 ? `\n+${plan.steps.length - 3} more` : '')
                        : 'No numbered steps detected yet.'}
                      icon={ClipboardList}
                    />
                    <TaskStat
                      label="Notes"
                      value={plan.notes.trim() ? 'Captured' : 'Empty'}
                      hint={plan.notes.trim()
                        ? `${plan.notes.trim().slice(0, 140)}${plan.notes.trim().length > 140 ? '…' : ''}`
                        : 'Everything outside structure will land here.'}
                      icon={Tags}
                    />
                    <TaskStat label="Summary" value={`${plan.steps.length} steps · ${plan.attachments.length} files`} hint="Live execution snapshot from the editor." icon={Flag} />
                  </CardContent>
                </Card>

                <Card className="rounded-md border-border/70 shadow-none">
                  <CardHeader className="pb-3">
                    <CardTitle>Attachments</CardTitle>
                  </CardHeader>
                  <CardContent className="grid gap-3">
                    <div className="rounded-md border border-dashed border-border/60 bg-muted/10 p-4 text-sm text-muted-foreground">
                      Use `+ Attach`, drag and drop, paste an image, or type `/attach`.
                    </div>
                    {plan.attachments.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {plan.attachments.map((attachment) => <StatusBadge key={attachment.id} tone="manual">{attachment.text}</StatusBadge>)}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">No attachments referenced yet.</p>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>

          <DialogFooter className="border-t border-border/70 px-5 py-3">
            <div className="mr-auto flex flex-wrap gap-2">
              <Button type="button" variant="outline" size="sm" onClick={openAttachPicker}>
                <Paperclip className="size-4" />
                Attach
              </Button>
              <Button type="button" variant="outline" size="sm" onClick={() => insertPlanBlock('steps')}>
                <Plus className="size-4" />
                Steps
              </Button>
              <Button type="button" variant="outline" size="sm" onClick={() => insertPlanBlock('notes')}>
                <Plus className="size-4" />
                Note
              </Button>
            </div>
            <Button type="button" variant="outline" onClick={() => setPlanEditorOpen(false)}>Cancel</Button>
            <Button type="button" onClick={() => setPlanEditorOpen(false)}>Save & Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={taskGroupDialogOpen} onOpenChange={setTaskGroupDialogOpen}>
        <DialogContent className="w-[min(94vw,32rem)] max-w-2xl border border-border/70 bg-background p-0">
          <DialogHeader className="border-b border-border/70 px-5 py-4">
            <DialogTitle>New Task Group</DialogTitle>
          </DialogHeader>

          <div className="grid gap-3 px-5 py-5">
            <div className="grid gap-2">
              <Label>Title</Label>
              <Input value={taskGroupForm.title} onChange={(event) => setTaskGroupForm((current) => ({ ...current, title: event.target.value }))} placeholder="Ex: Pricing sweep batch" />
            </div>
            <div className="grid gap-2">
              <Label>Type</Label>
              <AutocompleteLookup
                value={taskGroupForm.type}
                onChange={(value) => setTaskGroupForm((current) => ({ ...current, type: (value || 'focus') as TaskGroupUpsertPayload['type'] }))}
                options={[
                  { value: 'focus', label: 'Focus' },
                  { value: 'batch', label: 'Batch' },
                  { value: 'sprint', label: 'Sprint' },
                ]}
                placeholder="Select group type"
              />
            </div>
          </div>

          <DialogFooter className="border-t border-border/70 px-5 py-3">
            <Button type="button" variant="outline" onClick={() => setTaskGroupDialogOpen(false)}>Cancel</Button>
            <Button type="button" onClick={() => { void handleCreateTaskGroup() }} disabled={taskGroupSaving}>
              {taskGroupSaving ? 'Creating...' : 'Create Group'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={milestoneDialogOpen} onOpenChange={setMilestoneDialogOpen}>
        <DialogContent className="w-[min(94vw,32rem)] max-w-2xl border border-border/70 bg-background p-0">
          <DialogHeader className="border-b border-border/70 px-5 py-4">
            <DialogTitle>New Milestone</DialogTitle>
          </DialogHeader>

          <div className="grid gap-3 px-5 py-5">
            <div className="grid gap-2">
              <Label>Title</Label>
              <Input value={milestoneForm.title} onChange={(event) => setMilestoneForm((current) => ({ ...current, title: event.target.value }))} placeholder="Ex: Product launch pricing review" />
            </div>
            <div className="grid gap-2">
              <Label>Description</Label>
              <Textarea rows={3} value={milestoneForm.description ?? ''} onChange={(event) => setMilestoneForm((current) => ({ ...current, description: event.target.value || null }))} placeholder="Short milestone context" className="min-h-24 resize-none" />
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="grid gap-2">
                <Label>Entity Type</Label>
                <AutocompleteLookup
                  value={milestoneForm.entityType ?? ''}
                  onChange={(value) => setMilestoneForm((current) => ({ ...current, entityType: value ? value as TaskScopeType : null }))}
                  options={taskScopeOptions}
                  placeholder="Select related entity type"
                  allowEmptyOption
                  emptyOptionLabel="No entity"
                />
              </div>
              <div className="grid gap-2">
                <Label>Entity ID</Label>
                <Input value={milestoneForm.entityId ?? ''} onChange={(event) => setMilestoneForm((current) => ({ ...current, entityId: event.target.value || null }))} placeholder="Optional linked entity id" />
              </div>
            </div>
            <div className="grid gap-2">
              <Label>Due Date</Label>
              <Input type="date" value={milestoneForm.dueDate ?? ''} onChange={(event) => setMilestoneForm((current) => ({ ...current, dueDate: event.target.value || null }))} />
            </div>
          </div>

          <DialogFooter className="border-t border-border/70 px-5 py-3">
            <Button type="button" variant="outline" onClick={() => setMilestoneDialogOpen(false)}>Cancel</Button>
            <Button type="button" onClick={() => { void handleCreateMilestone() }} disabled={milestoneSaving}>
              {milestoneSaving ? 'Creating...' : 'Create Milestone'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </form>
  )
}
