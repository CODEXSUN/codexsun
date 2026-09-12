import { lazy, Suspense, useEffect, useState, type FormEvent, type ReactNode } from 'react'
import {
  ArrowRight,
  Archive,
  BadgeCheck,
  ClipboardList,
  FileText,
  ListChecks,
  MessageCircle,
  Save,
  ShieldCheck,
} from 'lucide-react'
import { Button } from '@codexsun/ui/components/button'
import { Input } from '@codexsun/ui/components/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@codexsun/ui/components/tabs'
import { Textarea } from '@codexsun/ui/components/textarea'
import type { AgentTaskDraft, AgentTaskPlan, CodingWorkerAttempt } from '@codexsun/zetro-contracts'

const MarkdownContent = lazy(() =>
  import('@codexsun/ui/components/markdown-content').then((module) => ({
    default: module.MarkdownContent,
  })),
)

type TaskStep = 'source' | 'plan' | 'verify'

export function AgentTaskWorkspace({
  busy,
  onConfirm,
  onArchive,
  onOpenConversation,
  onSave,
  task,
  workerAttempts,
}: {
  busy: boolean
  onConfirm(taskId: string): Promise<void>
  onArchive(taskId: string): Promise<void>
  onOpenConversation(conversationId: string): void
  onSave(taskId: string, plan: AgentTaskPlan): Promise<void>
  task?: AgentTaskDraft
  workerAttempts: CodingWorkerAttempt[]
}) {
  const [step, setStep] = useState<TaskStep>('source')
  const [repositoryPath, setRepositoryPath] = useState('')
  const [modulePath, setModulePath] = useState('')
  const [criteria, setCriteria] = useState('')
  const [checks, setChecks] = useState('')

  useEffect(() => {
    setStep('source')
    setRepositoryPath(task?.repositoryPath ?? '')
    setModulePath(task?.modulePath ?? '')
    setCriteria(task?.acceptanceCriteria.join('\n') ?? '')
    setChecks(task?.checks.join('\n') ?? '')
  }, [task])

  if (!task) return <EmptyTask />

  const plan = {
    acceptanceCriteria: lines(criteria),
    checks: lines(checks),
    modulePath,
    repositoryPath,
  }
  const planSaved = samePlan(task, plan)
  const planComplete = Boolean(
    plan.repositoryPath.trim() &&
    plan.modulePath.trim() &&
    plan.acceptanceCriteria.length &&
    plan.checks.length,
  )

  async function save(event: FormEvent) {
    event.preventDefault()
    if (!task) return
    await onSave(task.id, plan)
  }

  return (
    <section className="size-full overflow-y-auto bg-background px-5 py-6 sm:px-8 lg:px-12">
      <div className="mx-auto max-w-5xl">
        <header className="flex flex-wrap items-start justify-between gap-4 border-b pb-5">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Task timeline
            </p>
            <h1 className="mt-1 text-xl font-semibold">{task.title}</h1>
          </div>
          <div className="flex items-center gap-2">
            <Status task={task} />
            <Button
              className="cursor-pointer"
              disabled={busy}
              onClick={() => void onArchive(task.id)}
              size="sm"
              type="button"
              variant="ghost"
            >
              <Archive />
              Archive
            </Button>
            <Button
              className="cursor-pointer"
              onClick={() => onOpenConversation(task.originConversationId)}
              size="sm"
              type="button"
              variant="ghost"
            >
              <MessageCircle />
              Conversation
            </Button>
          </div>
        </header>

        <Tabs onValueChange={(value) => setStep(value as TaskStep)} value={step}>
          <TabsList className="mt-5 grid h-auto w-full grid-cols-3 gap-1 p-1" variant="line">
            <TabsTrigger className="h-12" value="source">
              <StepNumber active={step === 'source'} complete>
                1
              </StepNumber>
              Chat source
            </TabsTrigger>
            <TabsTrigger className="h-12" value="plan">
              <StepNumber active={step === 'plan'} complete={planSaved && planComplete}>
                2
              </StepNumber>
              Plan
            </TabsTrigger>
            <TabsTrigger className="h-12" value="verify">
              <StepNumber active={step === 'verify'} complete={Boolean(task.reviewConfirmedAt)}>
                3
              </StepNumber>
              Verify ready
            </TabsTrigger>
          </TabsList>

          <TabsContent className="py-6" value="source">
            <StepHeader
              detail="This is the exact immutable prompt and completed response passed from chat."
              icon={FileText}
              title="1. Chat source"
            />
            <section className="mt-5 rounded-xl border p-5">
              <h2 className="text-sm font-semibold">Source prompt</h2>
              <p className="mt-3 whitespace-pre-wrap text-sm leading-6">{task.sourcePrompt}</p>
            </section>
            <section className="mt-4 rounded-xl border p-5">
              <h2 className="text-sm font-semibold">Completed chat response</h2>
              <div className="mt-3">
                <Suspense
                  fallback={<p className="text-sm text-muted-foreground">Loading response…</p>}
                >
                  <MarkdownContent content={task.sourceResponse} />
                </Suspense>
              </div>
            </section>
            <div className="mt-5 flex justify-end">
              <Button className="cursor-pointer" onClick={() => setStep('plan')} type="button">
                Pass to plan <ArrowRight />
              </Button>
            </div>
          </TabsContent>

          <TabsContent className="py-6" value="plan">
            <StepHeader
              detail="Define the only repository, module, criteria, and checks a worker may use."
              icon={ListChecks}
              title="2. Plan the task"
            />
            <form className="mt-5 grid gap-5" onSubmit={(event) => void save(event)}>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Repository path">
                  <Input
                    onChange={(event) => setRepositoryPath(event.target.value)}
                    placeholder="E:\\Workspace\\project"
                    value={repositoryPath}
                  />
                </Field>
                <Field label="Approved module or folder">
                  <Input
                    onChange={(event) => setModulePath(event.target.value)}
                    placeholder="apps/example"
                    value={modulePath}
                  />
                </Field>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Acceptance criteria · one per line">
                  <Textarea
                    className="min-h-28 resize-y"
                    onChange={(event) => setCriteria(event.target.value)}
                    placeholder="The requested behavior works"
                    value={criteria}
                  />
                </Field>
                <Field label="Allowed verification checks · one per line">
                  <Textarea
                    className="min-h-28 resize-y"
                    onChange={(event) => setChecks(event.target.value)}
                    placeholder="git diff --check"
                    value={checks}
                  />
                </Field>
              </div>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="text-sm text-muted-foreground">
                  Allowed: <code>git diff --check</code> or exact{' '}
                  <code>npm run &lt;script&gt;</code>.
                </p>
                <div className="flex gap-2">
                  <Button
                    className="cursor-pointer"
                    disabled={busy}
                    type="submit"
                    variant="outline"
                  >
                    <Save />
                    Save plan
                  </Button>
                  <Button
                    className="cursor-pointer"
                    disabled={!planSaved || !planComplete}
                    onClick={() => setStep('verify')}
                    type="button"
                  >
                    Review readiness <ArrowRight />
                  </Button>
                </div>
              </div>
            </form>
          </TabsContent>

          <TabsContent className="py-6" value="verify">
            <StepHeader
              detail="Check the saved scope, criteria, checks, and evidence before making the task ready."
              icon={ShieldCheck}
              title="3. Verify readiness"
            />
            <section className="mt-5 grid gap-4 sm:grid-cols-2">
              <Evidence label="Repository" value={task.repositoryPath || 'Missing'} />
              <Evidence label="Approved scope" value={task.modulePath || 'Missing'} />
              <Evidence
                label="Acceptance criteria"
                value={
                  task.acceptanceCriteria.length ? task.acceptanceCriteria.join(' · ') : 'Missing'
                }
              />
              <Evidence
                label="Verification checks"
                value={task.checks.length ? task.checks.join(' · ') : 'Missing'}
              />
              <Evidence label="Chat evidence" value="Immutable prompt and completed response" />
              <Evidence
                label="Worker evidence"
                value={
                  workerAttempts.length
                    ? `${workerAttempts.length} linked job(s)`
                    : 'No worker prepared yet'
                }
              />
            </section>
            <div className="mt-5 flex flex-wrap items-center justify-between gap-3 rounded-xl border p-4">
              <p className="text-sm text-muted-foreground">
                {task.reviewConfirmedAt
                  ? 'Ready for Worker Queue. The worker will receive this exact saved plan.'
                  : planSaved && planComplete
                    ? 'Plan is complete. Confirm it to make Worker Queue available.'
                    : 'Return to Plan and save all required values first.'}
              </p>
              <Button
                className="cursor-pointer"
                disabled={busy || Boolean(task.reviewConfirmedAt) || !planSaved || !planComplete}
                onClick={() => void onConfirm(task.id)}
                type="button"
              >
                <BadgeCheck />
                {task.reviewConfirmedAt ? 'Ready for worker' : 'Confirm review'}
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </section>
  )
}

