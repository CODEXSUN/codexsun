import {
  ArrowLeft,
  ArrowRight,
  Bot,
  CircleStop,
  Clock,
  Download,
  FileText,
  Terminal,
  Wrench,
} from 'lucide-react'
import { Button } from '@codexsun/ui/components/button'
import { Badge } from '@codexsun/ui/components/badge'
import { Spinner } from '@codexsun/ui/components/spinner'
import { ExecutionStatus } from '@codexsun/ui/blocks/execution-status'
import {
  WorkspaceActionCard,
  WorkspaceMetricCard,
  WorkspaceMetricGrid,
  WorkspaceSectionCard,
} from '@codexsun/ui/blocks/workspace'
import type { SystemTaskDetail } from '../system-tasks'
import {
  isLiveRun,
  runTimeline,
  runTitle,
  runReport,
  runSummary,
  runActivityState,
  runDuration,
  runEvidence,
} from './automation.run-model'

export function AutomationRunDetail({
  task,
  onBack,
  onStop,
  onDiagnose,
  busy,
  connected,
  animated,
  now,
}: {
  task: SystemTaskDetail
  onBack(): void
  onStop(): void
  onDiagnose(): void
  busy: boolean
  connected: boolean
  animated: boolean
  now: number
}) {
  const evidence = runEvidence(task)
  const live = isLiveRun(task)
  const activityState = runActivityState(task, connected)
  const failed = evidence.activities.filter((activity) => activity.status === 'failed').length
  const timeline = runTimeline(task.steps)
  const currentTool = live
    ? [...evidence.activities].reverse().find((item) => item.status === 'running')
    : undefined
  function downloadReport() {
    const text = runReport(task)
    const url = URL.createObjectURL(new Blob([text], { type: 'text/plain;charset=utf-8' }))
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = `zetro-run-${task.id}.txt`
    anchor.click()
    window.setTimeout(() => URL.revokeObjectURL(url), 1000)
  }
  return (
    <article className="grid gap-6">
      <header className="flex flex-wrap items-start gap-3">
        <Button variant="outline" onClick={onBack}>
          <ArrowLeft /> Back to runs
        </Button>
        <div className="min-w-0 flex-1">
          <h2 className="break-words text-xl font-semibold">{runTitle(task)}</h2>
          <p className="break-all text-xs text-muted-foreground">
            {task.id} · {task.type}
          </p>
        </div>
        <Badge variant={task.error ? 'destructive' : 'secondary'}>{task.status}</Badge>
      </header>
      <ExecutionStatus
        state={
          activityState.active
            ? 'active'
            : task.status === 'completed'
              ? 'complete'
              : live && connected
                ? 'idle'
                : 'attention'
        }
        title={activityState.label}
        animated={animated}
        elapsed={runDuration(task, now)}
        description={
          live
            ? currentTool
              ? `Last observed tool: ${currentTool.label}`
              : 'Waiting for the next reported action · completion time is not estimated'
            : 'Final state received · inspect the report below'
        }
        metrics={[
          {
            label: 'Tools reported running',
            value: evidence.activities.filter((item) => item.status === 'running').length,
          },
          { label: 'Response characters received', value: evidence.response?.length ?? 0 },
          { label: 'Durable updates', value: task.steps.length },
        ]}
      />
      <WorkspaceMetricGrid>
        <WorkspaceMetricCard
          icon={Clock}
          label="Elapsed"
          value={runDuration(task, now)}
          description={live ? 'Updates while this page is visible' : 'Recorded run duration'}
        />
        <WorkspaceMetricCard
          icon={Wrench}
          label="Recorded tool actions"
          value={evidence.activities.length}
          description="Reported actions, not tool availability"
        />
        <WorkspaceMetricCard
          icon={FileText}
          label="Recorded steps"
          value={task.steps.length}
          description={`Attempt ${task.attempts} of ${task.maxAttempts}`}
        />
        <WorkspaceMetricCard
          icon={CircleStop}
          label="Failed tool actions"
          value={failed}
          description={
            evidence.exitCode === undefined
              ? 'No exit code reported'
              : `Exit code ${evidence.exitCode}`
          }
        />
      </WorkspaceMetricGrid>
      <div
        className="grid items-center gap-3 lg:grid-cols-[1fr_auto_1fr_auto_1fr]"
        aria-label="Execution connections"
      >
        <WorkspaceActionCard
          icon={FileText}
          title="Instruction"
          description="Approved job or repository script"
        />
        <ArrowRight className="size-4 text-muted-foreground" aria-hidden="true" />
        <WorkspaceActionCard
          icon={task.type.startsWith('supervisor.') ? Bot : Terminal}
          title={task.type.startsWith('supervisor.') ? 'Agent executor' : 'Script executor'}
          description={`${activityState.label} · ${evidence.model ?? 'Model not reported'}`}
        />
        <ArrowRight className="size-4 text-muted-foreground" aria-hidden="true" />
        <WorkspaceActionCard
          icon={FileText}
          title="Execution evidence"
          description={
            evidence.response
              ? 'Executor response available below'
              : live
                ? 'Waiting for executor response'
                : 'No response recorded'
          }
        />
      </div>
      <div className="flex flex-wrap gap-2">
        <Button variant="outline" onClick={downloadReport}>
          <Download /> Download report
        </Button>
        {live && (
          <Button variant="outline" disabled={busy || task.status === 'stopping'} onClick={onStop}>
            <CircleStop /> {task.status === 'stopping' ? 'Stopping…' : 'Stop run'}
          </Button>
        )}
        {['failed', 'blocked', 'stopped'].includes(task.status) && (
          <Button variant="outline" onClick={onDiagnose}>
            <Bot /> Prepare diagnosis
          </Button>
        )}
      </div>
      {task.error && (
        <p role="alert" className="whitespace-pre-wrap break-words text-sm text-destructive">
          {task.error}
        </p>
      )}
      <WorkspaceSectionCard title="Instruction">
        <p className="whitespace-pre-wrap break-words text-sm leading-6">{evidence.instruction}</p>
      </WorkspaceSectionCard>
      <WorkspaceSectionCard
        title="Execution timeline"
        description="Observed tool state changes and response receipts. Times are snapshot receipt times, not exact tool start times."
      >
        <ol className="grid gap-4 border-l pl-4">
          {timeline.map((step) => (
            <li key={step.id} className="grid gap-1">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant={step.status === 'failed' ? 'destructive' : 'outline'}>
                  {step.status}
                </Badge>
                <time className="text-xs text-muted-foreground">
                  {new Date(step.at).toLocaleString()}
                </time>
              </div>
              <p className="whitespace-pre-wrap break-words text-sm">{step.message}</p>
            </li>
          ))}
        </ol>
        {!timeline.length && (
          <p className="text-sm text-muted-foreground">Waiting for the first recorded step.</p>
        )}
      </WorkspaceSectionCard>
      <WorkspaceSectionCard
        title="Tools used"
        description={
          live
            ? 'Observed tool activity. Live snapshots keep the latest 40 actions.'
            : 'Actions reported by the executor.'
        }
      >
        <div className="grid gap-3">
          {evidence.activities.map((activity, index) => (
            <div key={`${index}-${activity.kind}`} className="grid gap-1 border-b pb-3">
              <div className="flex items-center gap-2">
                {activity.status === 'running' && activityState.active ? (
                  <Spinner animated={animated} aria-label="Tool running" />
                ) : (
                  <Wrench className="size-4" />
                )}
                <strong className="text-sm">{activity.kind}</strong>
                <Badge variant="outline">{activity.status}</Badge>
              </div>
              <pre className="whitespace-pre-wrap break-all text-xs leading-5">
                {activity.label}
                {activity.details ? `\n${activity.details}` : ''}
              </pre>
            </div>
          ))}
        </div>
        {!evidence.activities.length && (
          <p className="text-sm text-muted-foreground">
            No tool activity recorded yet. This does not mean no tools were used.
          </p>
        )}
      </WorkspaceSectionCard>
      <WorkspaceSectionCard
        title="Execution summary"
        description="Derived from recorded states, not an agent-written report or release approval."
      >
        <pre className="whitespace-pre-wrap break-words font-sans text-sm leading-6">
          {runSummary(task)}
        </pre>
      </WorkspaceSectionCard>
      <WorkspaceSectionCard title={live ? 'Executor response · partial' : 'Executor response'}>
        <pre className="whitespace-pre-wrap break-words font-sans text-sm leading-6">
          {evidence.response ??
            'No response has been saved. Failures and cancellation evidence appear in the timeline above.'}
        </pre>
        {evidence.worktree && (
          <p className="pt-4 break-all text-xs text-muted-foreground">
            Worktree: {evidence.worktree}
          </p>
        )}
      </WorkspaceSectionCard>
    </article>
  )
}
