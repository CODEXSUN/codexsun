import type { Kysely } from "kysely"

import type { AuthUser } from "../../../cxapp/shared/index.js"
import {
  listActivityLogs,
  writeActivityLog,
} from "../../../framework/src/runtime/activity-log/activity-log-service.js"
import type { ServerConfig } from "../../../framework/src/runtime/config/server-config.js"
import {
  getMonitoringDashboard,
  recordMonitoringEvent,
} from "../../../framework/src/runtime/monitoring/monitoring-service.js"
import {
  frappeObservabilityReportResponseSchema,
  type FrappeObservabilityReportResponse,
} from "../../shared/index.js"
import { assertFrappeViewer } from "./access.js"

function toExceptionAction(action: string) {
  return `frappe.${action}`.trim()
}

export async function recordFrappeConnectorEvent(
  database: Kysely<unknown>,
  user: Pick<AuthUser, "id" | "email" | "actorType"> | null,
  input: {
    action: string
    status: "success" | "failure"
    message: string
    referenceId?: string | null
    details?: Record<string, unknown> | null
  }
) {
  const level = input.status === "failure" ? "error" : "info"

  await Promise.all([
    recordMonitoringEvent(database, {
      sourceApp: "frappe",
      operation: "connector_sync",
      status: input.status,
      message: input.message,
      referenceId: input.referenceId ?? null,
      context: {
        action: input.action,
        ...(input.details ?? {}),
      },
    }),
    writeActivityLog(database, {
      category: "frappe",
      action: toExceptionAction(input.action),
      level,
      message: input.message,
      actorId: user?.id ?? null,
      actorEmail: user?.email ?? null,
      actorType: user?.actorType ?? null,
      context: {
        referenceId: input.referenceId ?? null,
        ...(input.details ?? {}),
      },
    }),
  ])
}

export async function readFrappeObservabilityReport(
  database: Kysely<unknown>,
  config: ServerConfig,
  user: AuthUser
): Promise<FrappeObservabilityReportResponse> {
  assertFrappeViewer(user)

  const [dashboard, activityLogs] = await Promise.all([
    getMonitoringDashboard(database, config, {
      windowHours: 24,
      recentLimit: 20,
    }),
    listActivityLogs(database, {
      category: "frappe",
      limit: 20,
    }),
  ])

  const connectorSummary = dashboard.summaries.find(
    (item) => item.operation === "connector_sync"
  )
  const recentExceptions = activityLogs.items
    .filter((item) => item.level === "error" || item.level === "warn")
    .map((item) => ({
      id: item.id,
      action: item.action,
      level: item.level,
      message: item.message,
      actorEmail: item.actorEmail,
      referenceId:
        typeof item.context?.referenceId === "string"
          ? item.context.referenceId
          : null,
      createdAt: item.createdAt,
    }))

  return frappeObservabilityReportResponseSchema.parse({
    report: {
      generatedAt: new Date().toISOString(),
      summary: {
        connectorFailureCount: connectorSummary?.failureCount ?? 0,
        connectorSuccessCount: connectorSummary?.successCount ?? 0,
        alertState: connectorSummary?.alertState ?? "healthy",
        threshold: connectorSummary?.threshold ?? config.observability.thresholds.connectorSyncFailures,
        lastFailureAt: connectorSummary?.lastFailureAt ?? null,
        lastSuccessAt: connectorSummary?.lastEventAt ?? null,
      },
      recentExceptions,
    },
  })
}
