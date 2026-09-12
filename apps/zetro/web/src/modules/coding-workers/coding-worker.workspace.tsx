import type { FormEvent } from 'react'
import { Button } from '@codexsun/ui/components/button'
import { Archive, CheckCircle2, GitBranch, Play, ShieldCheck, Sparkles, Square, Trash2, Wrench, XCircle } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import type {
  AgentTaskDraft,
  CodingWorkerAttempt,
  CodingWorkerHandoffRequest,
} from '@codexsun/zetro-contracts'

export function CodingWorkerWorkspace({
  attempts,
  busy,
  onUpdate,
  task,
  onPrepare,
}: {
  attempts: CodingWorkerAttempt[]
  busy: boolean
  onUpdate(attemptId: string, action: 'approve' | 'archive' | 'cleanup' | 'integrate' | 'reject' | 'verify' | 'start' | 'stop'): Promise<void>
  task?: AgentTaskDraft
  onPrepare(input: CodingWorkerHandoffRequest): Promise<void>
}) {
  async function submit(event: FormEvent) {
    event.preventDefault()
    if (!task?.reviewConfirmedAt) return
    await onPrepare({ taskId: task.id })
  }

  return (
    <section className="size-full overflow-y-auto bg-background px-5 py-6 sm:px-8 lg:px-12">
      <div className="mx-auto max-w-4xl">
        <header className="border-b pb-5">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Worker handoff
          </p>
          <h1 className="mt-1 text-xl font-semibold">Prepare an isolated coding worker</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
            Zetro copies the confirmed task plan into one branch and worktree. Workers cannot merge,
            push, or deploy.
          </p>
        </header>
        {!task ? (
          <p className="py-10 text-sm text-muted-foreground">
            Select a task draft before preparing a worker.
          </p>
        ) : (
          <form className="grid gap-6 py-6" onSubmit={(event) => void submit(event)}>
            <section className="rounded-xl border p-4">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Task
              </p>
              <p className="mt-1 text-sm font-semibold">{task.title}</p>
            </section>
            <section className="grid gap-4 rounded-xl border p-4 text-sm sm:grid-cols-2">
              <PlanValue label="Repository" value={task.repositoryPath || 'Not set'} />
              <PlanValue label="Approved scope" value={task.modulePath || 'Not set'} />
              <PlanList label="Acceptance criteria" values={task.acceptanceCriteria} />
              <PlanList label="Verification checks" values={task.checks} />
            </section>
            <section className="grid gap-3 border-y py-5 text-sm sm:grid-cols-3">
              <ToolProfile
                icon={Wrench}
                label="Tool profile"
                value="Inspect, edit, test, Git evidence"
              />
              <ToolProfile icon={GitBranch} label="Git boundary" value="Branch and worktree only" />
              <ToolProfile
                icon={ShieldCheck}
                label="Isolation"
                value="Separate worktree and branch"
              />
            </section>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-sm text-muted-foreground">
                {task.reviewConfirmedAt
                  ? 'The confirmed plan will be copied into one isolated worker.'
                  : 'Return to Task Queue to save and confirm this task plan.'}
              </p>
              <Button
                className="cursor-pointer"
                disabled={busy || !task.reviewConfirmedAt}
                type="submit"
              >
                <CheckCircle2 />
                Prepare worker
              </Button>
            </div>
          </form>
        )}
        {attempts.length ? (
          <section className="border-t py-6">
            <h2 className="text-sm font-semibold">Prepared jobs</h2>
            <div className="mt-3 grid gap-3">
              {attempts.map((attempt) => (
                <article className="rounded-xl border p-4 text-sm" key={attempt.id}>
                  <p className="font-medium">{attempt.branchName}</p>
                  <p className="mt-1 text-muted-foreground">
                    {attempt.revision.slice(0, 12)} · {attempt.modulePath}
                  </p>
                  <p className="mt-1 text-xs font-medium text-muted-foreground">
                    {labelForApproval(attempt.approvalStatus)}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {labelForExecution(attempt.execution.status)}
                  </p>
                  {attempt.integratedAt ? (
                    <p className="mt-1 text-xs font-medium text-emerald-700">Applied to the main checkout</p>
                  ) : null}
                  {attempt.cleanedAt ? (
                    <p className="mt-1 text-xs text-muted-foreground">Isolated worktree cleaned</p>
                  ) : null}
                  {attempt.execution.events.length ? (
                    <ol className="mt-3 grid gap-1 border-l pl-3 text-xs text-muted-foreground">
                      {attempt.execution.events.slice(-6).map((event) => (
                        <li key={`${event.createdAt}-${event.message}`}>
                          {event.message}
                        </li>
                      ))}
                    </ol>
                  ) : null}
                  {attempt.verification.length ? (
                    <ul className="mt-3 grid gap-1 text-xs text-muted-foreground">
                      {attempt.verification.map((result) => (
                        <li key={result.command}>
                          {result.passed ? 'Passed' : 'Failed'} · {result.command} ·{' '}
                          {result.durationMs}ms
                        </li>
                      ))}
                    </ul>
                  ) : null}
                  <div className="mt-4 flex flex-wrap gap-2">
                    <Button
                      disabled={busy || attempt.execution.status !== 'not-started'}
                      onClick={() => void onUpdate(attempt.id, 'start')}
                      size="sm"
                      type="button"
                    >
                      <Play />
                      Start worker
                    </Button>
                    <Button
                      disabled={busy || attempt.execution.status !== 'working'}
                      onClick={() => void onUpdate(attempt.id, 'stop')}
                      size="sm"
                      type="button"
                      variant="outline"
                    >
                      <Square className="fill-current" />
                      Stop
                    </Button>
                    <Button
                      disabled={
                        busy ||
                        attempt.approvalStatus === 'approved' ||
                        attempt.execution.status !== 'complete'
                      }
                      onClick={() => void onUpdate(attempt.id, 'verify')}
                      size="sm"
                      type="button"
                      variant="outline"
                    >
                      <Play />
                      Run checks
                    </Button>
                    <Button
                      disabled={busy || attempt.approvalStatus !== 'awaiting-approval'}
                      onClick={() => void onUpdate(attempt.id, 'approve')}
                      size="sm"
                      type="button"
                    >
                      <CheckCircle2 />
                      Approve
                    </Button>
                    <Button
                      disabled={busy || attempt.approvalStatus === 'approved'}
                      onClick={() => void onUpdate(attempt.id, 'reject')}
                      size="sm"
                      type="button"
                      variant="ghost"
                    >
                      <XCircle />
                      Reject
                    </Button>
                    <Button
                      disabled={busy || attempt.approvalStatus !== 'approved' || Boolean(attempt.integratedAt) || Boolean(attempt.cleanedAt)}
                      onClick={() => void onUpdate(attempt.id, 'integrate')}
                      size="sm"
                      type="button"
                    >
                      <Sparkles />
                      Apply approved work
                    </Button>
                    <Button
                      disabled={busy || attempt.execution.status === 'working' || Boolean(attempt.archivedAt)}
                      onClick={() => void onUpdate(attempt.id, 'archive')}
                      size="sm"
                      type="button"
                      variant="ghost"
                    >
                      <Archive />
                      Archive
                    </Button>
                    <Button
                      disabled={busy || attempt.execution.status === 'working' || Boolean(attempt.cleanedAt)}
                      onClick={() => {
                        if (window.confirm('Clean this isolated worktree and its local branch? The worker record will remain.')) {
                          void onUpdate(attempt.id, 'cleanup')
                        }
                      }}
                      size="sm"
                      type="button"
                      variant="ghost"
                    >
                      <Trash2 />
                      Clean worktree
                    </Button>
                  </div>
                </article>
              ))}
            </div>
          </section>
        ) : null}
      </div>
    </section>
  )
}

