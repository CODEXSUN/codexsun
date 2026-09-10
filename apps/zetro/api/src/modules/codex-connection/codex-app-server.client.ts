import { spawn, type ChildProcessWithoutNullStreams } from 'node:child_process'
import { createInterface } from 'node:readline'
import { resolve } from 'node:path'
import { mkdir, realpath } from 'node:fs/promises'
import { CodexSandbox, workspaceSandboxPolicy } from './codex-sandbox.js'
import { CodexProbeScript } from './codex-probe-script.js'
import type {
  CodexConnectionStatus,
  CodexDeviceCode,
  CodexToolActivity,
  CodexTurnInput,
  CodexTurnResult,
} from './codex-connection.types.js'
import type { CodexWorktreeService } from './codex-worktree.service.js'
import { resolveCodexCommand } from './codex-command.js'
import { toToolActivity } from './codex-activity.js'
import { deliveryOutputJsonSchema, parseDeliveryOutput } from './codex-delivery.js'
import { createDeveloperInstructions } from './codex-workflow.js'

interface AppServerMessage {
  error?: { message?: string }
  id?: number
  method?: string
  params?: unknown
  result?: unknown
}
interface PendingRequest {
  reject(reason: Error): void
  resolve(value: unknown): void
  timeout: NodeJS.Timeout
}
interface TurnCollector {
  onProgress?: CodexTurnInput['onProgress']
  streamedText: string
  messageId?: string
  activities: CodexToolActivity[]
  content: string
  model: string
  reject(reason: Error): void
  resolve(value: CodexTurnResult): void
  timeout: NodeJS.Timeout
  worktreePath: string
  workflow: CodexTurnInput['workflow']
}

interface ActiveTurn {
  threadId: string
  turnId: string
}

export class CodexAppServerClient {
  public readonly sandbox: CodexSandbox
  private readonly providerDirectory: string
  private readonly probeCommands = new Map<string, { encoded: string; output: string }>()
  private nextRequestId = 1
  private process: ChildProcessWithoutNullStreams | null = null
  private startPromise: Promise<void> | null = null
  private readonly pendingRequests = new Map<number, PendingRequest>()
  private readonly turns = new Map<string, TurnCollector>()
  private readonly activeTurns = new Map<string, ActiveTurn>()
  private readonly pendingInterruptions = new Set<string>()
  private readonly runningTurns = new Set<string>()
  private readonly loginResults = new Map<string, { error?: string; success: boolean }>()
  private readonly deviceCodes = new Map<string, string>()

  public constructor(
    private readonly command: string,
    private readonly projectRoot: string,
    private readonly worktrees: CodexWorktreeService,
    private readonly apiKey?: string,
    private readonly baseUrl?: string,
    private readonly model?: string,
    private readonly turnTimeoutMs = 600_000,
    sandboxRoot = resolve(projectRoot, 'storage/app/private/zetro/sandbox'),
  ) {
    this.providerDirectory = resolve(sandboxRoot, 'provider')
    this.sandbox = new CodexSandbox(
      (method, params, timeout) => this.request(method, params, timeout),
      (cwd, roots, encoded) => this.runSandboxAgentProbe(cwd, roots, encoded),
      sandboxRoot,
    )
  }

  public async setupSandbox() {
    if (this.runningTurns.size) throw new Error('Stop active project turns before sandbox setup.')
    return this.sandbox.setup()
  }

  public verifySandbox(allowLocalNetwork = false) {
    if (this.runningTurns.size)
      throw new Error('Stop active project turns before sandbox verification.')
    return this.sandbox.verify(allowLocalNetwork)
  }

