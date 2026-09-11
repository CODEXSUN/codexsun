import { spawn, type ChildProcessWithoutNullStreams } from 'node:child_process'
import { mkdirSync } from 'node:fs'
import { createInterface } from 'node:readline'
import type {
  ChatStreamEvent,
  ProviderDeviceLoginResponse,
  ProviderModel,
  ProviderReasoningEffort,
} from '@codexsun/zetro-contracts'

type RpcMessage = {
  error?: { message?: string }
  id?: number
  method?: string
  params?: unknown
  result?: unknown
}
type Pending = { reject(error: Error): void; resolve(value: unknown): void; timer: NodeJS.Timeout }
type Collector = {
  content: string
  onEvent(event: ChatStreamEvent): void
  reject(error: Error): void
  resolve(value: { content: string; status: 'complete' | 'stopped' }): void
  timer: NodeJS.Timeout
}
type Session = { activeTurn?: Promise<string>; threadId: string }

export class CxzCodexRuntime {
  private process: ChildProcessWithoutNullStreams | undefined
  private starting?: Promise<void>
  private nextId = 1
  private readonly pending = new Map<number, Pending>()
  private readonly sessions = new Map<string, Promise<Session>>()
  private readonly collectors = new Map<string, Collector>()
  private readonly logins = new Map<string, (success: boolean) => void>()

  async run(input: {
    conversationId: string
    effort: ProviderReasoningEffort
    model?: string
    onEvent(event: ChatStreamEvent): void
    onThread(threadId: string): void
    prompt: string
    threadId?: string
  }) {
    const session = await this.session(input)
    if (session.activeTurn) throw new Error('This CXZ conversation is already responding.')
    const completion = this.collect(session.threadId, input.onEvent)
    const activeTurn = this.request('turn/start', {
      cwd: '/tmp',
      effort: input.effort,
      input: [{ text: input.prompt, type: 'text' }],
      model: input.model,
      threadId: session.threadId,
    }).then((result) => readString(record(record(result).turn), 'id'))
    session.activeTurn = activeTurn
    try {
      await activeTurn
      return await completion
    } catch (error) {
      this.rejectCollector(session.threadId, asError(error))
      await completion.catch(() => undefined)
      throw error
    } finally {
      session.activeTurn = undefined
    }
  }

  async stop(conversationId: string) {
    const session = await this.sessions.get(conversationId)
    if (!session?.activeTurn) throw new Error('CXZ has no active response for this conversation.')
    await this.request('turn/interrupt', {
      threadId: session.threadId,
      turnId: await session.activeTurn,
    })
  }

  async account() {
    const result = record(await this.request('account/read', { refreshToken: false }))
    const account = isRecord(result.account) ? result.account : undefined
    if (!account) return { authenticated: false }
    const email = typeof account.email === 'string' ? account.email : undefined
    const plan = typeof account.planType === 'string' ? account.planType : undefined
    return { authenticated: true, label: [email ?? 'Codex', plan].filter(Boolean).join(' · ') }
  }

  async models(): Promise<ProviderModel[]> {
    const models: ProviderModel[] = []
    let cursor: string | undefined
    do {
      const result = record(
        await this.request('model/list', {
          cursor: cursor ?? null,
          includeHidden: false,
          limit: 100,
        }),
      )
      for (const value of Array.isArray(result.data) ? result.data : []) {
        const model = record(value)
        const id = readString(model, 'model')
        models.push({
          description: typeof model.description === 'string' ? model.description : '',
          displayName: typeof model.displayName === 'string' ? model.displayName : id,
          id,
          isDefault: model.isDefault === true,
          supportedReasoningEfforts: reasoningEfforts(model.supportedReasoningEfforts),
        })
      }
      cursor = typeof result.nextCursor === 'string' ? result.nextCursor : undefined
    } while (cursor)
    return models
  }

  async deviceLogin(): Promise<ProviderDeviceLoginResponse> {
    const result = record(await this.request('account/login/start', { type: 'chatgptDeviceCode' }))
    const response = {
      loginId: readString(result, 'loginId'),
      userCode: readString(result, 'userCode'),
      verificationUrl: readString(result, 'verificationUrl'),
    }
    this.logins.set(response.loginId, () => undefined)
    return response
  }

