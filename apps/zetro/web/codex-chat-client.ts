import { spawn, spawnSync, type ChildProcessWithoutNullStreams } from 'node:child_process'
import { existsSync, mkdirSync, readdirSync, statSync } from 'node:fs'
import { createInterface } from 'node:readline'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import type { ChatStreamEvent } from './src/modules/shell/chat-stream.contract.ts'

type RpcMessage = {
  error?: { message?: string }
  id?: number
  method?: string
  params?: unknown
  result?: unknown
}

type PendingRequest = {
  reject(error: Error): void
  resolve(value: unknown): void
  timeout: NodeJS.Timeout
}

type TurnCollector = {
  content: string
  reject(error: Error): void
  resolve(content: string): void
  timeout: NodeJS.Timeout
  onEvent(event: ChatStreamEvent): void
}

const chatModel = 'gpt-5.3-codex-spark'
const chatReasoningEffort = 'low'
const responseTimeoutMilliseconds = 5 * 60 * 1000

export class CodexChatClient {
  private nextRequestId = 1
  private process: ChildProcessWithoutNullStreams | null = null
  private startPromise: Promise<void> | null = null
  private readonly pendingRequests = new Map<number, PendingRequest>()
  private readonly turns = new Map<string, TurnCollector>()

  public async run(prompt: string, onEvent: (event: ChatStreamEvent) => void) {
    const threadResult = asRecord(
      await this.request('thread/start', {
        approvalPolicy: 'never',
        cwd: resolveChatWorkingDirectory(),
        ephemeral: true,
        model: chatModel,
        sandbox: 'read-only',
        serviceName: 'zetro',
        threadSource: 'zetro',
      }),
    )
    const threadId = readString(asRecord(threadResult.thread), 'id')
    const completion = this.collectTurn(threadId, onEvent)

    try {
      await this.request('turn/start', {
        cwd: resolveChatWorkingDirectory(),
        effort: chatReasoningEffort,
        input: [{ text: prompt, type: 'text' }],
        threadId,
      })
      return await completion
    } catch (error) {
      this.rejectTurn(threadId, toError(error))
      throw error
    }
  }

  public async close() {
    const child = this.process
    this.process = null
    this.startPromise = null
    if (!child) return
    this.failPending(new Error('Codex chat server stopped.'))
    stopProcessTree(child)
  }

  private async request(method: string, params: unknown, timeoutMilliseconds = 15_000) {
    await this.start()
    return this.requestWithoutStart(method, params, timeoutMilliseconds)
  }

  private requestWithoutStart(method: string, params: unknown, timeoutMilliseconds = 15_000) {
    const requestId = this.nextRequestId++
    return new Promise<unknown>((resolve, reject) => {
      const timeout = setTimeout(() => {
        this.pendingRequests.delete(requestId)
        reject(new Error(`Codex timed out while handling ${method}.`))
      }, timeoutMilliseconds)
      this.pendingRequests.set(requestId, { reject, resolve, timeout })
      this.write({ id: requestId, method, params })
    })
  }

  private async start() {
    if (this.process) return
    if (this.startPromise) return this.startPromise
    this.startPromise = this.initialize()
    try {
      await this.startPromise
    } finally {
      this.startPromise = null
    }
  }

  private async initialize() {
    const child = spawn(resolveCodexExecutable(), ['app-server', '--stdio'], {
      cwd: resolveChatWorkingDirectory(),
      stdio: ['pipe', 'pipe', 'pipe'],
      windowsHide: process.platform === 'win32',
    })
    this.process = child
    child.stderr.resume()
    child.once('error', (error) => this.handleProcessFailure(child, error))
    child.once('exit', () =>
      this.handleProcessFailure(child, new Error('Codex chat server stopped unexpectedly.')),
    )
    createInterface({ input: child.stdout }).on('line', (line) => this.handleLine(line))

    await waitForSpawn(child)
    await this.requestWithoutStart('initialize', {
      clientInfo: { name: 'zetro', title: 'Zetro', version: '2.0.0' },
    })
    this.write({ method: 'initialized', params: {} })
  }

  private write(message: object) {
    if (!this.process?.stdin.writable) throw new Error('Codex chat server is unavailable.')
    this.process.stdin.write(`${JSON.stringify(message)}\n`)
  }

  private handleLine(line: string) {
    let message: RpcMessage
    try {
      message = JSON.parse(line) as RpcMessage
    } catch {
      return
    }
    if (typeof message.id === 'number') this.handleResponse(message)
    if (message.method) this.handleNotification(message.method, message.params)
  }

  private handleResponse(message: RpcMessage) {
    const pending = this.pendingRequests.get(message.id!)
    if (!pending) return
    clearTimeout(pending.timeout)
    this.pendingRequests.delete(message.id!)
    if (message.error) pending.reject(new Error(message.error.message ?? 'Codex request failed.'))
    else pending.resolve(message.result)
  }

