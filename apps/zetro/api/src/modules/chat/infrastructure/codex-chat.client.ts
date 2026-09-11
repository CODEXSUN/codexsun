import { spawn, type ChildProcessWithoutNullStreams } from 'node:child_process'
import { createInterface } from 'node:readline'
import type {
  ChatStreamEvent,
  ProviderDeviceLoginResponse,
  ProviderModel,
  ProviderReasoningEffort,
} from '@codexsun/zetro-contracts'
import type { ProviderAccount, ProviderRunResult } from '../../providers/index.js'
import {
  resolveChatWorkingDirectory,
  resolveCodexExecutable,
  stopProcessTree,
  waitForSpawn,
} from './codex-process.js'

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
  onEvent(event: ChatStreamEvent): void
  reject(error: Error): void
  resolve(result: ProviderRunResult): void
  timeout: NodeJS.Timeout
}

type ThreadSession = { activeTurn?: Promise<string>; threadId: string }

const responseTimeoutMilliseconds = 5 * 60 * 1000

export class CodexChatClient {
  private nextRequestId = 1
  private process: ChildProcessWithoutNullStreams | null = null
  private startPromise: Promise<void> | null = null
  private readonly pendingRequests = new Map<number, PendingRequest>()
  private readonly conversations = new Map<string, Promise<ThreadSession>>()
  private readonly loginCallbacks = new Map<string, (success: boolean, error?: string) => void>()
  private readonly turns = new Map<string, TurnCollector>()

  public async run(
    conversationId: string,
    prompt: string,
    onEvent: (event: ChatStreamEvent) => void,
    providerThreadId: string | undefined,
    onProviderThread: (threadId: string) => void,
    model: string | undefined,
    effort: ProviderReasoningEffort,
  ) {
    const session = await this.getConversation(
      conversationId,
      providerThreadId,
      onProviderThread,
      onEvent,
      model,
      effort,
    )
    if (session.activeTurn) throw new Error('This Zetro chat is already responding.')
    const completion = this.collectTurn(session.threadId, onEvent)
    const activeTurn = this.request('turn/start', {
      cwd: resolveChatWorkingDirectory(),
      effort,
      input: [{ text: prompt, type: 'text' }],
      model,
      threadId: session.threadId,
    }).then((result) => readString(asRecord(asRecord(result).turn), 'id'))
    session.activeTurn = activeTurn

    try {
      await activeTurn
      return await completion
    } catch (error) {
      this.rejectTurn(session.threadId, toError(error))
      await completion.catch(() => undefined)
      throw error
    } finally {
      if (session.activeTurn === activeTurn) session.activeTurn = undefined
    }
  }

  public async stop(conversationId: string) {
    const sessionPromise = this.conversations.get(conversationId)
    if (!sessionPromise) throw new Error('This Zetro chat has no active response.')
    const session = await sessionPromise
    if (!session.activeTurn) throw new Error('This Zetro chat has no active response.')
    await this.request('turn/interrupt', {
      threadId: session.threadId,
      turnId: await session.activeTurn,
    })
  }

  public async readAccount(): Promise<ProviderAccount> {
    const result = asRecord(await this.request('account/read', { refreshToken: false }))
    const account = isRecord(result.account) ? result.account : undefined
    if (!account) return { authenticated: false }
    const email = typeof account.email === 'string' ? account.email : undefined
    const plan = typeof account.planType === 'string' ? account.planType : undefined
    const type = typeof account.type === 'string' ? account.type : 'Codex'
    return { authenticated: true, label: [email ?? type, plan].filter(Boolean).join(' · ') }
  }

  public async listModels(): Promise<ProviderModel[]> {
    const models: ProviderModel[] = []
    let cursor: string | undefined
    do {
      const result = asRecord(
        await this.request('model/list', {
          cursor: cursor ?? null,
          includeHidden: false,
          limit: 100,
        }),
      )
      const page = Array.isArray(result.data) ? result.data : []
      for (const value of page) {
        const model = asRecord(value)
        const id = readString(model, 'model')
        models.push({
          description: typeof model.description === 'string' ? model.description : '',
          displayName: typeof model.displayName === 'string' ? model.displayName : id,
          id,
          isDefault: model.isDefault === true,
          supportedReasoningEfforts: readReasoningEfforts(model.supportedReasoningEfforts),
        })
      }
      cursor = typeof result.nextCursor === 'string' ? result.nextCursor : undefined
    } while (cursor)
    return models
  }

