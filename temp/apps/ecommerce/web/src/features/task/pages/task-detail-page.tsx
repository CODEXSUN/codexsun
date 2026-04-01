import type { Task, TaskActivity, TaskChecklistItem } from '@shared/index'
import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { ArrowLeft, CalendarClock, ClipboardList, Flag, UserRound } from 'lucide-react'
import { AnimatedTabs, type AnimatedContentTab } from '@/components/ui/animated-tabs'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { StatusBadge } from '@/components/ui/status-badge'
import { Textarea } from '@/components/ui/textarea'
import { addTaskActivity, getTask, HttpError, markNotificationsReadByTask, updateTask } from '@/shared/api/client'
import { showFailedActionToast, showSavedToast } from '@/shared/notifications/toast'
import { useAuth } from '@framework-core/web/auth/components/auth-provider'

const PLAN_SECTION_MARKER = '## Plan'

interface ParsedPlan {
  objective: string
  steps: string[]
  notes: string
  attachments: string[]
  rawText: string
}

function toErrorMessage(error: unknown) {
  if (error instanceof HttpError) return error.message
  if (error instanceof Error) return error.message
  return 'Failed to load task.'
}

function formatDateTime(value: string | null) {
  if (!value) return 'Not available'
  const parsedValue = new Date(value)
  if (Number.isNaN(parsedValue.getTime())) {
    return value
  }
  return new Intl.DateTimeFormat('en-IN', { dateStyle: 'medium', timeStyle: 'short' }).format(parsedValue)
}

function formatDate(value: string | null) {
  if (!value) return 'Not scheduled'
  const parsedValue = new Date(value)
  if (Number.isNaN(parsedValue.getTime())) {
    return value
  }
  return new Intl.DateTimeFormat('en-IN', { dateStyle: 'medium' }).format(parsedValue)
}

function getVerificationStatus(task: Task) {
  if (task.checklistTotalCount === 0 || task.checklistCompletionCount === 0) {
    return { label: 'Not started', tone: 'manual' as const }
  }
  if (task.checklistCompletionCount >= task.checklistTotalCount) {
    return { label: 'Complete', tone: 'active' as const }
  }
  return { label: 'Partial', tone: 'featured' as const }
}

function parseTaskDescription(rawDescription: string | null | undefined) {
  if (!rawDescription?.trim()) {
    return {
      shortDescription: '',
      plan: {
        objective: '',
        steps: [],
        notes: '',
        attachments: [],
        rawText: '',
      } satisfies ParsedPlan,
    }
  }

  const normalized = rawDescription.replace(/\r\n/g, '\n')
  const markerIndex = normalized.indexOf(PLAN_SECTION_MARKER)
  if (markerIndex < 0) {
    return {
      shortDescription: normalized.trim(),
      plan: {
        objective: '',
        steps: [],
        notes: '',
        attachments: [],
        rawText: '',
      } satisfies ParsedPlan,
    }
  }

  const shortDescription = normalized.slice(0, markerIndex).trim()
  const planText = normalized.slice(markerIndex + PLAN_SECTION_MARKER.length).trim()
  const lines = planText.split('\n')
  let activeSection: 'objective' | 'steps' | 'notes' | 'attachments' | null = null
  const objectiveLines: string[] = []
  const notesLines: string[] = []
  const steps: string[] = []
  const attachments: string[] = []

  for (const rawLine of lines) {
    const line = rawLine.trim()
    if (!line) continue

    if (/^#{1,3}\s+objective$/i.test(line)) {
      activeSection = 'objective'
      continue
    }
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

    if (/^\d+\.\s+/.test(line)) {
      steps.push(line.replace(/^\d+\.\s+/, '').trim())
      activeSection = 'steps'
      continue
    }

    if (/^[\u{1F4CE}]?\s*[^#].+\.(png|jpg|jpeg|gif|pdf|doc|docx|xls|xlsx|csv|txt|webp)$/iu.test(line) || /^📎\s+/.test(line)) {
      attachments.push(line.replace(/^📎\s+/, '').trim())
      activeSection = 'attachments'
      continue
    }

    if (activeSection === 'objective') {
      objectiveLines.push(line)
    } else if (activeSection === 'notes') {
      notesLines.push(line)
    } else if (activeSection === 'attachments') {
      attachments.push(line.replace(/^📎\s+/, '').trim())
    } else if (!objectiveLines.length) {
      objectiveLines.push(line)
      activeSection = 'objective'
    } else {
      notesLines.push(line)
      activeSection = 'notes'
    }
  }

  return {
    shortDescription,
    plan: {
      objective: objectiveLines.join('\n').trim(),
      steps,
      notes: notesLines.join('\n').trim(),
      attachments,
      rawText: planText,
    } satisfies ParsedPlan,
  }
}

function canUserEditTask(task: Task, user: { id: string; actorType: string; isSuperAdmin: boolean; roles: Array<{ key: string; name: string }> } | null) {
  if (!user || task.status === 'finalized') {
    return false
  }

  const isManagerLike = user.isSuperAdmin || user.roles.some((role) => {
    const key = role.key.toLowerCase()
    const name = role.name.toLowerCase()
    return key.includes('manager') || name.includes('manager')
  })

  if (user.actorType === 'admin' || isManagerLike) {
    return true
  }

  return task.assigneeId === user.id || task.creatorId === user.id || task.reviewAssignedTo === user.id
}

function isReviewerForTask(task: Task, user: { id: string } | null) {
  return Boolean(user && task.reviewAssignedTo === user.id)
}

function toTaskPayload(task: Task) {
  return {
    title: task.title,
    description: task.description,
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
  }
}

function TaskInfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid gap-1 rounded-md border border-border/60 bg-muted/10 p-3">
      <p className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">{label}</p>
      <p className="text-sm font-medium text-foreground">{value}</p>
    </div>
  )
}

