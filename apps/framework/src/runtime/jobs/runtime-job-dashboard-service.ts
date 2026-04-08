import type { Kysely } from "kysely"

import { runtimeJobDashboardSchema, type RuntimeJobStatus } from "../../../shared/runtime-jobs.js"
import { runtimeJobTableNames } from "./runtime-job-table-names.js"

type DynamicDatabase = Record<string, Record<string, unknown>>

function asQueryDatabase(database: Kysely<unknown>) {
  return database as unknown as Kysely<DynamicDatabase>
}

function nowIso() {
  return new Date().toISOString()
}

function mapRuntimeJobRow(row: Record<string, unknown>) {
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

async function countRuntimeJobs(
  database: Kysely<unknown>,
  status?: RuntimeJobStatus,
  readyNow = false
) {
  const timestamp = nowIso()
  let query = asQueryDatabase(database)
    .selectFrom(runtimeJobTableNames.jobs)
    .select((expressionBuilder) => expressionBuilder.fn.countAll<number>().as("count"))

  if (status) {
    query = query.where("status", "=", status)
  }

  if (readyNow) {
    query = query.where("status", "=", "queued").where("available_at", "<=", timestamp)
  }

  const row = await query.executeTakeFirst()

  return Number(row?.count ?? 0)
}

export async function getRuntimeJobDashboard(
  database: Kysely<unknown>,
  options?: {
    status?: RuntimeJobStatus | "all" | null
    limit?: number
  }
) {
  const limit = Math.min(Math.max(options?.limit ?? 120, 20), 400)
  let itemsQuery = asQueryDatabase(database)
    .selectFrom(runtimeJobTableNames.jobs)
    .selectAll()
    .orderBy("created_at", "desc")
    .limit(limit)

  if (options?.status && options.status !== "all") {
    itemsQuery = itemsQuery.where("status", "=", options.status)
  }

  const rows = await itemsQuery.execute()
  const [total, queued, running, completed, failed, readyNow] = await Promise.all([
    countRuntimeJobs(database),
    countRuntimeJobs(database, "queued"),
    countRuntimeJobs(database, "running"),
    countRuntimeJobs(database, "completed"),
    countRuntimeJobs(database, "failed"),
    countRuntimeJobs(database, undefined, true),
  ])

  return runtimeJobDashboardSchema.parse({
    generatedAt: nowIso(),
    summary: {
      total,
      queued,
      running,
      completed,
      failed,
      readyNow,
    },
    items: rows.map((row) => mapRuntimeJobRow(row)),
  })
}
