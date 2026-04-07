import { randomUUID } from "node:crypto"

import type { Kysely } from "kysely"

import {
  monitoringDashboardResponseSchema,
  monitoringEventSchema,
  monitoringEventWritePayloadSchema,
  type MonitoringEvent,
  type MonitoringOperation,
} from "../../../shared/monitoring.js"
import type { ServerConfig } from "../config/server-config.js"
import { frameworkMonitoringTableNames } from "./monitoring-table-names.js"

type DynamicDatabase = Record<string, Record<string, unknown>>

type MonitoringThresholdMap = Record<MonitoringOperation, number>

function asQueryDatabase(database: Kysely<unknown>) {
  return database as unknown as Kysely<DynamicDatabase>
}

function asNullableString(value: unknown) {
  return value == null ? null : String(value)
}

function parseContextJson(value: unknown) {
  if (typeof value !== "string" || !value.trim()) {
    return null
  }

  try {
    return JSON.parse(value) as Record<string, unknown>
  } catch {
    return null
  }
}

function mapMonitoringRow(row: Record<string, unknown>): MonitoringEvent {
  return monitoringEventSchema.parse({
    id: String(row.id ?? ""),
    sourceApp: String(row.source_app ?? ""),
    operation: String(row.operation ?? "checkout"),
    status: String(row.status ?? "success"),
    message: String(row.message ?? ""),
    requestId: asNullableString(row.request_id),
    routePath: asNullableString(row.route_path),
    referenceId: asNullableString(row.reference_id),
    context: parseContextJson(row.context_json),
    createdAt: String(row.created_at ?? ""),
  })
}

function getThresholds(config: ServerConfig): MonitoringThresholdMap {
  return {
    checkout: config.observability.thresholds.checkoutFailures,
    payment_verify: config.observability.thresholds.paymentVerifyFailures,
    webhook: config.observability.thresholds.webhookFailures,
    order_creation: config.observability.thresholds.orderCreationFailures,
    mail_send: config.observability.thresholds.mailFailures,
  }
}

function getOperationLabel(operation: MonitoringOperation) {
  switch (operation) {
    case "payment_verify":
      return "Payment Verify"
    case "order_creation":
      return "Order Creation"
    case "mail_send":
      return "Mail Send"
    default:
      return operation
        .split("_")
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
        .join(" ")
  }
}

export async function recordMonitoringEvent(
  database: Kysely<unknown>,
  payload: unknown
) {
  const parsedPayload = monitoringEventWritePayloadSchema.parse(payload)
  const item = {
    id: randomUUID(),
    source_app: parsedPayload.sourceApp,
    operation: parsedPayload.operation,
    status: parsedPayload.status,
    message: parsedPayload.message.trim(),
    request_id: parsedPayload.requestId ?? null,
    route_path: parsedPayload.routePath ?? null,
    reference_id: parsedPayload.referenceId ?? null,
    context_json: parsedPayload.context ? JSON.stringify(parsedPayload.context) : null,
    created_at: new Date().toISOString(),
  }

  await asQueryDatabase(database)
    .insertInto(frameworkMonitoringTableNames.monitoringEvents)
    .values(item)
    .execute()

  return mapMonitoringRow(item)
}

export async function getMonitoringDashboard(
  database: Kysely<unknown>,
  config: ServerConfig,
  options?: { windowHours?: number; recentLimit?: number }
) {
  const windowHours = Math.max(1, options?.windowHours ?? 24)
  const recentLimit = Math.max(1, options?.recentLimit ?? 25)
  const since = new Date(Date.now() - windowHours * 60 * 60 * 1000).toISOString()
  const rows = await asQueryDatabase(database)
    .selectFrom(frameworkMonitoringTableNames.monitoringEvents)
    .selectAll()
    .where("created_at", ">=", since)
    .orderBy("created_at", "desc")
    .execute()

  const events = rows.map((row) => mapMonitoringRow(row))
  const thresholds = getThresholds(config)
  const operations = Object.keys(thresholds) as MonitoringOperation[]
  const summaries = operations.map((operation) => {
    const operationEvents = events.filter((item) => item.operation === operation)
    const failures = operationEvents.filter((item) => item.status === "failure")

    return {
      operation,
      label: getOperationLabel(operation),
      successCount: operationEvents.length - failures.length,
      failureCount: failures.length,
      totalCount: operationEvents.length,
      threshold: thresholds[operation],
      alertState: failures.length >= thresholds[operation] ? "breached" : "healthy",
      lastEventAt: operationEvents[0]?.createdAt ?? null,
      lastFailureAt: failures[0]?.createdAt ?? null,
    }
  })
  const recentFailures = events
    .filter((item) => item.status === "failure")
    .slice(0, recentLimit)

  return monitoringDashboardResponseSchema.parse({
    generatedAt: new Date().toISOString(),
    windowHours,
    channels: {
      alertEmails: config.observability.alertEmails,
      alertWebhookUrl: config.observability.alertWebhookUrl ?? null,
      hasEmailTargets: config.observability.alertEmails.length > 0,
      hasWebhookTarget: Boolean(config.observability.alertWebhookUrl),
    },
    thresholds: {
      checkoutFailures: config.observability.thresholds.checkoutFailures,
      paymentVerifyFailures: config.observability.thresholds.paymentVerifyFailures,
      webhookFailures: config.observability.thresholds.webhookFailures,
      orderCreationFailures: config.observability.thresholds.orderCreationFailures,
      mailFailures: config.observability.thresholds.mailFailures,
    },
    summaries,
    recentFailures,
  })
}
