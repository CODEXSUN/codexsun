import type { RuntimeDatabases } from "../../../framework/src/runtime/database/client.js"
import type { ServerConfig } from "../../../framework/src/runtime/config/index.js"
import { startBackgroundJobRunner } from "../../../framework/src/runtime/jobs/background-job-runner.js"
import { startIntervalTaskScheduler } from "../../../framework/src/runtime/jobs/interval-task-scheduler.js"
import type { RuntimeJobHandler } from "../../../framework/src/runtime/jobs/runtime-job-service.js"
import { sendQueuedStorefrontWelcomeMail } from "../../../ecommerce/src/services/customer-service.js"

type RuntimeLogger = ReturnType<typeof import("../../../framework/src/runtime/observability/runtime-logger.js").createRuntimeLogger>

export function startCxappBackgroundRuntime(input: {
  config: ServerConfig
  databases: RuntimeDatabases
  logger: RuntimeLogger
}) {
  const handlers: Record<string, RuntimeJobHandler> = {
    "ecommerce.customer.send-welcome-mail": async ({ job, database }) => {
      const payload =
        typeof job.payload === "object" && job.payload !== null
          ? (job.payload as { customerAccountId?: unknown; trigger?: unknown })
          : {}
      const customerAccountId =
        typeof payload.customerAccountId === "string" ? payload.customerAccountId : ""

      await sendQueuedStorefrontWelcomeMail(database, input.config, customerAccountId)

      return {
        summary:
          typeof payload.trigger === "string"
            ? `Welcome mail processed from ${payload.trigger} trigger.`
            : "Welcome mail processed.",
      }
    },
  }

  const stopJobRunner = startBackgroundJobRunner({
    database: input.databases.primary,
    logger: input.logger,
    handlers,
  })
  const stopScheduler = startIntervalTaskScheduler({
    database: input.databases.primary,
    logger: input.logger,
  })

  return () => {
    stopScheduler()
    stopJobRunner()
  }
}
