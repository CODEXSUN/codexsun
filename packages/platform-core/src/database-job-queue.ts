import { randomUUID } from "node:crypto";
import type { Kysely } from "kysely";

export type DatabaseJobState = "scheduled" | "processing" | "completed" | "failed" | "canceled";

export interface DatabaseJob {
  readonly id: string;
  readonly owner: string;
  readonly name: string;
  readonly payload: string;
  readonly correlationId?: string;
  readonly state: DatabaseJobState;
  readonly attempts: number;
  readonly availableAt: string;
}

export interface DatabaseJobQueueSchema {
  platform_jobs: {
    id: string;
    owner: string;
    name: string;
    payload: string;
    correlation_id: string | null;
    state: DatabaseJobState;
    attempts: number;
    available_at: string;
    locked_at: string | null;
    completed_at: string | null;
    failure_code: string | null;
  };
}

export type DatabaseJobStateCounts = Record<DatabaseJobState, number>;

/** Stores durable background work in the application database. */
export class DatabaseJobQueue {
  constructor(private readonly database: Kysely<DatabaseJobQueueSchema>) {}

  async enqueue(input: Omit<DatabaseJob, "id" | "state" | "attempts">): Promise<DatabaseJob> {
    assertJobInput(input);
    const job: DatabaseJob = { ...input, id: randomUUID(), state: "scheduled", attempts: 0 };
    await this.database
      .insertInto("platform_jobs")
      .values({
        id: job.id,
        owner: job.owner,
        name: job.name,
        payload: job.payload,
        correlation_id: job.correlationId ?? null,
        state: job.state,
        attempts: job.attempts,
        available_at: job.availableAt,
        locked_at: null,
        completed_at: null,
        failure_code: null,
      })
      .execute();
    return job;
  }

  async claimNext(now: string): Promise<DatabaseJob | undefined> {
    return this.database.transaction().execute(async (transaction) => {
      const row = await transaction
        .selectFrom("platform_jobs")
        .selectAll()
        .where("state", "=", "scheduled")
        .where("available_at", "<=", now)
        .orderBy("available_at")
        .orderBy("id")
        .executeTakeFirst();
      if (!row) return undefined;

      const result = await transaction
        .updateTable("platform_jobs")
        .set({ locked_at: now, state: "processing" })
        .where("id", "=", row.id)
        .where("state", "=", "scheduled")
        .executeTakeFirst();
      if (Number(result.numUpdatedRows) !== 1) return undefined;
      return toJob({ ...row, state: "processing", locked_at: now });
    });
  }

  async cancel(jobId: string): Promise<boolean> {
    const result = await this.database
      .updateTable("platform_jobs")
      .set({ state: "canceled" })
      .where("id", "=", jobId)
      .where("state", "=", "scheduled")
      .executeTakeFirst();
    return Number(result.numUpdatedRows) === 1;
  }

  async complete(jobId: string, completedAt: string): Promise<void> {
    await this.database
      .updateTable("platform_jobs")
      .set({ completed_at: completedAt, failure_code: null, locked_at: null, state: "completed" })
      .where("id", "=", jobId)
      .where("state", "=", "processing")
      .execute();
  }

  async retry(jobId: string, availableAt: string, failureCode: string, maximumAttempts: number): Promise<DatabaseJobState> {
    if (!Number.isInteger(maximumAttempts) || maximumAttempts < 1) throw new Error("Job maximum attempts must be at least one.");
    const row = await this.database
      .selectFrom("platform_jobs")
      .select("attempts")
      .where("id", "=", jobId)
      .where("state", "=", "processing")
      .executeTakeFirst();
    if (!row) return "canceled";

    const attempts = row.attempts + 1;
    const state: DatabaseJobState = attempts >= maximumAttempts ? "failed" : "scheduled";
    await this.database
      .updateTable("platform_jobs")
      .set({ attempts, available_at: availableAt, failure_code: failureCode, locked_at: null, state })
      .where("id", "=", jobId)
      .where("state", "=", "processing")
      .execute();
    return state;
  }

  async recoverExpiredLocks(now: string, lockTimeoutMs: number): Promise<number> {
    if (!Number.isInteger(lockTimeoutMs) || lockTimeoutMs < 1) throw new Error("Job lock timeout must be at least one millisecond.");
    const expiresAt = new Date(new Date(now).getTime() - lockTimeoutMs).toISOString();
    const result = await this.database
      .updateTable("platform_jobs")
      .set({ available_at: now, failure_code: "job.lock-expired", locked_at: null, state: "scheduled" })
      .where("state", "=", "processing")
      .where("locked_at", "<", expiresAt)
      .executeTakeFirst();
    return Number(result.numUpdatedRows);
  }

  async stateCounts(): Promise<DatabaseJobStateCounts> {
    const rows = await this.database
      .selectFrom("platform_jobs")
      .select("state")
      .select((expression) => expression.fn.countAll<number>().as("count"))
      .groupBy("state")
      .execute();
    const counts: DatabaseJobStateCounts = { canceled: 0, completed: 0, failed: 0, processing: 0, scheduled: 0 };
    for (const row of rows) counts[row.state] = Number(row.count);
    return counts;
  }
}

function assertJobInput(input: Omit<DatabaseJob, "id" | "state" | "attempts">): void {
  if (!input.owner.trim()) throw new Error("Job owner is required.");
  if (!input.name.trim()) throw new Error("Job name is required.");
}

function toJob(row: DatabaseJobQueueSchema["platform_jobs"]): DatabaseJob {
  return {
    id: row.id,
    owner: row.owner,
    name: row.name,
    payload: row.payload,
    correlationId: row.correlation_id ?? undefined,
    state: row.state,
    attempts: row.attempts,
    availableAt: row.available_at,
  };
}