  async smoke(model: string, effort: ProviderReasoningEffort) {
    const startedAt = Date.now()
    const result = record(
      await this.request('thread/start', {
        approvalPolicy: 'never',
        cwd: '/tmp',
        developerInstructions: 'This is a connection smoke test. Reply exactly ZETRO_SMOKE_OK.',
        ephemeral: true,
        model,
        sandbox: 'read-only',
        serviceName: 'cxz-smoke',
        threadSource: 'zetro',
      }),
    )
    const threadId = readString(record(result.thread), 'id')
    const completion = this.collect(threadId, () => undefined, 30_000)
    try {
      await this.request('turn/start', {
        cwd: '/tmp',
        effort,
        input: [{ text: 'Reply exactly ZETRO_SMOKE_OK.', type: 'text' }],
        model,
        threadId,
      })
      const response = (await completion).content.trim()
      if (response !== 'ZETRO_SMOKE_OK')
        throw new Error('CXZ Codex returned an invalid smoke response.')
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

  async close() {
    const child = this.process
    this.process = undefined
    this.sessions.clear()
    this.fail(new Error('CXZ Codex runtime stopped.'))
    child?.kill('SIGTERM')
  }

  private session(input: {
    conversationId: string
    effort: ProviderReasoningEffort
    model?: string
    onEvent(event: ChatStreamEvent): void
    onThread(threadId: string): void
    threadId?: string
  }) {
    const existing = this.sessions.get(input.conversationId)
    if (existing) return existing
    const created = this.startOrResume(
      input.threadId,
      input.model,
      input.effort,
      input.onEvent,
    ).then((session) => {
      input.onThread(session.threadId)
      return session
    })
    this.sessions.set(input.conversationId, created)
    return created
  }

  private async startOrResume(
    threadId: string | undefined,
    model: string | undefined,
    effort: ProviderReasoningEffort,
    onEvent: (event: ChatStreamEvent) => void,
  ): Promise<Session> {
    if (!threadId) return this.startThread(model, effort)
    try {
      const result = record(
        await this.request('thread/resume', {
          approvalPolicy: 'never',
          cwd: '/tmp',
          developerInstructions: cxzDeveloperInstructions(model, effort),
          excludeTurns: true,
          model,
          sandbox: 'read-only',
          threadId,
        }),
      )
      return { threadId: readString(record(result.thread), 'id') }
    } catch (error) {
      onEvent({
        item: { message: asError(error).message, status: 'new-context' },
        method: 'thread/recovery',
        type: 'activity',
      })
      return this.startThread(model, effort)
    }
  }

  private async startThread(
    model: string | undefined,
    effort: ProviderReasoningEffort,
  ): Promise<Session> {
    const result = record(
      await this.request('thread/start', {
        approvalPolicy: 'never',
        cwd: '/tmp',
        developerInstructions: cxzDeveloperInstructions(model, effort),
        ephemeral: false,
        model,
        sandbox: 'read-only',
        serviceName: 'cxz',
        threadSource: 'zetro',
      }),
    )
    return { threadId: readString(record(result.thread), 'id') }
  }

  private async request(method: string, params: unknown, timeoutMs = 15_000) {
    await this.start()
    return this.requestRaw(method, params, timeoutMs)
  }

  private requestRaw(method: string, params: unknown, timeoutMs = 15_000) {
    const id = this.nextId++
    return new Promise<unknown>((resolve, reject) => {
      const timer = setTimeout(() => {
        this.pending.delete(id)
        reject(new Error(`CXZ Codex timed out while handling ${method}.`))
      }, timeoutMs)
      this.pending.set(id, { reject, resolve, timer })
      this.write({ id, method, params })
    })
  }

  private async start() {
    if (this.process) return
    this.starting ??= this.initialize()
    try {
      await this.starting
    } finally {
      this.starting = undefined
    }
  }

  private async initialize() {
    if (process.env.CODEX_HOME) mkdirSync(process.env.CODEX_HOME, { recursive: true })
    const child = spawn('codex', ['app-server', '--stdio'], {
      cwd: '/tmp',
      env: process.env,
      stdio: ['pipe', 'pipe', 'pipe'],
    })
    this.process = child
    child.stderr.resume()
    child.once('error', (error) => this.fail(error))
    child.once('exit', () => this.fail(new Error('CXZ Codex stopped unexpectedly.')))
    createInterface({ input: child.stdout }).on('line', (line) => this.handleLine(line))
    await new Promise<void>((resolve, reject) => {
      child.once('spawn', resolve)
      child.once('error', reject)
    })
    await this.requestRaw('initialize', {
      clientInfo: { name: 'cxz', title: 'CXZ', version: '2.0.0' },
    })
    this.write({ method: 'initialized', params: {} })
  }

  private write(message: object) {
    if (!this.process?.stdin.writable) throw new Error('CXZ Codex is unavailable.')
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
    const pending = this.pending.get(message.id!)
    if (!pending) return
    clearTimeout(pending.timer)
    this.pending.delete(message.id!)
    if (message.error)
      pending.reject(new Error(message.error.message ?? 'CXZ Codex request failed.'))
    else pending.resolve(message.result)
  }

  private handleNotification(method: string, params: unknown) {
    const values = isRecord(params) ? params : {}
    if (method === 'account/login/completed') {
      const loginId = typeof values.loginId === 'string' ? values.loginId : undefined
      if (loginId) this.logins.delete(loginId)
      return
    }
    const threadId = typeof values.threadId === 'string' ? values.threadId : undefined
    const collector = threadId ? this.collectors.get(threadId) : undefined
    if (!threadId || !collector) return
    if (method === 'item/agentMessage/delta' && typeof values.delta === 'string') {
      collector.content += values.delta
      collector.onEvent({ delta: values.delta, type: 'response' })
      return
    }
    if (method === 'item/started' || method === 'item/completed') {
      const item = isRecord(values.item) ? values.item : {}
      if (item.type !== 'agentMessage') collector.onEvent({ item, method, type: 'activity' })
      if (item.type === 'agentMessage' && typeof item.text === 'string')
        collector.content = item.text
      return
    }
    if (method !== 'turn/completed') return
    const turn = isRecord(values.turn) ? values.turn : {}
    if (turn.status === 'interrupted') return this.resolveCollector(threadId, 'stopped')
    if (turn.status === 'completed' && collector.content.trim()) {
      return this.resolveCollector(threadId, 'complete')
    }
    this.rejectCollector(threadId, new Error('CXZ Codex turn failed.'))
  }

  private collect(
    threadId: string,
    onEvent: (event: ChatStreamEvent) => void,
    timeoutMs = 5 * 60 * 1000,
  ) {
    return new Promise<{ content: string; status: 'complete' | 'stopped' }>((resolve, reject) => {
      const timer = setTimeout(
        () => this.rejectCollector(threadId, new Error('CXZ Codex response timed out.')),
        timeoutMs,
      )
      this.collectors.set(threadId, { content: '', onEvent, reject, resolve, timer })
    })
  }

  private resolveCollector(threadId: string, status: 'complete' | 'stopped') {
    const collector = this.collectors.get(threadId)
    if (!collector) return
    clearTimeout(collector.timer)
    this.collectors.delete(threadId)
    collector.resolve({ content: collector.content, status })
  }

  private rejectCollector(threadId: string, error: Error) {
    const collector = this.collectors.get(threadId)
    if (!collector) return
    clearTimeout(collector.timer)
    this.collectors.delete(threadId)
    collector.reject(error)
  }

  private fail(error: Error) {
    this.process = undefined
    for (const pending of this.pending.values()) {
      clearTimeout(pending.timer)
      pending.reject(error)
    }
    this.pending.clear()
    for (const threadId of this.collectors.keys()) this.rejectCollector(threadId, error)
  }
}

export function cxzDeveloperInstructions(
  model: string | undefined,
  effort: ProviderReasoningEffort,
) {
  const modelLabel = model ? displayModel(model) : 'the selected model'
  return [
    'You are CXZ, the isolated Codex runtime for Zetro.',
    `The active runtime configuration is Codex ${modelLabel} with ${effort} reasoning.`,
    `When asked for your identity, model, or reasoning setting, answer: "I am CXZ, powered by Codex ${modelLabel} with ${effort} reasoning."`,
    'The reasoning label is configuration metadata. Never reveal private chain-of-thought.',
  ].join(' ')
}

function displayModel(model: string) {
  return model
    .split('-')
    .map((part) => (part.toLowerCase() === 'gpt' ? 'GPT' : title(part)))
    .join('-')
}

function title(value: string) {
  return /^\d/.test(value) ? value : `${value.charAt(0).toUpperCase()}${value.slice(1)}`
}

function record(value: unknown): Record<string, unknown> {
  if (!isRecord(value)) throw new Error('CXZ Codex returned an invalid response.')
  return value
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function readString(value: Record<string, unknown>, key: string) {
  const result = value[key]
  if (typeof result !== 'string' || !result) throw new Error(`CXZ Codex did not return ${key}.`)
  return result
}

function asError(error: unknown) {
  return error instanceof Error ? error : new Error('CXZ Codex request failed.')
}

function reasoningEfforts(value: unknown): ProviderReasoningEffort[] {
  const allowed = new Set(['none', 'minimal', 'low', 'medium', 'high', 'xhigh', 'max', 'ultra'])
  if (!Array.isArray(value)) return []
  return value.flatMap((item) => {
    const effort =
      typeof item === 'string'
        ? item
        : isRecord(item)
          ? (item.reasoningEffort ?? item.effort)
          : undefined
    return typeof effort === 'string' && allowed.has(effort)
      ? [effort as ProviderReasoningEffort]
      : []
  })
}
