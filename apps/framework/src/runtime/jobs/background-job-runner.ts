import { randomUUID } from "node:crypto"

import type { Kysely } from "kysely"

import {
  claimDueRuntimeJobs,
  completeRuntimeJob,
  failRuntimeJob,
  type RuntimeJobHandler,
  type RuntimeJobRecord,
} from "./runtime-job-service.js"

type RuntimeLogger = ReturnType<typeof import("../observability/runtime-logger.js").createRuntimeLogger>

export function startBackgroundJobRunner(input: {
  database: Kysely<unknown>
  logger: RuntimeLogger
  handlers: Record<string, RuntimeJobHandler>
  pollIntervalMs?: number
  concurrency?: number
}) {
  const workerId = `runtime-worker:${randomUUID()}`
  const pollIntervalMs = Math.max(500, input.pollIntervalMs ?? 2_000)
  const concurrency = Math.max(1, input.concurrency ?? 3)
  let isPolling = false

  const runOne = async (job: RuntimeJobRecord) => {
    const handler = input.handlers[job.handlerKey]

    if (!handler) {
      await failRuntimeJob(
        input.database,
        job,
        workerId,
        new Error(`No background-job handler is registered for ${job.handlerKey}.`),
        60_000
      )
      input.logger.error("runtime.jobs.handler_missing", {
        workerId,
        jobId: job.id,
        handlerKey: job.handlerKey,
      })
      return
    }

    try {
      const result = await handler({
        job,
        database: input.database,
      })

      await completeRuntimeJob(input.database, job.id, workerId, result?.summary ?? null)
      input.logger.info("runtime.jobs.completed", {
        workerId,
        jobId: job.id,
        handlerKey: job.handlerKey,
      })
    } catch (error) {
      await failRuntimeJob(input.database, job, workerId, error)
      input.logger.error("runtime.jobs.failed", {
        workerId,
        jobId: job.id,
        handlerKey: job.handlerKey,
        error: error instanceof Error ? error.message : String(error),
      })
    }
  }

  const poll = async () => {
    if (isPolling) {
      return
    }

    isPolling = true

    try {
      const jobs = await claimDueRuntimeJobs(input.database, workerId, concurrency)

      if (jobs.length > 0) {
        await Promise.all(jobs.map((job) => runOne(job)))
      }
    } finally {
      isPolling = false
    }
  }

  void poll()
  const timer = setInterval(() => {
    void poll()
  }, pollIntervalMs)

  return () => clearInterval(timer)
}
