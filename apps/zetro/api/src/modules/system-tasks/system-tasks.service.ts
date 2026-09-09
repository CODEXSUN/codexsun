import { randomUUID } from 'node:crypto'
import type { SystemTaskQueue } from './system-tasks.queue.js'
import type { SystemTaskRepository } from './system-tasks.repository.js'
import type {
  SystemTaskContext,
  SystemTaskHandler,
  SystemTaskRecord,
  SystemTaskStatus,
} from './system-tasks.types.js'

export class SystemTaskNotFoundError extends Error {}
export class SystemTaskPolicyError extends Error {}

export class SystemTaskService {
  private readonly handlers = new Map<string, SystemTaskHandler>()
  private readonly running = new Map<string, AbortController>()
  private recoveredTaskIds: string[] = []

  public constructor(
    private readonly repository: SystemTaskRepository,
    private readonly queue: SystemTaskQueue,
  ) {}

  public register(type: string, handler: SystemTaskHandler): void {
    if (this.handlers.has(type))
      throw new Error(`System task handler ${type} is already registered.`)
    this.handlers.set(type, handler)
  }

  public async initialize(): Promise<void> {
    await this.repository.initialize()
    const recovered = await this.repository.recoverInterrupted()
    this.recoveredTaskIds = recovered.map(({ id }) => id)
  }

  public async start(): Promise<void> {
    await this.queue.start((taskId) => this.execute(taskId))
    const pending = (await this.repository.list()).filter(({ status }) => status === 'pending')
    const taskIds = new Set([...this.recoveredTaskIds, ...pending.map(({ id }) => id)])
    for (const taskId of taskIds) await this.queue.enqueue(taskId)
    this.recoveredTaskIds = []
  }

  public list(projectId?: string) {
    return this.repository.list(projectId)
  }

  public async get(taskId: string) {
    const task = await this.repository.get(taskId)
    if (!task) throw new SystemTaskNotFoundError('System task not found.')
    return task
  }

  public async enqueue(input: {
    input: unknown
    maxAttempts?: number
    projectId?: string
    title: string
    type: string
  }): Promise<SystemTaskRecord> {
    if (!this.handlers.has(input.type)) {
      throw new SystemTaskPolicyError(`No system task handler owns ${input.type}.`)
    }
    const now = new Date().toISOString()
    const task: SystemTaskRecord = {
      attempts: 0,
      completedAt: null,
      createdAt: now,
      error: null,
      id: randomUUID(),
      input: input.input,
      maxAttempts: input.maxAttempts ?? 1,
      projectId: input.projectId ?? null,
      recoveryCount: 0,
      result: null,
      startedAt: null,
      status: 'pending',
      title: input.title,
      type: input.type,
      updatedAt: now,
    }
    await this.repository.insert(task)
    await this.queue.enqueue(task.id)
    return task
  }

  public async stop(taskId: string): Promise<SystemTaskRecord> {
    const task = await this.get(taskId)
    if (!['pending', 'running'].includes(task.status)) return task
    task.status = task.status === 'pending' ? 'stopped' : 'stopping'
    task.updatedAt = new Date().toISOString()
    await this.repository.save(task)
    this.running.get(taskId)?.abort()
    return task
  }

  public async retry(taskId: string): Promise<SystemTaskRecord> {
    const task = await this.get(taskId)
    if (!['blocked', 'failed', 'stopped'].includes(task.status)) {
      throw new SystemTaskPolicyError('Only blocked, failed, or stopped tasks can retry.')
    }
    task.status = 'pending'
    task.error = null
    task.completedAt = null
    task.updatedAt = new Date().toISOString()
    await this.repository.save(task)
    await this.queue.enqueue(task.id)
    return task
  }

  public async close(): Promise<void> {
    for (const controller of this.running.values()) controller.abort()
    await this.queue.close()
  }

  private async execute(taskId: string): Promise<void> {
    if (!(await this.repository.claim(taskId))) return
    const task = await this.get(taskId)
    const handler = this.handlers.get(task.type)
    if (!handler) {
      await this.finish(task, 'blocked', `No handler is registered for ${task.type}.`)
      return
    }

    const controller = new AbortController()
    this.running.set(taskId, controller)
    task.attempts += 1
    task.startedAt ??= new Date().toISOString()
    task.status = 'running'
    task.updatedAt = new Date().toISOString()
    await this.repository.save(task)

    try {
      task.result = await handler(task.input, this.context(task.id, controller.signal))
      await this.finish(task, controller.signal.aborted ? 'stopped' : 'completed', null)
    } catch (error) {
      const message = toMessage(error)
      const retry = !controller.signal.aborted && task.attempts < task.maxAttempts
      await this.finish(
        task,
        controller.signal.aborted ? 'stopped' : retry ? 'pending' : 'failed',
        message,
      )
      if (retry) await this.queue.enqueue(task.id)
    } finally {
      this.running.delete(taskId)
    }
  }

  private context(taskId: string, signal: AbortSignal): SystemTaskContext {
    return {
      signal,
      step: async (status, message) => {
        await this.repository.appendStep({
          completedAt: new Date().toISOString(),
          id: randomUUID(),
          message,
          status,
          taskId,
        })
      },
    }
  }

  private async finish(
    task: SystemTaskRecord,
    status: SystemTaskStatus,
    error: string | null,
  ): Promise<void> {
    const now = new Date().toISOString()
    task.completedAt = ['pending', 'running', 'stopping'].includes(status) ? null : now
    task.error = error
    task.status = status
    task.updatedAt = now
    await this.repository.save(task)
  }
}

function toMessage(error: unknown): string {
  return error instanceof Error ? error.message : 'The system task failed.'
}
