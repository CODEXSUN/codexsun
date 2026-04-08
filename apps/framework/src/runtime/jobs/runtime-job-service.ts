import { randomUUID } from "node:crypto"

import type { Kysely } from "kysely"

import { runtimeJobTableNames } from "./runtime-job-table-names.js"

type DynamicDatabase = Record<string, Record<string, unknown>>

export type RuntimeJobStatus = "queued" | "running" | "completed" | "failed"

export type RuntimeJobRecord<TPayload = unknown> = {
  id: string
  queueName: string
  handlerKey: string
  appId: string
  moduleKey: string
  dedupeKey: string | null
  payload: TPayload
  status: RuntimeJobStatus
  attempts: number
  maxAttempts: number
  scheduledAt: string
  availableAt: string
  startedAt: string | null
  completedAt: string | null
  failedAt: string | null
  lockedBy: string | null
  lockedAt: string | null
  lastError: string | null
  resultSummary: string | null
  createdAt: string
  updatedAt: string
}

export type RuntimeJobHandlerContext<TPayload = unknown> = {
  job: RuntimeJobRecord<TPayload>
  database: Kysely<unknown>
}

export type RuntimeJobHandler<TPayload = unknown> = (
  context: RuntimeJobHandlerContext<TPayload>
) => Promise<{ summary?: string | null } | void>

export type RuntimeJobDefinition = {
  queueName: string
  handlerKey: string
  appId: string
  moduleKey: string
  dedupeKey?: string | null
  payload: unknown
  scheduledAt?: string
  availableAt?: string
  maxAttempts?: number
}

function asQueryDatabase(database: Kysely<unknown>) {
  return database as unknown as Kysely<DynamicDatabase>
}

function nowIso() {
  return new Date().toISOString()
}

function addDelay(timestamp: string, delayMs: number) {
  return new Date(new Date(timestamp).getTime() + Math.max(0, delayMs)).toISOString()
}

function mapRuntimeJobRow(row: Record<string, unknown>): RuntimeJobRecord {
  return {
    id: String(row.id ?? ""),
    queueName: String(row.queue_name ?? ""),
    handlerKey: String(row.handler_key ?? ""),
    appId: String(row.app_id ?? ""),
    moduleKey: String(row.module_key ?? ""),
    dedupeKey: row.dedupe_key == null ? null : String(row.dedupe_key),
    payload: JSON.parse(String(row.payload_json ?? "{}")),
    status:
      row.status === "running" || row.status === "completed" || row.status === "failed"
        ? row.status
        : "queued",
    attempts: Number(row.attempts ?? 0),
    maxAttempts: Number(row.max_attempts ?? 3),
    scheduledAt: String(row.scheduled_at ?? ""),
    availableAt: String(row.available_at ?? ""),
    startedAt: row.started_at == null ? null : String(row.started_at),
    completedAt: row.completed_at == null ? null : String(row.completed_at),
    failedAt: row.failed_at == null ? null : String(row.failed_at),
    lockedBy: row.locked_by == null ? null : String(row.locked_by),
    lockedAt: row.locked_at == null ? null : String(row.locked_at),
    lastError: row.last_error == null ? null : String(row.last_error),
    resultSummary: row.result_summary == null ? null : String(row.result_summary),
    createdAt: String(row.created_at ?? ""),
    updatedAt: String(row.updated_at ?? ""),
  }
}

export async function enqueueRuntimeJob(
  database: Kysely<unknown>,
  definition: RuntimeJobDefinition
) {
  const queryDatabase = asQueryDatabase(database)
  const timestamp = nowIso()
  const scheduledAt = definition.scheduledAt ?? timestamp
  const availableAt = definition.availableAt ?? scheduledAt
  const dedupeKey = definition.dedupeKey?.trim() ? definition.dedupeKey.trim() : null

  if (dedupeKey) {
    const existing = await queryDatabase
      .selectFrom(runtimeJobTableNames.jobs)
      .selectAll()
      .where("handler_key", "=", definition.handlerKey)
      .where("dedupe_key", "=", dedupeKey)
      .where("status", "in", ["queued", "running"])
      .orderBy("created_at", "desc")
      .executeTakeFirst()

    if (existing) {
      return mapRuntimeJobRow(existing)
    }
  }

  const job = {
    id: `runtime-job:${randomUUID()}`,
    queue_name: definition.queueName,
    handler_key: definition.handlerKey,
    app_id: definition.appId,
    module_key: definition.moduleKey,
    dedupe_key: dedupeKey,
    payload_json: JSON.stringify(definition.payload),
    status: "queued",
    attempts: 0,
    max_attempts: Math.max(1, definition.maxAttempts ?? 3),
    scheduled_at: scheduledAt,
    available_at: availableAt,
    started_at: null,
    completed_at: null,
    failed_at: null,
    locked_by: null,
    locked_at: null,
    last_error: null,
    result_summary: null,
    created_at: timestamp,
    updated_at: timestamp,
  }

  await queryDatabase.insertInto(runtimeJobTableNames.jobs).values(job).execute()

  return mapRuntimeJobRow(job)
}