function ActivityItem({ item }: { item: TaskActivity }) {
  return (
    <div className="rounded-md border border-border/60 bg-muted/10 p-3">
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1">
          <p className="text-sm font-medium text-foreground">{item.content}</p>
          <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">{item.activityType.replace('_', ' ')}</p>
        </div>
        <div className="text-right text-xs text-muted-foreground">
          <p>{item.authorName ?? 'System'}</p>
          <p>{formatDateTime(item.createdAt)}</p>
        </div>
      </div>
    </div>
  )
}

function ChecklistItemCard(props: {
  item: TaskChecklistItem
  canToggle: boolean
  toggleDisabled: boolean
  onToggle: (checked: boolean) => void
}) {
  const { item } = props
  return (
    <div className="rounded-md border border-border/60 bg-muted/10 p-3">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex min-w-0 flex-1 items-start gap-3">
          <Checkbox
            checked={item.isChecked}
            disabled={!props.canToggle || props.toggleDisabled}
            onCheckedChange={(checked) => props.onToggle(Boolean(checked))}
            className="mt-1"
          />
          <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-sm font-medium text-foreground">{item.label}</p>
            <StatusBadge tone={item.isChecked ? 'active' : 'manual'}>{item.isChecked ? 'Checked' : 'Pending'}</StatusBadge>
            {item.isRequired ? <StatusBadge tone="featured">Required</StatusBadge> : <StatusBadge tone="manual">Optional</StatusBadge>}
          </div>
          <p className="text-xs text-muted-foreground">
            {item.checkedByName ? `Checked by ${item.checkedByName}` : 'Not checked yet'}
            {item.checkedAt ? ` on ${formatDateTime(item.checkedAt)}` : ''}
          </p>
          <p className="text-sm text-muted-foreground">{item.note?.trim() || 'No checklist note added.'}</p>
        </div>
        </div>
        <p className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">Step {item.sortOrder + 1}</p>
      </div>
    </div>
  )
}

