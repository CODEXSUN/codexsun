import { resolve } from 'node:path'
import { setTimeout as delay } from 'node:timers/promises'
import type { ZetroCliApi } from './client.js'

export interface CliContext {
  client: ZetroCliApi
  write(value: unknown): void
}

export async function runCommand(args: string[], context: CliContext): Promise<void> {
  const [command = 'help', ...rest] = args
  if (command === 'help') return context.write(helpText())
  if (command === 'health') return context.write(await context.client.get('/health/ready'))
  if (command === 'projects') return context.write(await context.client.get('/api/v1/projects'))
  if (command === 'metrics')
    return context.write(await context.client.get('/api/v1/operations/metrics'))
  if (command === 'diagnostics') return downloadDiagnostics(rest, context)
  if (command === 'worktrees') return context.write(await context.client.get('/api/v1/worktrees'))
  if (command === 'sweep') return sweepWorktrees(rest, context)
  if (command === 'tasks') return listTasks(rest, context)
  if (command === 'task') return showTask(rest, context)
  if (command === 'watch') return watchTask(rest, context)
  if (command === 'stop' || command === 'retry') return updateTask(command, rest, context)
  if (command === 'status') return projectGet(rest, 'developer-tools/status', context)
  if (command === 'scripts') return projectGet(rest, 'developer-tools/scripts', context)
  if (command === 'run') return runScript(rest, context)
  if (command === 'launch') return launchTool(rest, context)
  if (command === 'git') return runGit(rest, context)
  if (command === 'release') return runRelease(rest, context)
  throw new Error(`Unknown command: ${command}. Run zetro help.`)
}

async function downloadDiagnostics(args: string[], context: CliContext): Promise<void> {
  const output = resolve(args[0] ?? `zetro-diagnostics-${Date.now()}.json`)
  context.write(await context.client.download('/api/v1/operations/diagnostics', output))
}

async function sweepWorktrees(args: string[], context: CliContext): Promise<void> {
  requireConfirm(args)
  const retentionDays = positiveNumber(args[0], 'retention days')
  context.write(await context.client.post('/api/v1/worktrees/sweep', { retentionDays }))
}

async function listTasks(args: string[], context: CliContext): Promise<void> {
  const query = args[0] ? `?${new URLSearchParams({ projectId: args[0] })}` : ''
  context.write(await context.client.get(`/api/v1/system-tasks${query}`))
}

async function showTask(args: string[], context: CliContext): Promise<void> {
  context.write(await context.client.get(`/api/v1/system-tasks/${required(args[0], 'task ID')}`))
}

async function watchTask(args: string[], context: CliContext): Promise<void> {
  const taskId = required(args[0], 'task ID')
  const interval = positiveNumber(option(args, '--interval') ?? '2', 'interval') * 1_000
  for (;;) {
    const payload = await context.client.get(`/api/v1/system-tasks/${taskId}`)
    context.write(payload)
    const status = taskStatus(payload)
    if (!['pending', 'running', 'stopping'].includes(status)) return
    await delay(interval)
  }
}

async function updateTask(action: string, args: string[], context: CliContext): Promise<void> {
  const taskId = required(args[0], 'task ID')
  context.write(await context.client.post(`/api/v1/system-tasks/${taskId}/${action}`))
}

async function projectGet(args: string[], resource: string, context: CliContext): Promise<void> {
  const projectId = required(args[0], 'project ID')
  context.write(await context.client.get(`/api/v1/projects/${projectId}/${resource}`))
}

async function runScript(args: string[], context: CliContext): Promise<void> {
  const projectId = required(args[0], 'project ID')
  const script = required(args[1], 'script')
  if (/^(clean|release)(:|$)/u.test(script)) requireConfirm(args)
  context.write(
    await context.client.post(`/api/v1/projects/${projectId}/developer-tools/script-tasks`, {
      script,
    }),
  )
}

async function launchTool(args: string[], context: CliContext): Promise<void> {
  const projectId = required(args[0], 'project ID')
  const target = required(args[1], 'target')
  if (!['editor', 'files', 'terminal'].includes(target))
    throw new Error('Use editor, files, or terminal.')
  context.write(
    await context.client.post(`/api/v1/projects/${projectId}/developer-tools/launch`, { target }),
  )
}