  private async runSandboxAgentProbe(
    cwd: string,
    roots: string[],
    encoded: string,
  ): Promise<string> {
    const result = asRecord(
      await this.request('thread/start', {
        cwd,
        approvalPolicy: 'never',
        sandbox: 'workspace-write',
        ephemeral: true,
        developerInstructions:
          'Run only the exact disposable sandbox probe command supplied by the user. Do not inspect or modify any other file.',
      }),
    )
    const threadId = readString(asRecord(result.thread), 'id')
    const script = await CodexProbeScript.create(cwd, encoded)
    const evidence = { encoded: script.marker, output: '' }
    this.probeCommands.set(threadId, evidence)
    const completion = this.collectTurn(
      threadId,
      cwd,
      'review',
      'sandbox-probe',
      undefined,
      120_000,
    )
    void completion.catch(() => undefined)
    let turnId: string | undefined
    let completed = false
    try {
      const command = script.command(process.execPath)
      const response = asRecord(
        await this.request('turn/start', {
          threadId,
          cwd,
          sandboxPolicy: workspaceSandboxPolicy(roots),
          effort: 'low',
          input: [
            {
              type: 'text',
              text: `Execute this PowerShell command exactly once. It tests disposable files and a network canary, not user data. Do not replace it with other code. Then reply Done.\n${command}`,
            },
          ],
        }),
      )
      turnId = readString(asRecord(response.turn), 'id')
      await completion
      completed = true
      return (await script.unchanged()) ? evidence.output : ''
    } finally {
      this.probeCommands.delete(threadId)
      this.rejectTurn(threadId, new Error('Sandbox probe finished.'))
      if (!completed && turnId && this.process)
        await this.request('turn/interrupt', { threadId, turnId }).catch(() => undefined)
    }
  }

  public async readAccount(refreshToken = false): Promise<CodexConnectionStatus> {
    const result = asRecord(await this.request('account/read', { refreshToken }))
    const account = result.account

    if (!isRecord(account)) {
      return { mode: 'none', state: 'disconnected' }
    }

    if (account.type === 'chatgpt') {
      return {
        email: typeof account.email === 'string' ? account.email : undefined,
        mode: 'chatgpt',
        planType: typeof account.planType === 'string' ? account.planType : undefined,
        state: 'connected',
      }
    }

    if (account.type === 'apiKey') {
      return { mode: 'api_key', state: 'connected' }
    }

    return { mode: 'none', state: 'disconnected' }
  }

  public async startDeviceLogin(): Promise<CodexDeviceCode> {
    await this.cancelPendingLogins()
    const result = asRecord(
      await this.request('account/login/start', { type: 'chatgptDeviceCode' }, 30_000),
    )
    const deviceCode = {
      loginId: readString(result, 'loginId'),
      userCode: readString(result, 'userCode'),
      verificationUrl: readString(result, 'verificationUrl'),
    }
    this.loginResults.delete(deviceCode.loginId)
    this.deviceCodes.set(deviceCode.loginId, deviceCode.userCode)
    return deviceCode
  }

  public async logout(): Promise<CodexConnectionStatus> {
    await this.request('account/logout', undefined)
    this.deviceCodes.clear()
    this.loginResults.clear()
    return { mode: 'none', state: 'disconnected' }
  }

  public async confirmLogin(loginId: string, userCode: string): Promise<CodexConnectionStatus> {
    const expectedCode = this.deviceCodes.get(loginId)

    if (!expectedCode || normalizeCode(expectedCode) !== normalizeCode(userCode)) {
      return {
        message: 'The pasted code does not match the active device code.',
        mode: 'none',
        state: 'error',
      }
    }

    return this.readLogin(loginId)
  }

  public async readLogin(loginId: string): Promise<CodexConnectionStatus> {
    const loginResult = this.loginResults.get(loginId)

    if (loginResult?.success) {
      this.deviceCodes.delete(loginId)
      this.loginResults.delete(loginId)
      return this.readAccount(true)
    }
    if (loginResult?.error) {
      this.deviceCodes.delete(loginId)
      this.loginResults.delete(loginId)
      return { message: loginResult.error, mode: 'none', state: 'error' }
    }

    return { mode: 'none', state: 'pending' }
  }