export async function listActiveRuntimeJobsByHandler(
  database: Kysely<unknown>,
  handlerKey: string
) {
  const rows = await asQueryDatabase(database)
    .selectFrom(runtimeJobTableNames.jobs)
    .selectAll()
    .where("handler_key", "=", handlerKey)
    .where("status", "in", ["queued", "running"])
    .orderBy("created_at", "desc")
    .execute()

  return rows.map((row) => mapRuntimeJobRow(row))
}

export async function claimDueRuntimeJobs(
  database: Kysely<unknown>,
  workerId: string,
  limit = 5
) {
  const queryDatabase = asQueryDatabase(database)
  const timestamp = nowIso()
  const candidates = await queryDatabase
    .selectFrom(runtimeJobTableNames.jobs)
    .selectAll()
    .where("status", "=", "queued")
    .where("available_at", "<=", timestamp)
    .orderBy("available_at")
    .orderBy("created_at")
    .limit(Math.max(1, limit * 3))
    .execute()

  const claimed: RuntimeJobRecord[] = []

  for (const candidate of candidates) {
    if (claimed.length >= limit) {
      break
    }

    const updatedAt = nowIso()
    const updateResult = await queryDatabase
      .updateTable(runtimeJobTableNames.jobs)
      .set({
        status: "running",
        attempts: Number(candidate.attempts ?? 0) + 1,
        locked_by: workerId,
        locked_at: updatedAt,
        started_at: candidate.started_at ?? updatedAt,
        updated_at: updatedAt,
      })
      .where("id", "=", String(candidate.id))
      .where("status", "=", "queued")
      .where("locked_by", "is", null)
      .executeTakeFirst()

    if (Number(updateResult.numUpdatedRows ?? 0) > 0) {
      const row = await queryDatabase
        .selectFrom(runtimeJobTableNames.jobs)
        .selectAll()
        .where("id", "=", String(candidate.id))
        .executeTakeFirst()

      if (row) {
        claimed.push(mapRuntimeJobRow(row))
      }
    }
  }

  return claimed
}

export async function completeRuntimeJob(
  database: Kysely<unknown>,
  jobId: string,
  workerId: string,
  summary?: string | null
) {
  await asQueryDatabase(database)
    .updateTable(runtimeJobTableNames.jobs)
    .set({
      status: "completed",
      completed_at: nowIso(),
      locked_by: null,
      locked_at: null,
      last_error: null,
      result_summary: summary ?? null,
      updated_at: nowIso(),
    })
    .where("id", "=", jobId)
    .where("locked_by", "=", workerId)
    .execute()
}

export async function failRuntimeJob(
  database: Kysely<unknown>,
  job: RuntimeJobRecord,
  workerId: string,
  error: unknown,
  retryDelayMs = 30_000
) {
  const message = error instanceof Error ? error.message : String(error)
  const timestamp = nowIso()
  const shouldRetry = job.attempts < job.maxAttempts

  await asQueryDatabase(database)
    .updateTable(runtimeJobTableNames.jobs)
    .set({
      status: shouldRetry ? "queued" : "failed",
      available_at: shouldRetry ? addDelay(timestamp, retryDelayMs) : timestamp,
      failed_at: shouldRetry ? null : timestamp,
      locked_by: null,
      locked_at: null,
      last_error: message,
      result_summary: shouldRetry ? "Retry scheduled after handler failure." : "Job failed.",
      updated_at: timestamp,
    })
    .where("id", "=", job.id)
    .where("locked_by", "=", workerId)
    .execute()
}

export async function pruneCompletedRuntimeJobs(
  database: Kysely<unknown>,
  retentionMs = 7 * 24 * 60 * 60 * 1000
) {
  const cutoff = addDelay(nowIso(), -retentionMs)

  await asQueryDatabase(database)
    .deleteFrom(runtimeJobTableNames.jobs)
    .where("status", "in", ["completed", "failed"])
    .where("updated_at", "<", cutoff)
    .execute()
}

export async function acquireRuntimeLock(
  database: Kysely<unknown>,
  lockKey: string,
  ownerId: string,
  ttlMs: number
) {
  const queryDatabase = asQueryDatabase(database)
  const timestamp = nowIso()
  const expiresAt = addDelay(timestamp, ttlMs)
  const current = await queryDatabase
    .selectFrom(runtimeJobTableNames.locks)
    .selectAll()
    .where("lock_key", "=", lockKey)
    .executeTakeFirst()

  if (!current) {
    try {
      await queryDatabase
        .insertInto(runtimeJobTableNames.locks)
        .values({
          lock_key: lockKey,
          owner_id: ownerId,
          expires_at: expiresAt,
          created_at: timestamp,
          updated_at: timestamp,
        })
        .execute()
      return true
    } catch {
      return false
    }
  }

  if (String(current.expires_at ?? "") > timestamp && String(current.owner_id ?? "") !== ownerId) {
    return false
  }

  const updateResult = await queryDatabase
    .updateTable(runtimeJobTableNames.locks)
    .set({
      owner_id: ownerId,
      expires_at: expiresAt,
      updated_at: timestamp,
    })
    .where("lock_key", "=", lockKey)
    .where((expressionBuilder) =>
      expressionBuilder.or([
        expressionBuilder("owner_id", "=", ownerId),
        expressionBuilder("expires_at", "<=", timestamp),
      ])
    )
    .executeTakeFirst()

  return Number(updateResult.numUpdatedRows ?? 0) > 0
}
