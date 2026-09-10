import { z } from 'zod'
import type { SystemTask, SystemTaskStep } from '../system-tasks'

const activitySchema = z.object({
  itemId: z.string().optional(),
  kind: z.string(),
  label: z.string(),
  status: z.string(),
  details: z.string().optional(),
})
const resultSchema = z.object({
  message: z.object({ content: z.string() }).optional(),
  output: z.string().optional(),
  exitCode: z.number().optional(),
  model: z.string().optional(),
  execution: z
    .object({
      activities: z.array(activitySchema).default([]),
      worktreePath: z.string().optional(),
      workflow: z.string().optional(),
    })
    .optional(),
})
const instructionSchema = z.object({
  prompt: z.string().optional(),
  script: z.string().optional(),
  workflow: z.string().optional(),
  scope: z.object({ application: z.string(), module: z.string().optional() }).optional(),
})

export function runTitle(task: SystemTask): string {
  const input = instructionSchema.safeParse(task.input)
  if (!task.type.startsWith('supervisor.')) return `${task.title} · ${task.id.slice(0, 8)}`
  const scope = input.success ? input.data.scope : undefined
  const workflow = input.success ? (input.data.workflow ?? 'review') : 'review'
  return `${workflow} · ${scope ? [scope.application, scope.module].filter(Boolean).join(' / ') : 'Agent job'} · ${task.id.slice(0, 8)}`
}

export function runTimeline(steps: SystemTaskStep[]) {
  const entries: { id: string; at: string; status: string; message: string }[] = []
  let previous = new Map<string, string>()
  let response = ''
  for (const step of steps) {
    const snapshot = readRunProgress(step.message)
    if (!snapshot) {
      entries.push({
        id: step.id,
        at: step.completedAt,
        status: step.status,
        message: step.message.startsWith('zetro.progress.')
          ? 'Progress snapshot could not be read.'
          : step.message,
      })
      continue
    }
    const current = new Map<string, string>()
    snapshot.activities.forEach((activity, index) => {
      const key = activity.itemId ?? `${index}:${activity.kind}:${activity.label}`
      const signature = JSON.stringify([activity.kind, activity.label, activity.status])
      current.set(key, signature)
      if (previous.get(key) !== signature)
        entries.push({
          id: `${step.id}:${key}`,
          at: step.completedAt,
          status: activity.status,
          message: `${activity.kind}: ${activity.label}`,
        })
    })
    if (snapshot.response !== response)
      entries.push({
        id: `${step.id}:response`,
        at: step.completedAt,
        status: 'info',
        message: `Public response received · ${snapshot.response.length.toLocaleString()} characters in the retained snapshot`,
      })
    previous = current
    response = snapshot.response
  }
  return entries
}

export function runSummary(task: SystemTask & { steps?: SystemTaskStep[] }) {
  const evidence = runEvidence(task)
  const counts = new Map<string, number>()
  evidence.activities.forEach((activity) =>
    counts.set(activity.status, (counts.get(activity.status) ?? 0) + 1),
  )
  return [
    `Execution state: ${task.status}. This is not release approval.`,
    `Observed tool actions: ${evidence.activities.length}${counts.size ? ` (${[...counts].map(([status, count]) => `${count} ${status}`).join(', ')})` : '. Tool telemetry is unavailable.'}`,
    `Exit code: ${evidence.exitCode ?? 'not reported'}.`,
    `Executor response: ${evidence.response ? 'available below' : 'not recorded'}.`,
    task.error
      ? `Failure: ${task.error}`
      : 'No task-level failure recorded. This does not certify application correctness.',
  ].join('\n')
}

export function runReport(task: SystemTask & { steps: SystemTaskStep[] }) {
  const evidence = runEvidence(task)
  return [
    `# ${runTitle(task)}`,
    `Run: ${task.id}`,
    `Duration: ${runDuration(task)}`,
    '\n## Execution summary',
    runSummary(task),
    '\n## Instruction',
    evidence.instruction,
    '\n## Observed timeline',
    ...runTimeline(task.steps).map((item) => `${item.at} [${item.status}] ${item.message}`),
    '\n## Executor response',
    evidence.response ?? 'Not recorded.',
    '\n## Worktree',
    evidence.worktree ?? 'Not reported.',
  ].join('\n')
}

export function isLiveRun(task: Pick<SystemTask, 'status'>): boolean {
  return ['pending', 'running', 'stopping'].includes(task.status)
}

export function runActivityState(task: Pick<SystemTask, 'status'>, connected: boolean) {
  if (!isLiveRun(task)) {
    return {
      active: false,
      label: task.status === 'completed' ? 'Run complete' : 'Run needs review',
    }
  }
  if (!connected) return { active: false, label: 'Updates interrupted' }
  if (task.status === 'pending') return { active: false, label: 'Queued for execution' }
  if (task.status === 'stopping') return { active: true, label: 'Stopping safely' }
  return { active: true, label: 'Execution in progress' }
}

export function runEvidence(task: SystemTask & { steps?: SystemTaskStep[] }) {
  const result = resultSchema.safeParse(task.result)
  const progress = [...(task.steps ?? [])]
    .reverse()
    .map((step) => readRunProgress(step.message))
    .find((value) => value !== null)
  const input = instructionSchema.safeParse(task.input)
  return {
    instruction: input.success
      ? (input.data.prompt ?? input.data.script ?? task.title)
      : task.title,
    response:
      (result.success ? (result.data.message?.content ?? result.data.output) : undefined) ??
      progress?.response,
    activities:
      (result.success ? result.data.execution?.activities : undefined) ??
      progress?.activities ??
      [],
    worktree: result.success ? result.data.execution?.worktreePath : undefined,
    model: result.success ? result.data.model : undefined,
    exitCode: result.success ? result.data.exitCode : undefined,
  }
}

export function readRunProgress(message: string) {
  if (!message.startsWith('zetro.progress.v1:')) return null
  try {
    const parsed = z
      .object({ response: z.string(), activities: z.array(activitySchema) })
      .safeParse(JSON.parse(message.slice('zetro.progress.v1:'.length)))
    return parsed.success ? parsed.data : null
  } catch {
    return null
  }
}

export function runDuration(task: SystemTask, now = Date.now()): string {
  if (!task.startedAt) return 'Not started'
  const end = task.completedAt ? Date.parse(task.completedAt) : now
  const seconds = Math.max(0, Math.floor((end - Date.parse(task.startedAt)) / 1000))
  if (!Number.isFinite(seconds)) return 'Unavailable'
  return seconds < 60 ? `${seconds}s` : `${Math.floor(seconds / 60)}m ${seconds % 60}s`
}
