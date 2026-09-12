import { spawn } from 'node:child_process'
import { resolve } from 'node:path'
import type { CodingWorkerAttempt } from '@codexsun/zetro-contracts'
import type { WorkerRunner } from '../application/coding-worker.ports.js'

type ActiveWorker = {
  child: ReturnType<typeof spawn>
  stopped: boolean
}

export class CodexWorkerRunner implements WorkerRunner {
  private readonly active = new Map<string, ActiveWorker>()

  start(input: Parameters<WorkerRunner['start']>[0]) {
    if (this.active.has(input.attempt.id)) throw new Error('This coding worker is already running.')
    const modulePath = resolve(input.attempt.worktreePath, input.attempt.modulePath)
    const child = spawn(
      'codex',
      [
        '--sandbox',
        'workspace-write',
        '--ask-for-approval',
        'never',
        'exec',
        '--json',
        '--ephemeral',
        '--cd',
        modulePath,
        input.instructions,
      ],
      { shell: false, stdio: ['ignore', 'pipe', 'pipe'], windowsHide: true },
    )
    const active = { child, stopped: false }
    this.active.set(input.attempt.id, active)
    input.onEvent({ message: `Codex started in ${modulePath}.`, type: 'started' })
    child.stdout.setEncoding('utf8')
    child.stderr.setEncoding('utf8')
    child.stdout.on('data', (value: string) => this.report(input, value, 'activity'))
    child.stderr.on('data', (value: string) => this.report(input, value, 'error'))
    child.on('error', (error) => input.onEvent({ message: error.message, type: 'error' }))
    child.on('close', (exitCode) => {
      this.active.delete(input.attempt.id)
      const status = active.stopped ? 'stopped' : exitCode === 0 ? 'complete' : 'failed'
      input.onExit({ exitCode: exitCode ?? undefined, status })
    })
  }

  stop(attemptId: string) {
    const active = this.active.get(attemptId)
    if (!active?.child.pid) return false
    active.stopped = true
    const taskkill = spawn('taskkill', ['/PID', String(active.child.pid), '/T', '/F'], {
      shell: false,
      stdio: 'ignore',
      windowsHide: true,
    })
    taskkill.on('error', () => active.child.kill())
    return true
  }

  private report(
    input: Parameters<WorkerRunner['start']>[0],
    chunk: string,
    type: 'activity' | 'error',
  ) {
    for (const line of chunk.split(/\r?\n/)) {
      const message = summarize(line)
      if (message) input.onEvent({ message, type })
    }
  }
}

function summarize(line: string) {
  const trimmed = line.trim()
  if (!trimmed) return undefined
  try {
    const event = JSON.parse(trimmed) as {
      item?: { command?: string; text?: string; type?: string }
      type?: string
    }
    if (event.item?.type === 'command_execution' && event.item.command) {
      return `Ran command: ${event.item.command}`
    }
    if (event.item?.type === 'agent_message' && event.item.text) {
      return event.item.text.slice(0, 8 * 1024)
    }
    return event.type ? `Codex event: ${event.type}` : trimmed.slice(0, 8 * 1024)
  } catch {
    return trimmed.slice(0, 8 * 1024)
  }
}