  private handleNotification(method: string, params: unknown) {
    const values = isRecord(params) ? params : {}
    const threadId = typeof values.threadId === 'string' ? values.threadId : undefined
    if (!threadId) return
    const collector = this.turns.get(threadId)
    if (!collector) return

    if (method === 'item/agentMessage/delta' && typeof values.delta === 'string') {
      collector.content += values.delta
      collector.onEvent({ delta: values.delta, type: 'response' })
      return
    }
    if (method === 'item/started' || method === 'item/completed') {
      const item = isRecord(values.item) ? values.item : {}
      if (item.type !== 'agentMessage') {
        collector.onEvent({ item, method, type: 'activity' })
      }
      if (item.type === 'agentMessage' && typeof item.text === 'string') {
        collector.content = item.text
      }
      return
    }
    if (method !== 'turn/completed') return

    const turn = isRecord(values.turn) ? values.turn : {}
    if (turn.status !== 'completed' || !collector.content.trim()) {
      const failure = isRecord(turn.error) ? turn.error : {}
      this.rejectTurn(
        threadId,
        new Error(typeof failure.message === 'string' ? failure.message : 'Codex turn failed.'),
      )
      return
    }

    clearTimeout(collector.timeout)
    this.turns.delete(threadId)
    collector.resolve(collector.content)
  }

  private collectTurn(threadId: string, onEvent: (event: ChatStreamEvent) => void) {
    return new Promise<string>((resolve, reject) => {
      const timeout = setTimeout(
        () => this.rejectTurn(threadId, new Error('Codex response timed out.')),
        responseTimeoutMilliseconds,
      )
      this.turns.set(threadId, { content: '', onEvent, reject, resolve, timeout })
    })
  }

  private rejectTurn(threadId: string, error: Error) {
    const collector = this.turns.get(threadId)
    if (!collector) return
    clearTimeout(collector.timeout)
    this.turns.delete(threadId)
    collector.reject(error)
  }

  private handleProcessFailure(child: ChildProcessWithoutNullStreams, error: Error) {
    if (this.process !== child) return
    this.process = null
    this.startPromise = null
    this.failPending(error)
  }

  private failPending(error: Error) {
    for (const pending of this.pendingRequests.values()) {
      clearTimeout(pending.timeout)
      pending.reject(error)
    }
    for (const threadId of this.turns.keys()) this.rejectTurn(threadId, error)
    this.pendingRequests.clear()
  }
}

function resolveChatWorkingDirectory() {
  const path = join(tmpdir(), 'zetro-codex-chat')
  mkdirSync(path, { recursive: true })
  return path
}

function resolveCodexExecutable() {
  const configuredPath = process.env.ZETRO_CODEX_PATH
  if (configuredPath && existsSync(configuredPath)) return configuredPath
  if (process.platform !== 'win32') return 'codex'

  const pathMatch = spawnSync('where.exe', ['codex.exe'], {
    encoding: 'utf8',
    windowsHide: true,
  })
    .stdout?.split(/\r?\n/)
    .find((candidate) => candidate && existsSync(candidate))
  if (pathMatch) return pathMatch

  const installRoot = process.env.LOCALAPPDATA
    ? join(process.env.LOCALAPPDATA, 'OpenAI', 'Codex', 'bin')
    : ''
  const installedExecutables =
    installRoot && existsSync(installRoot)
      ? readdirSync(installRoot)
          .map((folder) => join(installRoot, folder, 'codex.exe'))
          .filter(existsSync)
          .sort((left, right) => statSync(right).mtimeMs - statSync(left).mtimeMs)
      : []
  if (installedExecutables[0]) return installedExecutables[0]

  throw new Error('Codex CLI was not found. Install Codex or set ZETRO_CODEX_PATH.')
}

function stopProcessTree(child: ChildProcessWithoutNullStreams) {
  if (!child.pid || child.exitCode !== null) return
  if (process.platform === 'win32') {
    spawnSync('taskkill.exe', ['/PID', String(child.pid), '/T', '/F'], {
      stdio: 'ignore',
      windowsHide: true,
    })
    return
  }
  child.kill('SIGTERM')
}

function waitForSpawn(child: ChildProcessWithoutNullStreams) {
  return new Promise<void>((resolve, reject) => {
    child.once('spawn', resolve)
    child.once('error', reject)
  })
}

function asRecord(value: unknown) {
  if (!isRecord(value)) throw new Error('Codex returned an invalid response.')
  return value
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function readString(value: Record<string, unknown>, key: string) {
  const result = value[key]
  if (typeof result !== 'string' || !result) throw new Error(`Codex did not return ${key}.`)
  return result
}

function toError(error: unknown) {
  return error instanceof Error ? error : new Error('Codex request failed.')
}
