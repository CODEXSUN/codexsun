import type { FrameworkEvent } from "@codexsun/framework";
import type { Kysely } from "kysely";
import { DatabaseOutbox, type DatabaseOutboxSchema, type OutboxMessage } from "./database-outbox.js";

/** Persists framework events before an application commits its business transaction. */
export class DatabaseOutboxEventBridge {
  constructor(private readonly outbox: DatabaseOutbox) {}

  record(event: FrameworkEvent, owner: string, availableAt = new Date().toISOString()): Promise<OutboxMessage> {
    return this.recordWith(this.outbox, event, owner, availableAt);
  }

  recordInTransaction(
    database: Kysely<DatabaseOutboxSchema>,
    event: FrameworkEvent,
    owner: string,
    availableAt = new Date().toISOString(),
  ): Promise<OutboxMessage> {
    return this.recordWith(this.outbox.forDatabase(database), event, owner, availableAt);
  }

  private recordWith(outbox: DatabaseOutbox, event: FrameworkEvent, owner: string, availableAt: string): Promise<OutboxMessage> {
    if (!owner.trim()) throw new Error("Outbox event owner is required.");
    return outbox.record({
      owner,
      eventType: event.name,
      payload: JSON.stringify(event.payload),
      correlationId: event.correlationId,
      availableAt,
    });
  }
}
