import { spawn } from 'node:child_process'
import { randomUUID } from 'node:crypto'
import { stat } from 'node:fs/promises'
import { join, resolve } from 'node:path'
import type { RunnerEnvironment } from '../../config.js'

export type ProviderId = 'codex' | 'opencode' | 'ollama'
export type CrewRun = {
  durationMs: number
  error?: string
  id: string
  model: string
  provider: ProviderId
  status: 'completed' | 'failed'
  workspaceId: string
}
type RunInput = { model?: string; prompt: string; provider: ProviderId; workspaceId: string }

export class CrewRunnerService {
  private readonly runs: CrewRun[] = []
  public constructor(private readonly environment: RunnerEnvironment) {}

  public async overview() {
    const providers = await Promise.all(
      (['codex', 'opencode', 'ollama'] as const).map((id) => this.inspect(id)),
    )
    const completed = this.runs.filter((run) => run.status === 'completed').length
    return {
      metrics: { completed, failed: this.runs.length - completed, total: this.runs.length },
      providers,
      recentRuns: this.runs.slice(-12).reverse(),
    }
  }

  public async run(input: RunInput) {
    const startedAt = Date.now()
    const model = input.model || this.defaultModel(input.provider)
    const run: CrewRun = {
      durationMs: 0,
      id: randomUUID(),
      model,
      provider: input.provider,
      status: 'failed',
      workspaceId: input.workspaceId,
    }
    try {
      const workspace = await this.workspace(input.workspaceId)
      const message = await this.execute(input.provider, input.prompt, model, workspace)
      run.status = 'completed'
      return { ...run, durationMs: Date.now() - startedAt, message }
    } catch (error) {
      run.error =
        error instanceof Error ? error.message : 'The provider did not return a safe error.'
      throw error
    } finally {
      run.durationMs = Date.now() - startedAt
      this.runs.push(run)
      if (this.runs.length > 100) this.runs.shift()
    }
  }

  private async inspect(id: ProviderId) {
    try {
      if (id === 'ollama') {
        const response = await fetch(`${this.environment.AGENT_CREW_OLLAMA_URL}/api/tags`, {
          signal: AbortSignal.timeout(2_000),
        })
        return { id, model: 'local Ollama', status: response.ok ? 'ready' : 'unavailable' }
      }
      const command = id === 'codex' ? 'codex' : 'opencode'
      await runCommand(command, ['--version'], '/tmp', 5_000)
      return { id, model: this.defaultModel(id), status: 'ready' }
    } catch {
      return { id, model: this.defaultModel(id), status: 'configuration-required' }
    }
  }

  private async execute(provider: ProviderId, prompt: string, model: string, workspace: string) {
    if (provider === 'ollama') return this.runOllama(prompt, model)
    if (provider === 'codex')
      return runCommand(
        'codex',
        ['exec', '--json', '--full-auto', '-m', model, prompt],
        workspace,
        120_000,
      )
    return runCommand(
      'opencode',
      ['run', '--format', 'json', '--model', model, prompt],
      workspace,
      120_000,
    )
  }

  private async runOllama(prompt: string, model: string) {
    const response = await fetch(`${this.environment.AGENT_CREW_OLLAMA_URL}/api/generate`, {
      body: JSON.stringify({ model, prompt, stream: false }),
      headers: { 'Content-Type': 'application/json' },
      method: 'POST',
      signal: AbortSignal.timeout(120_000),
    })
    const payload: unknown = await response.json().catch(() => null)
    if (
      !response.ok ||
      typeof payload !== 'object' ||
      payload === null ||
      !('response' in payload) ||
      typeof payload.response !== 'string'
    )
      throw new Error('Ollama did not return a complete response.')
    return payload.response
  }

  private defaultModel(provider: ProviderId) {
    if (provider === 'codex') return this.environment.CODEX_MODEL || 'account default'
    if (provider === 'opencode') return this.environment.OPENCODE_MODEL
    return 'qwen3:4b'
  }

  private async workspace(workspaceId: string) {
    const path = resolve(this.environment.AGENT_CREW_WORKSPACE_ROOT, workspaceId)
    if (!path.startsWith(`${resolve(this.environment.AGENT_CREW_WORKSPACE_ROOT)}/`))
      throw new Error('The requested workspace is outside the isolated workspace root.')
    if (!(await stat(path)).isDirectory())
      throw new Error(`Workspace "${workspaceId}" is not mounted for this worker.`)
    return join(path)
  }
}

function runCommand(
  command: string,
  args: string[],
  cwd: string,
  timeoutMs: number,
): Promise<string> {
  return new Promise((resolvePromise, reject) => {
    const child = spawn(command, args, { cwd, env: process.env, stdio: ['ignore', 'pipe', 'pipe'] })
    let output = ''
    let error = ''
    const timer = setTimeout(() => {
      child.kill('SIGKILL')
      reject(new Error(`${command} exceeded its execution limit.`))
    }, timeoutMs)
    child.stdout.on('data', (chunk: Buffer) => {
      output += chunk
      if (output.length > 1_000_000) child.kill('SIGKILL')
    })
    child.stderr.on('data', (chunk: Buffer) => {
      error += chunk
    })
    child.once('error', (cause) => {
      clearTimeout(timer)
      reject(cause)
    })
    child.once('exit', (code) => {
      clearTimeout(timer)
      code === 0
        ? resolvePromise(output.trim())
        : reject(new Error(error.trim() || `${command} exited with code ${code}.`))
    })
  })
}
