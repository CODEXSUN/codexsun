import { randomUUID } from "node:crypto";
import type { Kysely } from "kysely";

export type OutboxState = "pending" | "processing" | "completed" | "failed";

export interface OutboxMessage {
  readonly id: string;
  readonly owner: string;
  readonly eventType: string;
  readonly payload: string;
  readonly correlationId?: string;
  readonly state: OutboxState;
  readonly attempts: number;
  readonly availableAt: string;
}

export interface DatabaseOutboxSchema {
  platform_outbox_messages: {
    id: string;
    owner: string;
    event_type: string;
    payload: string;
    correlation_id: string | null;
    state: OutboxState;
    attempts: number;
    available_at: string;
    locked_at: string | null;
    completed_at: string | null;
    failure_code: string | null;
  };
  platform_event_consumptions: {
    consumer_id: string;
    message_id: string;
    completed_at: string;
  };
}

export type OutboxStateCounts = Record<OutboxState, number>;

export class DatabaseOutbox {
  constructor(private readonly database: Kysely<DatabaseOutboxSchema>) {}

  forDatabase(database: Kysely<DatabaseOutboxSchema>): DatabaseOutbox {
    return new DatabaseOutbox(database);
  }

  async record(input: Omit<OutboxMessage, "id" | "state" | "attempts">): Promise<OutboxMessage> {
    const message: OutboxMessage = { ...input, id: randomUUID(), state: "pending", attempts: 0 };
    await this.database
      .insertInto("platform_outbox_messages")
      .values({
        id: message.id,
        owner: message.owner,
        event_type: message.eventType,
        payload: message.payload,
        correlation_id: message.correlationId ?? null,
        state: message.state,
        attempts: message.attempts,
        available_at: message.availableAt,
        locked_at: null,
        completed_at: null,
        failure_code: null,
      })
      .execute();
    return message;
  }

  async claimNext(now: string): Promise<OutboxMessage | undefined> {
    return this.database.transaction().execute(async (transaction) => {
      const row = await transaction
        .selectFrom("platform_outbox_messages")
        .selectAll()
        .where("state", "=", "pending")
        .where("available_at", "<=", now)
        .orderBy("available_at")
        .orderBy("id")
        .executeTakeFirst();
      if (!row) return undefined;

      const update = await transaction
        .updateTable("platform_outbox_messages")
        .set({ state: "processing", locked_at: now })
        .where("id", "=", row.id)
        .where("state", "=", "pending")
        .executeTakeFirst();
      if (Number(update.numUpdatedRows) !== 1) return undefined;
      return toMessage({ ...row, state: "processing" });
    });
  }

  /** Releases messages abandoned by a crashed worker so another worker can retry them. */
  async recoverExpiredLocks(now: string, lockTimeoutMs: number): Promise<number> {
    if (!Number.isInteger(lockTimeoutMs) || lockTimeoutMs < 1) throw new Error("Outbox lock timeout must be at least one millisecond.");
    const expiresAt = new Date(new Date(now).getTime() - lockTimeoutMs).toISOString();
    const result = await this.database
      .updateTable("platform_outbox_messages")
      .set({ state: "pending", available_at: now, locked_at: null, failure_code: "outbox.lock-expired" })
      .where("state", "=", "processing")
      .where("locked_at", "<", expiresAt)
      .executeTakeFirst();
    return Number(result.numUpdatedRows);
  }

  async complete(messageId: string, completedAt: string): Promise<void> {
    await this.database
      .updateTable("platform_outbox_messages")
      .set({ state: "completed", completed_at: completedAt, locked_at: null, failure_code: null })
      .where("id", "=", messageId)
      .where("state", "=", "processing")
      .execute();
  }

  async fail(messageId: string, availableAt: string, failureCode: string, maximumAttempts: number): Promise<void> {
    if (maximumAttempts < 1) throw new Error("Outbox maximum attempts must be at least one.");
    const row = await this.database
      .selectFrom("platform_outbox_messages")
      .select(["attempts"])
      .where("id", "=", messageId)
      .where("state", "=", "processing")
      .executeTakeFirst();
    if (!row) return;

    const attempts = row.attempts + 1;
    await this.database
      .updateTable("platform_outbox_messages")
      .set({
        state: attempts >= maximumAttempts ? "failed" : "pending",
        attempts,
        available_at: availableAt,
        locked_at: null,
        failure_code: failureCode,
      })
      .where("id", "=", messageId)
      .where("state", "=", "processing")
      .execute();
  }

  async consumeOnce(consumerId: string, messageId: string, completedAt: string): Promise<boolean> {
    const result = await this.database
      .insertInto("platform_event_consumptions")
      .values({ consumer_id: consumerId, message_id: messageId, completed_at: completedAt })
      .onConflict((conflict) => conflict.columns(["consumer_id", "message_id"]).doNothing())
      .executeTakeFirst();
    return Number(result.numInsertedOrUpdatedRows) === 1;
  }

  async hasConsumed(consumerId: string, messageId: string): Promise<boolean> {
    const consumption = await this.database
      .selectFrom("platform_event_consumptions")
      .select("message_id")
      .where("consumer_id", "=", consumerId)
      .where("message_id", "=", messageId)
      .executeTakeFirst();
    return Boolean(consumption);
  }

  async stateCounts(): Promise<OutboxStateCounts> {
    const rows = await this.database
      .selectFrom("platform_outbox_messages")
      .select(["state"])
      .select((expression) => expression.fn.countAll<number>().as("count"))
      .groupBy("state")
      .execute();
    const counts: OutboxStateCounts = { pending: 0, processing: 0, completed: 0, failed: 0 };
    for (const row of rows) counts[row.state] = Number(row.count);
    return counts;
  }
}

function toMessage(row: DatabaseOutboxSchema["platform_outbox_messages"]): OutboxMessage {
  return {
    id: row.id,
    owner: row.owner,
    eventType: row.event_type,
    payload: row.payload,
    correlationId: row.correlation_id ?? undefined,
    state: row.state,
    attempts: row.attempts,
    availableAt: row.available_at,
  };
}