async function runGit(args: string[], context: CliContext): Promise<void> {
  const [action] = args
  const projectId = required(args[1], 'project ID')
  if (action === 'fetch') return postGit(projectId, { action }, context)
  if (action === 'sync')
    return postGit(projectId, { action, strategy: option(args, '--strategy') ?? 'rebase' }, context)
  if (action === 'commit') {
    requireConfirm(args)
    return postGit(
      projectId,
      {
        action,
        message: required(option(args, '--message'), 'commit message'),
        stageAll: args.includes('--stage-all'),
      },
      context,
    )
  }
  if (action === 'push') {
    requireConfirm(args)
    return postGit(
      projectId,
      { action, forceWithLease: args.includes('--force-with-lease') },
      context,
    )
  }
  throw new Error('Use git fetch, sync, commit, or push.')
}

async function postGit(projectId: string, body: unknown, context: CliContext): Promise<void> {
  context.write(
    await context.client.post(`/api/v1/projects/${projectId}/developer-tools/actions`, body),
  )
}

async function runRelease(args: string[], context: CliContext): Promise<void> {
  const [action] = args
  const projectId = required(args[1], 'project ID')
  const title = option(args, '--title') ?? 'Release changes'
  const previewPath = `/api/v1/projects/${projectId}/git-delivery/preview?${new URLSearchParams({ title })}`
  const preview = await context.client.get(previewPath)
  if (action === 'preview') return context.write(preview)
  if (action !== 'run') throw new Error('Use release preview or release run.')
  requireConfirm(args)
  const state = deliveryPreview(preview)
  context.write(
    await context.client.post(`/api/v1/projects/${projectId}/git-delivery/flows`, {
      bumpVersion: args.includes('--version'),
      commitMessage: option(args, '--message') ?? state.suggestedCommitMessage,
      databaseUpdate: option(args, '--database') ?? 'auto',
      expectedFiles: state.changedFiles,
      expectedHead: state.head,
      note: option(args, '--note') ?? title,
      push: args.includes('--push'),
      syncStrategy: option(args, '--sync') ?? 'none',
      title,
      writeChangelog: args.includes('--changelog'),
    }),
  )
}

function deliveryPreview(value: unknown): {
  changedFiles: string[]
  head: string
  suggestedCommitMessage: string
} {
  if (typeof value !== 'object' || !value) throw new Error('Invalid release preview.')
  const preview = value as Record<string, unknown>
  if (
    !Array.isArray(preview.changedFiles) ||
    typeof preview.head !== 'string' ||
    typeof preview.suggestedCommitMessage !== 'string'
  ) {
    throw new Error('Invalid release preview.')
  }
  return {
    changedFiles: preview.changedFiles.map(String),
    head: preview.head,
    suggestedCommitMessage: preview.suggestedCommitMessage,
  }
}

function taskStatus(value: unknown): string {
  if (typeof value !== 'object' || !value || !('task' in value)) return ''
  const task = value.task
  return typeof task === 'object' && task && 'status' in task ? String(task.status) : ''
}

function option(args: string[], name: string): string | undefined {
  const index = args.indexOf(name)
  return index >= 0 ? args[index + 1] : undefined
}

function requireConfirm(args: string[]): void {
  if (!args.includes('--confirm')) throw new Error('Review the preview, then add --confirm.')
}

function positiveNumber(value: string | undefined, name: string): number {
  const number = Number(value)
  if (!Number.isInteger(number) || number < 1) throw new Error(`Use a positive ${name}.`)
  return number
}

function required(value: string | undefined, name: string): string {
  if (!value) throw new Error(`A ${name} is required.`)
  return value
}

export function helpText(): string {
  return [
    'Zetro deterministic automation CLI',
    '',
    'zetro projects | health | metrics | diagnostics [file]',
    'zetro status <project> | scripts <project> | run <project> <script>',
    'zetro tasks [project] | task <id> | watch <id> | stop <id> | retry <id>',
    'zetro git fetch|sync|commit|push <project> [options]',
    'zetro release preview|run <project> [options]',
    'zetro worktrees | sweep <days> --confirm',
    'zetro launch <project> editor|files|terminal',
  ].join('\n')
}