  public async startDeviceLogin(
    onComplete: (success: boolean, error?: string) => void,
  ): Promise<ProviderDeviceLoginResponse> {
    const result = asRecord(
      await this.request('account/login/start', { type: 'chatgptDeviceCode' }),
    )
    const response = {
      loginId: readString(result, 'loginId'),
      userCode: readString(result, 'userCode'),
      verificationUrl: readString(result, 'verificationUrl'),
    }
    this.loginCallbacks.set(response.loginId, onComplete)
    return response
  }

  public async restart() {
    await this.close()
    await this.start()
  }

  public async smoke(model: string, effort: ProviderReasoningEffort) {
    const startedAt = Date.now()
    const result = asRecord(
      await this.request('thread/start', {
        approvalPolicy: 'never',
        cwd: resolveChatWorkingDirectory(),
        developerInstructions: 'This is a connection smoke test. Reply exactly ZETRO_SMOKE_OK.',
        ephemeral: true,
        model,
        sandbox: 'read-only',
        serviceName: 'zetro-smoke',
        threadSource: 'zetro',
      }),
    )
    const threadId = readString(asRecord(result.thread), 'id')
    const completion = this.collectTurn(threadId, () => undefined, 30_000)
    try {
      await this.request('turn/start', {
        cwd: resolveChatWorkingDirectory(),
        effort,
        input: [{ text: 'Reply exactly ZETRO_SMOKE_OK.', type: 'text' }],
        model,
        threadId,
      })
      const response = (await completion).content.trim()
      if (response !== 'ZETRO_SMOKE_OK')
        throw new Error('Codex returned an invalid smoke response.')
      return {
        completedAt: Date.now(),
        latencyMs: Date.now() - startedAt,
        ok: true as const,
        response: 'ZETRO_SMOKE_OK' as const,
      }
    } finally {
      await this.request('thread/delete', { threadId }).catch(() => undefined)
    }
  }

  public async close() {
    const child = this.process
    this.process = null
    this.startPromise = null
    this.conversations.clear()
    if (!child) return
    this.failPending(new Error('Codex chat server stopped.'))
    stopProcessTree(child)
  }

  private getConversation(
    conversationId: string,
    providerThreadId: string | undefined,
    onProviderThread: (threadId: string) => void,
    onEvent: (event: ChatStreamEvent) => void,
    model: string | undefined,
    effort: ProviderReasoningEffort,
  ) {
    const existing = this.conversations.get(conversationId)
    if (existing) return existing
    const created = this.resumeOrStartThread(providerThreadId, onEvent, model, effort)
      .then((session) => {
        onProviderThread(session.threadId)
        return session
      })
      .catch((error) => {
        if (this.conversations.get(conversationId) === created) {
          this.conversations.delete(conversationId)
        }
        throw error
      })
    this.conversations.set(conversationId, created)
    return created
  }

  private async resumeOrStartThread(
    providerThreadId: string | undefined,
    onEvent: (event: ChatStreamEvent) => void,
    model: string | undefined,
    effort: ProviderReasoningEffort,
  ): Promise<ThreadSession> {
    if (!providerThreadId) return this.startThread(model, effort)
    try {
      const result = asRecord(
        await this.request('thread/resume', {
          approvalPolicy: 'never',
          cwd: resolveChatWorkingDirectory(),
          developerInstructions: codexIdentityInstructions(model, effort),
          excludeTurns: true,
          model,
          sandbox: 'read-only',
          threadId: providerThreadId,
        }),
      )
      return { threadId: readString(asRecord(result.thread), 'id') }
    } catch (error) {
      onEvent({
        item: { message: toError(error).message, status: 'new-context' },
        method: 'thread/recovery',
        type: 'activity',
      })
      return this.startThread(model, effort)
    }
  }

