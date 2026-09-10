import { Queue, Worker, type ConnectionOptions } from 'bullmq'

export interface SystemTaskQueue {
  close(): Promise<void>
  enqueue(taskId: string): Promise<void>
  start(run: (taskId: string) => Promise<void>): Promise<void>
}

export class LocalSystemTaskQueue implements SystemTaskQueue {
  private handler: ((taskId: string) => Promise<void>) | null = null
  private readonly pending: string[] = []
  private running = false
  private drained: Promise<void> = Promise.resolve()

  public async start(run: (taskId: string) => Promise<void>): Promise<void> {
    this.handler = run
    this.schedule()
  }

  public async enqueue(taskId: string): Promise<void> {
    if (!this.pending.includes(taskId)) this.pending.push(taskId)
    this.schedule()
  }

  public async close(): Promise<void> {
    this.handler = null
    this.pending.length = 0
    await this.drained
  }

  private schedule(): void {
    if (this.running || !this.handler || this.pending.length === 0) return
    this.running = true
    this.drained = new Promise<void>((resolve, reject) => {
      setImmediate(() => {
        void this.drain().then(resolve, reject)
      })
    })
  }

  private async drain(): Promise<void> {
    try {
      while (this.handler && this.pending.length > 0) {
        const taskId = this.pending.shift()
        if (taskId) await this.handler(taskId)
      }
    } finally {
      this.running = false
      this.schedule()
    }
  }
}

export class BullSystemTaskQueue implements SystemTaskQueue {
  private readonly connection: ConnectionOptions
  private readonly queue: Queue
  private worker: Worker | null = null

  public constructor(redisUrl: string) {
    this.connection = readConnection(redisUrl)
    this.queue = new Queue('zetro-system-tasks', { connection: this.connection })
  }

  public async start(run: (taskId: string) => Promise<void>): Promise<void> {
    this.worker = new Worker('zetro-system-tasks', async (job) => run(String(job.data.taskId)), {
      connection: this.connection,
      concurrency: 2,
    })
    await this.worker.waitUntilReady()
  }

  public async enqueue(taskId: string): Promise<void> {
    await this.queue.add('run', { taskId }, { jobId: taskId, removeOnComplete: 100 })
  }

  public async close(): Promise<void> {
    await this.worker?.close()
    await this.queue.close()
  }
}

function readConnection(value: string): ConnectionOptions {
  const url = new URL(value)
  return {
    db: Number(url.pathname.slice(1)) || 0,
    host: url.hostname,
    maxRetriesPerRequest: null,
    password: url.password || undefined,
    port: Number(url.port) || 6379,
    tls: url.protocol === 'rediss:' ? {} : undefined,
    username: url.username || undefined,
  }
}