function Status({ task }: { task: AgentTaskDraft }) {
  return (
    <span className="rounded-full border bg-muted px-3 py-1 text-xs font-medium">
      {task.reviewConfirmedAt ? 'Ready for worker' : 'Draft · awaiting review'}
    </span>
  )
}
function StepNumber({
  active,
  children,
  complete,
}: {
  active: boolean
  children: ReactNode
  complete?: boolean
}) {
  return (
    <span
      className={`grid size-5 place-items-center rounded-full text-xs ${active ? 'bg-primary text-primary-foreground' : complete ? 'bg-emerald-500 text-white' : 'bg-muted'}`}
    >
      {children}
    </span>
  )
}
function StepHeader({
  detail,
  icon: Icon,
  title,
}: {
  detail: string
  icon: typeof FileText
  title: string
}) {
  return (
    <div className="flex gap-3">
      <Icon className="mt-0.5 size-5 text-muted-foreground" />
      <div>
        <h2 className="font-semibold">{title}</h2>
        <p className="mt-1 text-sm leading-6 text-muted-foreground">{detail}</p>
      </div>
    </div>
  )
}
function Field({ children, label }: { children: ReactNode; label: string }) {
  return (
    <label className="grid gap-2 text-sm font-medium">
      {label}
      {children}
    </label>
  )
}
function Evidence({ label, value }: { label: string; value: string }) {
  return (
    <article className="rounded-xl border p-4">
      <p className="text-sm font-semibold">{label}</p>
      <p className="mt-2 break-words text-sm text-muted-foreground">{value}</p>
    </article>
  )
}
function EmptyTask() {
  return (
    <div className="grid size-full place-items-center p-8 text-center">
      <div>
        <ClipboardList className="mx-auto size-8 text-muted-foreground" />
        <h1 className="mt-4 text-lg font-semibold">No task draft selected</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Send a completed chat response to create one.
        </p>
      </div>
    </div>
  )
}
function lines(value: string) {
  return value
    .split('\n')
    .map((item) => item.trim())
    .filter(Boolean)
}
function samePlan(task: AgentTaskDraft, plan: AgentTaskPlan) {
  return (
    plan.repositoryPath === task.repositoryPath &&
    plan.modulePath === task.modulePath &&
    plan.acceptanceCriteria.join('\n') === task.acceptanceCriteria.join('\n') &&
    plan.checks.join('\n') === task.checks.join('\n')
  )
}