  public async runTurn(input: CodexTurnInput): Promise<CodexTurnResult> {
    this.sandbox.assertReady()
    this.runningTurns.add(input.conversationId)
    return this.executeTurn(input).finally(() => {
      this.runningTurns.delete(input.conversationId)
      this.pendingInterruptions.delete(input.conversationId)
    })
  }

  private async executeTurn(input: CodexTurnInput): Promise<CodexTurnResult> {
    const turnConfiguration = resolveCodexTurnConfiguration(input, this.model)
    const worktree = await this.worktrees.ensure(
      input.conversationId,
      input.projectRoot,
      input.projectId,
    )
    const filePaths = await this.worktrees.writeInputs(
      input.conversationId,
      input.files,
      input.projectId,
    )
    const isReadOnly = input.workflow === 'plan' || input.workflow === 'review'
    const resolveScope = (path: string) =>
      isReadOnly
        ? this.worktrees.resolveWorkingDirectory(worktree.path, path)
        : this.worktrees.prepareWorkingDirectory(worktree.path, path, input.projectRoot)
    const workingDirectory = await resolveScope(input.scope.folderPath)
    const writableRoots = isReadOnly ? [] : [workingDirectory]
    for (const path of input.scope.documentationPaths ?? []) {
      if (!/^assist\/[a-zA-Z0-9_-]+(?:\/[a-zA-Z0-9_-]+)*$/.test(path)) {
        throw new Error('Choose explicit documentation directories below assist.')
      }
      const documentationRoot = await resolveScope(path)
      if (!isReadOnly) writableRoots.push(documentationRoot)
    }
    const threadResult = asRecord(
      await this.request('thread/start', {
        approvalPolicy: 'never',
        cwd: workingDirectory,
        developerInstructions: createDeveloperInstructions(
          worktree.path,
          input.workflow,
          input.scope,
        ),
        ephemeral: true,
        model: turnConfiguration.model,
        sandbox: isReadOnly ? 'read-only' : 'workspace-write',
        serviceName: 'zetro',
        threadSource: 'zetro',
      }),
    )
    const thread = asRecord(threadResult.thread)
    const threadId = readString(thread, 'id')
    const completion = this.collectTurn(
      threadId,
      worktree.path,
      input.workflow,
      readString(threadResult, 'model'),
      input.onProgress,
    )
    let activeTurn: ActiveTurn | undefined
    try {
      const turnResult = asRecord(
        await this.request('turn/start', {
          cwd: workingDirectory,
          sandboxPolicy: isReadOnly ? undefined : workspaceSandboxPolicy(writableRoots),
          input: [
            { text: addFilePaths(input.text, filePaths), type: 'text' },
            ...input.images.map((url) => ({ type: 'image', url })),
          ],
          effort: turnConfiguration.effort,
          outputSchema: input.workflow === 'deliver' ? deliveryOutputJsonSchema : undefined,
          threadId,
        }),
      )
      const turn = asRecord(turnResult.turn)
      activeTurn = { threadId, turnId: readString(turn, 'id') }
      this.activeTurns.set(input.conversationId, activeTurn)
      if (this.pendingInterruptions.delete(input.conversationId)) {
        await this.interruptActiveTurn(activeTurn)
      }
      return await completion
    } catch (error) {
      this.rejectTurn(threadId, toError(error))
      throw error
    } finally {
      if (this.activeTurns.get(input.conversationId) === activeTurn) {
        this.activeTurns.delete(input.conversationId)
      }
    }
  }

  public async interruptTurn(conversationId: string): Promise<boolean> {
    const activeTurn = this.activeTurns.get(conversationId)
    if (!activeTurn) {
      if (!this.runningTurns.has(conversationId)) return false
      this.pendingInterruptions.add(conversationId)
      return true
    }
    await this.interruptActiveTurn(activeTurn)
    return true
  }

  public async close(): Promise<void> {
    this.sandbox.invalidate()
    const child = this.process
    if (child) {
      this.handleProcessFailure(child, new Error('Codex App Server closed.'))
      child.kill()
    }
    this.process = null
    this.startPromise = null
  }