  private async startThread(
    model: string | undefined,
    effort: ProviderReasoningEffort,
  ): Promise<ThreadSession> {
    const result = asRecord(
      await this.request('thread/start', {
        approvalPolicy: 'never',
        cwd: resolveChatWorkingDirectory(),
        developerInstructions: codexIdentityInstructions(model, effort),
        ephemeral: false,
        model,
        sandbox: 'read-only',
        serviceName: 'zetro',
        threadSource: 'zetro',
      }),
    )
    return { threadId: readString(asRecord(result.thread), 'id') }
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
    if (method === 'account/login/completed') {
      const loginId = typeof values.loginId === 'string' ? values.loginId : undefined
      if (!loginId) return
      const callback = this.loginCallbacks.get(loginId)
      if (!callback) return
      this.loginCallbacks.delete(loginId)
      callback(values.success === true, typeof values.error === 'string' ? values.error : undefined)
      return
    }
    const threadId = typeof values.threadId === 'string' ? values.threadId : undefined
    if (!threadId) return
    const collector = this.turns.get(threadId)
    if (!collector) return

    if (method === 'item/agentMessage/delta' && typeof values.delta === 'string') {
      collector.content += values.delta
      this.notifyCollector(threadId, collector, { delta: values.delta, type: 'response' })
      return
    }
    if (method === 'item/started' || method === 'item/completed') {
      const item = isRecord(values.item) ? values.item : {}
      if (item.type !== 'agentMessage') {
        this.notifyCollector(threadId, collector, { item, method, type: 'activity' })
      }
      if (item.type === 'agentMessage' && typeof item.text === 'string') {
        collector.content = item.text
      }
      return
    }
    if (method !== 'turn/completed') return

    const turn = isRecord(values.turn) ? values.turn : {}
    if (turn.status === 'interrupted') {
      this.resolveTurn(threadId, { content: collector.content, status: 'stopped' })
      return
    }
    if (turn.status !== 'completed' || !collector.content.trim()) {
      const failure = isRecord(turn.error) ? turn.error : {}
      this.rejectTurn(
        threadId,
        new Error(typeof failure.message === 'string' ? failure.message : 'Codex turn failed.'),
      )
      return
    }
    this.resolveTurn(threadId, { content: collector.content, status: 'complete' })
  }

  private collectTurn(
    threadId: string,
    onEvent: (event: ChatStreamEvent) => void,
    timeoutMilliseconds = responseTimeoutMilliseconds,
  ) {
    return new Promise<ProviderRunResult>((resolve, reject) => {
      const timeout = setTimeout(
        () => this.rejectTurn(threadId, new Error('Codex response timed out.')),
        timeoutMilliseconds,
      )
      this.turns.set(threadId, { content: '', onEvent, reject, resolve, timeout })
    })
  }

  private notifyCollector(
    threadId: string,
    collector: TurnCollector,
    event: ChatStreamEvent,
  ): void {
    try {
      collector.onEvent(event)
    } catch (error) {
      this.rejectTurn(threadId, toError(error))
    }
  }

  private resolveTurn(threadId: string, result: ProviderRunResult) {
    const collector = this.turns.get(threadId)
    if (!collector) return
    clearTimeout(collector.timeout)
    this.turns.delete(threadId)
    collector.resolve(result)
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
    this.conversations.clear()
    this.failPending(error)
  }

  private failPending(error: Error) {
    for (const pending of this.pendingRequests.values()) {
      clearTimeout(pending.timeout)
      pending.reject(error)
    }
    for (const threadId of this.turns.keys()) this.rejectTurn(threadId, error)
    this.pendingRequests.clear()
    for (const callback of this.loginCallbacks.values()) callback(false, error.message)
    this.loginCallbacks.clear()
  }
}

export function codexIdentityInstructions(
  model: string | undefined,
  effort: ProviderReasoningEffort,
) {
  const modelLabel = model ? displayModel(model) : 'the selected model'
  return [
    'You are Codex running through Zetro.',
    `The active runtime configuration is Codex ${modelLabel} with ${effort} reasoning.`,
    `When asked for your identity, model, or reasoning setting, answer: "I am Codex, powered by ${modelLabel} with ${effort} reasoning."`,
    'The reasoning label is configuration metadata. Never reveal private chain-of-thought.',
  ].join(' ')
}

export function displayModel(model: string) {
  return model
    .split('-')
    .map((part) => (part.toLowerCase() === 'gpt' ? 'GPT' : title(part)))
    .join('-')
}

function title(value: string) {
  return /^\d/.test(value) ? value : `${value.charAt(0).toUpperCase()}${value.slice(1)}`
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

function readReasoningEfforts(value: unknown): ProviderReasoningEffort[] {
  if (!Array.isArray(value)) return []
  const efforts = new Set<ProviderReasoningEffort>([
    'none',
    'minimal',
    'low',
    'medium',
    'high',
    'xhigh',
    'max',
    'ultra',
  ])
  return value.flatMap((item) => {
    if (typeof item === 'string' && efforts.has(item as ProviderReasoningEffort))
      return [item as ProviderReasoningEffort]
    if (!isRecord(item)) return []
    const effort = item.reasoningEffort ?? item.effort
    return typeof effort === 'string' && efforts.has(effort as ProviderReasoningEffort)
      ? [effort as ProviderReasoningEffort]
      : []
  })
}
