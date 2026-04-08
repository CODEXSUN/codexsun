import { randomUUID } from "node:crypto"

import type { Kysely } from "kysely"

import { acquireRuntimeLock, pruneCompletedRuntimeJobs } from "./runtime-job-service.js"

type RuntimeLogger = ReturnType<typeof import("../observability/runtime-logger.js").createRuntimeLogger>

export type RuntimeScheduledTask = {
  taskKey: string
  cadenceMs: number
  lockTtlMs?: number
  run: (context: { database: Kysely<unknown> }) => Promise<void> | void
}

export function startIntervalTaskScheduler(input: {
  database: Kysely<unknown>
  logger: RuntimeLogger
  tasks?: RuntimeScheduledTask[]
}) {
  const ownerId = `runtime-scheduler:${randomUUID()}`
  const tasks: RuntimeScheduledTask[] = [
    {
      taskKey: "framework.jobs.prune-completed",
      cadenceMs: 60 * 60 * 1000,
      lockTtlMs: 5 * 60 * 1000,
      run: async ({ database }) => {
        await pruneCompletedRuntimeJobs(database)
      },
    },
    ...(input.tasks ?? []),
  ]

  const timers = tasks.map((task) => {
    const invoke = async () => {
      const lockKey = `runtime-task:${task.taskKey}`
      const acquired = await acquireRuntimeLock(
        input.database,
        lockKey,
        ownerId,
        task.lockTtlMs ?? Math.max(task.cadenceMs, 60_000)
      )

      if (!acquired) {
        return
      }

      try {
        await task.run({ database: input.database })
        input.logger.info("runtime.scheduler.completed", { taskKey: task.taskKey })
      } catch (error) {
        input.logger.error("runtime.scheduler.failed", {
          taskKey: task.taskKey,
          error: error instanceof Error ? error.message : String(error),
        })
      }
    }

    void invoke()
    return setInterval(() => {
      void invoke()
    }, Math.max(1_000, task.cadenceMs))
  })

  return () => {
    for (const timer of timers) {
      clearInterval(timer)
    }
  }
}