export function TaskDetailPage() {
  const navigate = useNavigate()
  const { session } = useAuth()
  const { taskId } = useParams()
  const [searchParams, setSearchParams] = useSearchParams()
  const [task, setTask] = useState<Task | null>(null)
  const [loading, setLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [commentDraft, setCommentDraft] = useState('')
  const [commentSaving, setCommentSaving] = useState(false)
  const [actionSaving, setActionSaving] = useState(false)
  const [activeTab, setActiveTab] = useState(searchParams.get('tab') || 'details')

  useEffect(() => {
    let cancelled = false

    async function loadTask() {
      if (!taskId || !session?.accessToken) {
        setLoading(false)
        return
      }

      setLoading(true)
      setErrorMessage(null)

      try {
        const item = await getTask(session.accessToken, taskId)
        if (!cancelled) {
          setTask(item)
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

    void loadTask()
    return () => { cancelled = true }
  }, [session?.accessToken, taskId])

  useEffect(() => {
    if (!taskId || !session?.accessToken) {
      return
    }

    void markNotificationsReadByTask(session.accessToken, taskId).catch(() => null)
  }, [session?.accessToken, taskId])

  useEffect(() => {
    const nextTab = searchParams.get('tab') || 'details'
    setActiveTab(nextTab)
  }, [searchParams])

  const verificationStatus = task ? getVerificationStatus(task) : null
  const parsedDescription = useMemo(() => task ? parseTaskDescription(task.description) : null, [task])
  const hasPlanSteps = Boolean(parsedDescription && parsedDescription.plan.steps.length > 0)
  const hasPlanNotes = Boolean(parsedDescription?.plan.notes.trim())
  const hasPlanAttachments = Boolean(parsedDescription && parsedDescription.plan.attachments.length > 0)
  const hasStructuredPlan = hasPlanSteps || hasPlanNotes || hasPlanAttachments
  const comments = useMemo(() => task?.activities.filter((item) => item.activityType === 'comment') ?? [], [task])
  const systemActivity = useMemo(() => task?.activities.filter((item) => item.activityType !== 'comment') ?? [], [task])
  const userCanEdit = task ? canUserEditTask(task, session?.user ?? null) : false
  const userIsReviewer = task ? isReviewerForTask(task, session?.user ?? null) : false
  const overdue = task?.taskHealth.signals.overdue === true
  const incomplete = task?.taskHealth.signals.checklistIncomplete === true
  const stuck = task?.taskHealth.status === 'stuck' || task?.taskHealth.signals.inactive === true || task?.taskHealth.signals.longInSameState === true

  async function handleWorkflowAction(nextStatus: Task['status']) {
    if (!taskId || !task || !session?.accessToken) {
      return
    }

    setActionSaving(true)
    setErrorMessage(null)
    try {
      const nextTask = await updateTask(session.accessToken, taskId, {
        ...toTaskPayload(task),
        status: nextStatus,
      })
      setTask(nextTask)
      setSearchParams((currentParams) => {
        const nextParams = new URLSearchParams(currentParams)
        nextParams.set('tab', nextStatus === 'review' ? 'activity' : nextStatus === 'finalized' ? 'progress' : nextParams.get('tab') || 'details')
        return nextParams
      })
      showSavedToast({
        entityLabel: 'task',
        recordName: nextTask.title,
        referenceId: nextTask.id,
        mode: 'update',
      })
    } catch (error) {
      const message = toErrorMessage(error)
      setErrorMessage(message)
      showFailedActionToast({ entityLabel: 'task', action: 'update', detail: message })
    } finally {
      setActionSaving(false)
    }
  }

  async function handleAddComment() {
    if (!taskId || !session?.accessToken || !commentDraft.trim()) {
      return
    }

    setCommentSaving(true)
    try {
      const nextTask = await addTaskActivity(session.accessToken, taskId, {
        activityType: 'comment',
        content: commentDraft.trim(),
      })
      setTask(nextTask)
      setCommentDraft('')
      showSavedToast({
        entityLabel: 'task comment',
        recordName: nextTask.title,
        referenceId: nextTask.id,
        mode: 'update',
      })
    } catch (error) {
      const message = toErrorMessage(error)
      setErrorMessage(message)
      showFailedActionToast({ entityLabel: 'task comment', action: 'save', detail: message })
    } finally {
      setCommentSaving(false)
    }
  }

  async function handleChecklistToggle(checklistItemId: string, checked: boolean) {
    if (!taskId || !task || !session?.accessToken) {
      return
    }

    setActionSaving(true)
    setErrorMessage(null)
    try {
      const nextTask = await updateTask(session.accessToken, taskId, {
        ...toTaskPayload(task),
        checklistItems: task.checklistItems.map((item) => ({
          id: item.id,
          isChecked: item.id === checklistItemId ? checked : item.isChecked,
          note: item.note,
        })),
      })
      setTask(nextTask)
      showSavedToast({
        entityLabel: 'task',
        recordName: nextTask.title,
        referenceId: nextTask.id,
        mode: 'update',
      })
    } catch (error) {
      const message = toErrorMessage(error)
      setErrorMessage(message)
      showFailedActionToast({ entityLabel: 'task', action: 'update', detail: message })
    } finally {
      setActionSaving(false)
    }
  }

  if (loading) {
    return (
      <Card className="rounded-md border-border/70 shadow-none">
        <CardContent className="p-8 text-sm text-muted-foreground">Loading task record...</CardContent>
      </Card>
    )
  }

  if (!task) {
    return (
      <Card className="rounded-md border-border/70 shadow-none">
        <CardContent className="p-8 text-sm text-muted-foreground">{errorMessage ?? 'Task not found.'}</CardContent>
      </Card>
    )
  }

  const taskTabs: AnimatedContentTab[] = [
    {
      label: 'Details',
      value: 'details',
      content: (
        <div className="grid gap-3 xl:grid-cols-[minmax(0,1.6fr)_minmax(17rem,0.88fr)]">
          <Card className="rounded-md border-border/70 shadow-none">
            <CardHeader className="pb-3">
              <CardTitle>Task Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="rounded-md border border-border/60 bg-muted/10 p-4">
                <p className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">Description</p>
                <p className="mt-2 whitespace-pre-wrap text-sm text-foreground">{parsedDescription?.shortDescription || 'No task description added yet.'}</p>
              </div>

              <div className="grid gap-3 md:grid-cols-2">
                <TaskInfoRow label="Objective" value={task.taskContext.objective} />
                <TaskInfoRow label="Outcome" value={task.taskContext.outcome} />
                <TaskInfoRow label="Domain" value={task.taskContext.domain} />
                <TaskInfoRow label="Task Group" value={task.taskGroupTitle ?? 'No group'} />
                <TaskInfoRow label="Entity Type" value={task.entityType ?? 'General'} />
                <TaskInfoRow label="Entity Label" value={task.entityLabel ?? task.entityId ?? 'Not linked'} />
                <TaskInfoRow label="Entity ID" value={task.entityId ?? 'Not linked'} />
                <TaskInfoRow label="Source Template" value={task.templateName ?? 'No starter template'} />
              </div>
              {task.milestoneId && task.milestoneTitle ? (
                <div className="rounded-md border border-border/60 bg-muted/10 p-4">
                  <p className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">Milestone Overlay</p>
                  <button
                    type="button"
                    onClick={() => { void navigate(`/admin/dashboard/task/milestones/${encodeURIComponent(task.milestoneId!)}`) }}
                    className="mt-2 text-sm font-medium text-foreground underline-offset-4 hover:underline"
                  >
                    {task.milestoneTitle}
                  </button>
                </div>
              ) : null}
            </CardContent>
          </Card>

          <div className="space-y-4">
            <Card className="rounded-md border-border/70 shadow-none">
              <CardHeader className="pb-3">
                <CardTitle>At A Glance</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-3">
                <TaskInfoRow label="Status" value={task.status.replace('_', ' ')} />
                <TaskInfoRow label="Priority" value={task.priority} />
                <TaskInfoRow label="Assignee" value={task.assigneeName ?? 'Unassigned'} />
                <TaskInfoRow label="Reviewer" value={task.reviewAssignedToName ?? 'Not assigned'} />
                <TaskInfoRow label="Creator" value={task.creatorName} />
                <TaskInfoRow label="Due Date" value={formatDate(task.dueDate)} />
                <TaskInfoRow label="Tags" value={task.tags.length > 0 ? task.tags.join(', ') : 'No tags'} />
                <TaskInfoRow label="Verification Status" value={verificationStatus?.label ?? 'Not started'} />
                <TaskInfoRow label="Health" value={task.taskHealth.status.replace('_', ' ')} />
              </CardContent>
            </Card>

            <Card className="rounded-md border-border/70 shadow-none">
              <CardHeader className="pb-3">
                <CardTitle>Review</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-3">
                <TaskInfoRow label="Assigned Reviewer" value={task.reviewAssignedToName ?? 'Not assigned'} />
                <TaskInfoRow label="Reviewed By" value={task.reviewedByName ?? 'Not reviewed'} />
                <TaskInfoRow label="Reviewed At" value={task.reviewedAt ? formatDateTime(task.reviewedAt) : 'Not reviewed'} />
                <TaskInfoRow label="Review Comment" value={task.reviewComment?.trim() || 'No review comment added.'} />
              </CardContent>
            </Card>
          </div>
        </div>
      ),
      contentClassName: 'border-0 bg-transparent p-0 shadow-none',
    },
    {
      label: 'Plan',
      value: 'plan',
      content: (
        <Card className="rounded-md border-border/70 shadow-none">
          <CardHeader className="pb-4">
            <CardTitle>Plan</CardTitle>
            <CardDescription>Execution plan captured for this task record.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {!parsedDescription?.plan.rawText ? (
              <p className="text-sm text-muted-foreground">No plan has been added for this task yet.</p>
            ) : (
              <>
                <div className="grid gap-3 md:grid-cols-4">
                  <TaskInfoRow label="Task Name" value={task.title} />
                  <TaskInfoRow label="Steps" value={`${parsedDescription.plan.steps.length}`} />
                  <TaskInfoRow label="Notes" value={hasPlanNotes ? 'Present' : 'Missing'} />
                  <TaskInfoRow label="Attachments" value={`${parsedDescription.plan.attachments.length}`} />
                </div>

                {!hasStructuredPlan ? (
                  <div className="rounded-md border border-border/60 bg-muted/10 p-4">
                    <p className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">Plan</p>
                    <pre className="mt-2 whitespace-pre-wrap break-words text-sm text-foreground">{parsedDescription.plan.rawText}</pre>
                  </div>
                ) : (
                  <div className="grid gap-4 xl:grid-cols-[minmax(0,1.45fr)_minmax(16rem,0.95fr)]">
                    <div className="space-y-4">
                      {hasPlanNotes ? (
                        <div className="rounded-md border border-border/60 bg-muted/10 p-4">
                          <p className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">Notes</p>
                          <p className="mt-2 whitespace-pre-wrap text-sm text-foreground">{parsedDescription.plan.notes}</p>
                        </div>
                      ) : null}
                    </div>

                    <div className="space-y-4">
                      {hasPlanSteps ? (
                        <div className="rounded-md border border-border/60 bg-muted/10 p-4">
                          <p className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">Steps</p>
                          <ol className="mt-2 space-y-2 text-sm text-foreground">
                            {parsedDescription.plan.steps.map((step, index) => <li key={`${index + 1}-${step}`}>{index + 1}. {step || 'Untitled step'}</li>)}
                          </ol>
                        </div>
                      ) : null}

                      {hasPlanAttachments ? (
                        <div className="rounded-md border border-border/60 bg-muted/10 p-4">
                          <p className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">Attachments</p>
                          <div className="mt-2 flex flex-wrap gap-2">
                            {parsedDescription.plan.attachments.map((attachment) => <StatusBadge key={attachment} tone="manual">{attachment}</StatusBadge>)}
                          </div>
                        </div>
                      ) : null}
                    </div>
                  </div>
                )}

                {hasStructuredPlan ? (
                  <details className="rounded-md border border-border/60 bg-muted/10 p-4">
                    <summary className="cursor-pointer text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">View Raw Plan</summary>
                    <pre className="mt-3 whitespace-pre-wrap break-words text-sm text-muted-foreground">{parsedDescription.plan.rawText}</pre>
                  </details>
                ) : null}
              </>
            )}
          </CardContent>
        </Card>
      ),
      contentClassName: 'border-0 bg-transparent p-0 shadow-none',
    },
    {
      label: 'Activity',
      value: 'activity',
      content: (
        <Card className="rounded-md border-border/70 shadow-none">
          <CardHeader className="pb-4">
            <CardTitle>Activity</CardTitle>
            <CardDescription>Status changes, assignments, and review actions for this record.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {systemActivity.length === 0 ? (
              <p className="text-sm text-muted-foreground">No system activity recorded yet.</p>
            ) : systemActivity.map((item) => <ActivityItem key={item.id} item={item} />)}
          </CardContent>
        </Card>
      ),
      contentClassName: 'border-0 bg-transparent p-0 shadow-none',
    },
    {
      label: 'Comments',
      value: 'comments',
      content: (
        <div className="space-y-4">
          <Card className="rounded-md border-border/70 shadow-none">
            <CardHeader className="pb-4">
              <CardTitle>Comments</CardTitle>
              <CardDescription>Use comments for working notes without editing the task record itself.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid gap-2">
                <Label htmlFor="task-comment">Add Comment</Label>
                <Textarea
                  id="task-comment"
                  rows={4}
                  value={commentDraft}
                  onChange={(event) => setCommentDraft(event.target.value)}
                  placeholder="Add a comment for the task record."
                />
              </div>
              <div className="flex justify-end">
                <Button type="button" onClick={() => { void handleAddComment() }} disabled={commentSaving || !commentDraft.trim()}>
                  {commentSaving ? 'Saving...' : 'Add Comment'}
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-md border-border/70 shadow-none">
            <CardContent className="space-y-3 pt-6">
              {comments.length === 0 ? (
                <p className="text-sm text-muted-foreground">No comments added yet.</p>
              ) : comments.map((item) => <ActivityItem key={item.id} item={item} />)}
            </CardContent>
          </Card>
        </div>
      ),
      contentClassName: 'border-0 bg-transparent p-0 shadow-none',
    },
    {
      label: 'Attachments',
      value: 'attachments',
      content: (
        <Card className="rounded-md border-border/70 shadow-none">
          <CardHeader className="pb-4">
            <CardTitle>Attachments</CardTitle>
            <CardDescription>Attachment handling can be added here without mixing it into the core task record.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <p>No attachments have been added for this task yet.</p>
            <p>Use this tab for file evidence later instead of overloading comments or checklist notes.</p>
          </CardContent>
        </Card>
      ),
      contentClassName: 'border-0 bg-transparent p-0 shadow-none',
    },
    {
      label: 'Progress',
      value: 'progress',
      content: (
        <Card className="rounded-md border-border/70 shadow-none">
          <CardHeader className="pb-4">
            <CardTitle>Progress</CardTitle>
            <CardDescription>Task-owned proof and checklist completion for this task.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap items-center gap-3">
              <StatusBadge tone={verificationStatus?.tone ?? 'manual'}>{verificationStatus?.label ?? 'Not started'}</StatusBadge>
              <p className="text-sm text-muted-foreground">
                Checklist completion <span className="font-medium text-foreground">{task.checklistCompletionCount}/{task.checklistTotalCount}</span>
              </p>
            </div>
            {task.checklistItems.length === 0 ? (
              <p className="text-sm text-muted-foreground">No checklist items exist for this task.</p>
            ) : (
              <div className="space-y-3">
                {task.checklistItems.map((item) => (
                  <ChecklistItemCard
                    key={item.id}
                    item={item}
                    canToggle={userCanEdit}
                    toggleDisabled={actionSaving}
                    onToggle={(checked) => { void handleChecklistToggle(item.id, checked) }}
                  />
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      ),
      contentClassName: 'border-0 bg-transparent p-0 shadow-none',
    },
  ]

  const contextualActions = [
    task.status === 'pending' && userCanEdit
      ? (
          <Button key="start" type="button" variant="outline" disabled={actionSaving} onClick={() => { void handleWorkflowAction('in_progress') }}>
            Start
          </Button>
        )
      : null,
    task.status === 'in_progress' && userCanEdit
      ? (
          <Button key="review" type="button" variant="outline" disabled={actionSaving} onClick={() => { void handleWorkflowAction('review') }}>
            Move To Review
          </Button>
        )
      : null,
    task.status === 'review' && userIsReviewer
      ? (
          <Button key="reject" type="button" variant="outline" disabled={actionSaving} onClick={() => { void handleWorkflowAction('in_progress') }}>
            Reject
          </Button>
        )
      : null,
    task.status === 'review' && userIsReviewer
      ? (
          <Button key="approve" type="button" disabled={actionSaving} onClick={() => { void handleWorkflowAction('finalized') }}>
            Finalize
          </Button>
        )
      : null,
  ].filter(Boolean)

  return (
    <div className="space-y-3 pt-1">
      <div className="sticky top-3 z-20 rounded-md border border-border/70 bg-background/95 shadow-sm backdrop-blur supports-[backdrop-filter]:bg-background/80">
        <div className="flex flex-col justify-between gap-3 p-3 md:flex-row md:items-start">
          <div className="space-y-1.5">
            <Button variant="ghost" size="sm" asChild className="-ml-3">
              <Link to="/admin/dashboard/task/tasks"><ArrowLeft className="size-4" />Back to tasks</Link>
            </Button>
            <div className="space-y-1.5">
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Task ID {task.id}</p>
                <StatusBadge tone={verificationStatus?.tone ?? 'manual'}>{verificationStatus?.label ?? 'Not started'}</StatusBadge>
                {overdue ? <StatusBadge tone="manual">Overdue</StatusBadge> : null}
                {incomplete ? <StatusBadge tone="featured">Incomplete</StatusBadge> : null}
                {stuck ? <StatusBadge tone="publishing">Stuck</StatusBadge> : null}
              </div>
              <h1 className="text-2xl font-semibold tracking-tight">{task.title}</h1>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {userCanEdit ? (
              <Button type="button" variant="outline" onClick={() => { void navigate(`/admin/dashboard/task/tasks/${task.id}/edit`) }}>
                Edit
              </Button>
            ) : null}
            {contextualActions}
          </div>
        </div>
      </div>

      {errorMessage ? (
        <Card className="rounded-md border-destructive/30 bg-destructive/5 shadow-none">
          <CardContent className="p-4 text-sm text-destructive">{errorMessage}</CardContent>
        </Card>
      ) : null}

      <Card className="rounded-md border-border/70 shadow-none">
        <CardContent className="flex flex-wrap items-center gap-2.5 p-3">
          <div className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-muted/20 px-3 py-1 text-xs uppercase tracking-[0.16em] text-muted-foreground">
            <ClipboardList className="size-3.5" />
            Task Record
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge tone={task.status === 'finalized' ? 'active' : task.status === 'review' ? 'featured' : task.status === 'in_progress' ? 'publishing' : 'manual'}>
              {task.status.replace('_', ' ')}
            </StatusBadge>
            <StatusBadge tone={task.priority === 'urgent' ? 'active' : task.priority === 'high' ? 'featured' : task.priority === 'medium' ? 'publishing' : 'manual'}>
              {task.priority}
            </StatusBadge>
            {task.tags.map((tag) => <StatusBadge key={tag} tone="manual">{tag}</StatusBadge>)}
          </div>
          <div className="ml-auto flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
            <span className="inline-flex items-center gap-1.5"><UserRound className="size-4" />{task.assigneeName ?? 'Unassigned'}</span>
            <span className="inline-flex items-center gap-1.5"><CalendarClock className="size-4" />{formatDate(task.dueDate)}</span>
            <span className="inline-flex items-center gap-1.5"><Flag className="size-4" />{task.priority}</span>
          </div>
        </CardContent>
      </Card>

      <Card className="rounded-md border-border/70 shadow-none">
        <CardContent className="flex flex-col gap-2.5 p-3 md:flex-row md:items-center md:justify-between">
          <div className="space-y-1">
            <p className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">Progress</p>
            <p className="text-lg font-semibold text-foreground">{task.checklistCompletionCount} / {task.checklistTotalCount} completed</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge tone={verificationStatus?.tone ?? 'manual'}>{verificationStatus?.label ?? 'Not started'}</StatusBadge>
            {incomplete ? <StatusBadge tone="featured">Incomplete verification</StatusBadge> : null}
            {task.reviewAssignedToName ? <StatusBadge tone="publishing">Reviewer {task.reviewAssignedToName}</StatusBadge> : null}
          </div>
        </CardContent>
      </Card>

      <AnimatedTabs
        defaultTabValue="details"
        selectedTabValue={activeTab}
        onTabChange={(value) => {
          setActiveTab(value)
          setSearchParams((currentParams) => {
            const nextParams = new URLSearchParams(currentParams)
            if (value === 'details') {
              nextParams.delete('tab')
            } else {
              nextParams.set('tab', value)
            }
            return nextParams
          })
        }}
        tabs={taskTabs}
      />
    </div>
  )
}