  private async request(method: string, params?: unknown, timeoutMs = 15_000): Promise<unknown> {
    await this.start()
    const requestId = this.nextRequestId++

    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        this.pendingRequests.delete(requestId)
        reject(new Error(`Codex App Server timed out while handling ${method}.`))
      }, timeoutMs)
      this.pendingRequests.set(requestId, { reject, resolve, timeout })
      this.write(
        params === undefined ? { id: requestId, method } : { id: requestId, method, params },
      )
    })
  }

  private async cancelPendingLogins(): Promise<void> {
    const loginIds = [...this.deviceCodes.keys()]
    this.deviceCodes.clear()
    this.loginResults.clear()
    await Promise.allSettled(
      loginIds.map((loginId) => this.request('account/login/cancel', { loginId })),
    )
  }

  private async start(): Promise<void> {
    if (this.startPromise) return this.startPromise
    if (this.process) return

    const startPromise = this.initialize()
    this.startPromise = startPromise
    try {
      await startPromise
    } finally {
      if (this.startPromise === startPromise) this.startPromise = null
    }
  }

  private async initialize(): Promise<void> {
    const command = await resolveCodexCommand(this.command)
    await mkdir(this.providerDirectory, { recursive: true })
    const environment = { ...process.env }
    delete environment.ZETRO_SUPERVISOR_TOKEN
    delete environment.ZETRO_DESKTOP_SESSION_TOKEN
    delete environment.ZETRO_CONNECTED_APP_TOKEN
    delete environment.CODEX_PERMISSION_PROFILE
    delete environment.CODEX_CI
    delete environment.CODEX_APP_TOOLS_PIPE_PATH
    delete environment.CODEX_INTERNAL_ORIGINATOR_OVERRIDE
    delete environment.CODEX_SESSION_ID
    delete environment.CODEX_THREAD_ID
    const child = spawn(
      command,
      [
        'app-server',
        '--stdio',
        '-c',
        'sandbox_mode="workspace-write"',
        '-c',
        'windows.sandbox="elevated"',
      ],
      {
        cwd: await realpath(this.providerDirectory),
        env: this.apiKey
          ? {
              ...environment,
              OPENAI_API_KEY: this.apiKey,
              OPENAI_BASE_URL: this.baseUrl,
            }
          : environment,
        stdio: ['pipe', 'pipe', 'pipe'],
        windowsHide: true,
      },
    )
    this.process = child
    child.on('error', (error) => this.handleProcessFailure(child, toLaunchError(command, error)))
    child.once('exit', () =>
      this.handleProcessFailure(child, new Error('Codex App Server stopped unexpectedly.')),
    )

    await waitForSpawn(child, command)
    createInterface({ input: child.stdout }).on('line', (line) => this.handleLine(line))
    child.stderr.resume()

    await this.requestWithoutStart('initialize', {
      clientInfo: { name: 'zetro', title: 'Zetro', version: '0.1.0' },
    })
    this.write({ method: 'initialized', params: {} })
  }

  private requestWithoutStart(method: string, params: unknown): Promise<unknown> {
    const requestId = this.nextRequestId++
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(
        () => reject(new Error('Codex App Server did not initialize.')),
        15_000,
      )
      this.pendingRequests.set(requestId, { reject, resolve, timeout })
      this.write({ id: requestId, method, params })
    })
  }

  private write(message: object): void {
    if (!this.process?.stdin.writable) throw new Error('Codex App Server is unavailable.')
    this.process.stdin.write(`${JSON.stringify(message)}\n`)
  }

  private handleLine(line: string): void {
    let message: AppServerMessage
    try {
      message = JSON.parse(line) as AppServerMessage
    } catch {
      return
    }

    if (typeof message.id === 'number') this.handleResponse(message)
    if (message.method) this.handleNotification(message.method, message.params)
  }

  private handleResponse(message: AppServerMessage): void {
    const pending = this.pendingRequests.get(message.id!)
    if (!pending) return
    clearTimeout(pending.timeout)
    this.pendingRequests.delete(message.id!)
    if (message.error) pending.reject(new Error(message.error.message ?? 'Codex request failed.'))
    else pending.resolve(message.result)
  }

  private handleNotification(method: string, params: unknown): void {
    this.sandbox.notification(method, params)
    const values = isRecord(params) ? params : {}

    if (method === 'account/login/completed') {
      const loginId = typeof values.loginId === 'string' ? values.loginId : undefined
      if (loginId) {
        this.loginResults.set(loginId, {
          error: typeof values.error === 'string' ? values.error : undefined,
          success: values.success === true,
        })
      }
    }

    const threadId = typeof values.threadId === 'string' ? values.threadId : undefined
    if (!threadId || !this.turns.has(threadId)) return
    const collector = this.turns.get(threadId)!
    if (method === 'item/agentMessage/delta' && typeof values.delta === 'string') {
      const id = typeof values.itemId === 'string' ? values.itemId : ''
      if (collector.messageId !== id) collector.streamedText = ''
      collector.messageId = id
      collector.streamedText = `${collector.streamedText}${values.delta}`.slice(-8000)
      collector.onProgress?.({ kind: 'response', text: collector.streamedText, itemId: id })
    }

    if (method === 'item/started' || method === 'item/completed') {
      const item = isRecord(values.item) ? values.item : {}
      const activity = toToolActivity(item)
      if (activity && typeof item.id === 'string') {
        const status = method === 'item/started' ? 'running' : activity.status
        collector.onProgress?.({
          kind: 'tool',
          itemId: item.id,
          activity: { ...activity, status },
        })
      }
    }

    if (method === 'item/completed') {
      const item = isRecord(values.item) ? values.item : {}
      const probe = this.probeCommands.get(threadId)
      if (
        probe &&
        item.type === 'commandExecution' &&
        item.status === 'completed' &&
        typeof item.command === 'string' &&
        item.command.includes(probe.encoded) &&
        typeof item.aggregatedOutput === 'string'
      )
        probe.output = item.aggregatedOutput
      if (item.type === 'agentMessage' && typeof item.text === 'string') {
        collector.content = item.text
        const text = item.text.slice(-8000)
        const itemId = typeof item.id === 'string' ? item.id : undefined
        collector.onProgress?.({ kind: 'response', text, itemId })
      }
      const activity = toToolActivity(item)
      if (activity) this.turns.get(threadId)!.activities.push(activity)
    }

    if (method === 'turn/completed') this.completeTurn(threadId, values)
  }

  private collectTurn(
    threadId: string,
    worktreePath: string,
    workflow: CodexTurnInput['workflow'],
    model: string,
    onProgress?: CodexTurnInput['onProgress'],
    timeoutMs = this.turnTimeoutMs,
  ): Promise<CodexTurnResult> {
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => void this.expireTurn(threadId), timeoutMs)
      this.turns.set(threadId, {
        activities: [],
        onProgress,
        streamedText: '',
        content: '',
        model,
        reject,
        resolve,
        timeout,
        worktreePath,
        workflow,
      })
    })
  }

  private completeTurn(threadId: string, params: Record<string, unknown>): void {
    const collector = this.turns.get(threadId)
    if (!collector) return
    const turn = isRecord(params.turn) ? params.turn : {}
    const error = isRecord(turn.error) ? turn.error : {}

    if (turn.status !== 'completed' || !collector.content.trim()) {
      this.rejectTurn(
        threadId,
        new Error(readOptionalString(error, 'message') ?? 'Codex turn failed.'),
      )
      return
    }

    let output: ReturnType<typeof readTurnOutput>
    try {
      output = readTurnOutput(collector.content, collector.workflow)
    } catch (error) {
      this.rejectTurn(threadId, toError(error))
      return
    }

    clearTimeout(collector.timeout)
    this.turns.delete(threadId)
    collector.resolve({
      activities: [...collector.activities]
        .sort((left, right) => Number(right.status === 'failed') - Number(left.status === 'failed'))
        .slice(0, 20),
      content: output.content,
      delivery: output.delivery,
      model: collector.model,
      threadId,
      worktreePath: collector.worktreePath,
      workflow: collector.workflow,
    })
  }

  private rejectTurn(threadId: string, error: Error): void {
    const collector = this.turns.get(threadId)
    if (!collector) return
    clearTimeout(collector.timeout)
    this.turns.delete(threadId)
    collector.reject(error)
  }

  private async interruptActiveTurn(activeTurn: ActiveTurn): Promise<void> {
    await this.request('turn/interrupt', activeTurn)
    this.rejectTurn(activeTurn.threadId, new Error('Codex turn stopped.'))
  }

  private async expireTurn(threadId: string): Promise<void> {
    const turn = [...this.activeTurns.values()].find((active) => active.threadId === threadId)
    try {
      if (!turn) throw new Error('The timed-out turn has no active identifier.')
      await this.request('turn/interrupt', turn)
    } catch {
      await this.close()
    } finally {
      this.rejectTurn(
        threadId,
        new Error('Codex turn timed out. Review its worktree before resubmitting.'),
      )
    }
  }

  private handleProcessFailure(child: ChildProcessWithoutNullStreams, error: Error): void {
    if (this.process !== child) return
    this.sandbox.invalidate()
    for (const pending of this.pendingRequests.values()) {
      clearTimeout(pending.timeout)
      pending.reject(error)
    }
    for (const threadId of this.turns.keys()) this.rejectTurn(threadId, error)
    this.activeTurns.clear()
    this.pendingInterruptions.clear()
    this.runningTurns.clear()
    this.pendingRequests.clear()
    this.process = null
  }
}

