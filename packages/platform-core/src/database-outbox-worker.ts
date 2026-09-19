import type { DatabaseOutbox, OutboxMessage } from "./database-outbox.js";

export interface DatabaseOutboxWorkerConfiguration {
  readonly lockTimeoutMs?: number;
  readonly maximumAttempts: number;
  readonly retryDelayMs: number;
}

export type DatabaseOutboxHandler = (message: OutboxMessage) => Promise<void>;

export class DatabaseOutboxWorker {
  constructor(
    private readonly outbox: DatabaseOutbox,
    private readonly handler: DatabaseOutboxHandler,
    private readonly configuration: DatabaseOutboxWorkerConfiguration,
  ) {}

  async runOnce(now = new Date()): Promise<"idle" | "completed" | "retried" | "failed"> {
    const timestamp = now.toISOString();
    await this.outbox.recoverExpiredLocks(timestamp, this.configuration.lockTimeoutMs ?? 60_000);
    const message = await this.outbox.claimNext(timestamp);
    if (!message) return "idle";

    try {
      await this.handler(message);
      await this.outbox.complete(message.id, timestamp);
      return "completed";
    } catch {
      const retryAt = new Date(now.getTime() + this.configuration.retryDelayMs).toISOString();
      await this.outbox.fail(message.id, retryAt, "outbox.delivery-failed", this.configuration.maximumAttempts);
      return message.attempts + 1 >= this.configuration.maximumAttempts ? "failed" : "retried";
    }
  }
}