function labelForApproval(status: CodingWorkerAttempt['approvalStatus']) {
  if (status === 'awaiting-verification') return 'Awaiting verification'
  if (status === 'awaiting-approval') return 'Checks passed · awaiting approval'
  if (status === 'approved') return 'Approved · ready for explicit integration'
  return 'Rejected · repair before another review'
}

function labelForExecution(status: CodingWorkerAttempt['execution']['status']) {
  if (status === 'not-started') return 'Ready to start in the isolated worktree'
  if (status === 'working') return 'Working · activity is saved as it arrives'
  if (status === 'complete') return 'Worker complete · ready for named checks'
  if (status === 'stopped') return 'Stopped · partial work is preserved'
  return 'Worker failed · partial work is preserved'
}

function PlanValue({ label, value }: { label: string; value: string }) {
  return <ToolProfile icon={GitBranch} label={label} value={value} />
}

function PlanList({ label, values }: { label: string; values: string[] }) {
  return (
    <ToolProfile
      icon={ShieldCheck}
      label={label}
      value={values.length ? values.join(' · ') : 'Not set'}
    />
  )
}

function ToolProfile({
  icon: Icon,
  label,
  value,
}: {
  icon: LucideIcon
  label: string
  value: string
}) {
  return (
    <div className="flex items-start gap-3">
      <Icon className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
      <span>
        <span className="block text-muted-foreground">{label}</span>
        <span className="mt-1 block break-all font-medium">{value}</span>
      </span>
    </div>
  )
}