export function resolveCodexTurnConfiguration(
  input: Pick<CodexTurnInput, 'model' | 'reasoningEffort'>,
  defaultModel?: string,
): { effort: CodexTurnInput['reasoningEffort']; model?: string } {
  return { effort: input.reasoningEffort, model: input.model ?? defaultModel }
}

function waitForSpawn(child: ChildProcessWithoutNullStreams, command: string): Promise<void> {
  return new Promise((resolve, reject) => {
    child.once('spawn', resolve)
    child.once('error', (error) => reject(toLaunchError(command, error)))
  })
}

function toLaunchError(command: string, error: Error): Error {
  const detail = error.message ? ` ${error.message}` : ''
  return new Error(
    `Codex executable "${command}" could not start.${detail} Set ZETRO_CODEX_COMMAND to its full path if Codex is installed.`,
  )
}

function readTurnOutput(
  content: string,
  workflow: CodexTurnInput['workflow'],
): { content: string; delivery?: CodexTurnResult['delivery'] } {
  return workflow === 'deliver' ? parseDeliveryOutput(content) : { content: content.trim() }
}

function asRecord(value: unknown): Record<string, unknown> {
  if (!isRecord(value)) throw new Error('Codex returned an invalid response.')
  return value
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function readString(record: Record<string, unknown>, key: string): string {
  const value = record[key]
  if (typeof value !== 'string' || !value) throw new Error(`Codex did not return ${key}.`)
  return value
}

function readOptionalString(record: Record<string, unknown>, key: string): string | undefined {
  return typeof record[key] === 'string' ? record[key] : undefined
}

function toError(error: unknown): Error {
  return error instanceof Error ? error : new Error('Codex request failed.')
}

function normalizeCode(value: string): string {
  return value.replace(/\s/g, '').toUpperCase()
}

function addFilePaths(text: string, filePaths: readonly string[]): string {
  if (filePaths.length === 0) return text
  return `${text}\n\nUser file inputs:\n${filePaths.map((path) => `- ${path}`).join('\n')}`
}
