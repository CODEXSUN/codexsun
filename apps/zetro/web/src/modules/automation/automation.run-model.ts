import { z } from 'zod'
import type { SystemTask, SystemTaskStep } from '../system-tasks'

const activitySchema = z.object({
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
})

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
