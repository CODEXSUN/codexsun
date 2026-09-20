import type { DatabaseJob, DatabaseJobQueue } from "./database-job-queue.js";

export interface DatabaseJobWorkerConfiguration {
  readonly lockTimeoutMs?: number;
  readonly maximumAttempts: number;
  readonly retryDelayMs: number;
}

export type DatabaseJobHandler = (job: DatabaseJob) => Promise<void>;
export type DatabaseJobWorkerResult = "idle" | "completed" | "retried" | "failed";

/** Claims and runs one durable job at a time. */
export class DatabaseJobWorker {
  constructor(
    private readonly queue: DatabaseJobQueue,
    private readonly handler: DatabaseJobHandler,
    private readonly configuration: DatabaseJobWorkerConfiguration,
  ) {}

  async runOnce(now = new Date()): Promise<DatabaseJobWorkerResult> {
    const timestamp = now.toISOString();
    await this.queue.recoverExpiredLocks(timestamp, this.configuration.lockTimeoutMs ?? 60_000);
    const job = await this.queue.claimNext(timestamp);
    if (!job) return "idle";

    try {
      await this.handler(job);
      await this.queue.complete(job.id, timestamp);
      return "completed";
    } catch {
      const retryAt = new Date(now.getTime() + this.configuration.retryDelayMs).toISOString();
      const state = await this.queue.retry(job.id, retryAt, "job.execution-failed", this.configuration.maximumAttempts);
      return state === "failed" ? "failed" : "retried";
    }
  }
}
