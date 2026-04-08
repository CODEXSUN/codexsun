import { z } from "zod"

export const monitoringOperationSchema = z.enum([
  "checkout",
  "payment_verify",
  "webhook",
  "order_creation",
  "mail_send",
  "connector_sync",
])

export const monitoringStatusSchema = z.enum(["success", "failure"])
export const monitoringAlertStateSchema = z.enum(["healthy", "breached"])

export const monitoringEventSchema = z.object({
  id: z.string().min(1),
  sourceApp: z.string().min(1),
  operation: monitoringOperationSchema,
  status: monitoringStatusSchema,
  message: z.string().min(1),
  requestId: z.string().nullable(),
  routePath: z.string().nullable(),
  referenceId: z.string().nullable(),
  context: z.record(z.string(), z.unknown()).nullable(),
  createdAt: z.string().min(1),
})

export const monitoringSummaryItemSchema = z.object({
  operation: monitoringOperationSchema,
  label: z.string().min(1),
  successCount: z.number().int().nonnegative(),
  failureCount: z.number().int().nonnegative(),
  totalCount: z.number().int().nonnegative(),
  threshold: z.number().int().positive(),
  alertState: monitoringAlertStateSchema,
  lastEventAt: z.string().nullable(),
  lastFailureAt: z.string().nullable(),
})

export const monitoringChannelsSchema = z.object({
  alertEmails: z.array(z.string()),
  alertWebhookUrl: z.string().nullable(),
  hasEmailTargets: z.boolean(),
  hasWebhookTarget: z.boolean(),
})

export const monitoringThresholdsSchema = z.object({
  checkoutFailures: z.number().int().positive(),
  paymentVerifyFailures: z.number().int().positive(),
  webhookFailures: z.number().int().positive(),
  orderCreationFailures: z.number().int().positive(),
  mailFailures: z.number().int().positive(),
  connectorSyncFailures: z.number().int().positive(),
})

export const monitoringDashboardResponseSchema = z.object({
  generatedAt: z.string().min(1),
  windowHours: z.number().int().positive(),
  channels: monitoringChannelsSchema,
  thresholds: monitoringThresholdsSchema,
  summaries: z.array(monitoringSummaryItemSchema),
  recentFailures: z.array(monitoringEventSchema),
})

export const monitoringEventWritePayloadSchema = z.object({
  sourceApp: z.string().min(1),
  operation: monitoringOperationSchema,
  status: monitoringStatusSchema,
  message: z.string().min(1),
  requestId: z.string().min(1).nullable().optional(),
  routePath: z.string().min(1).nullable().optional(),
  referenceId: z.string().min(1).nullable().optional(),
  context: z.record(z.string(), z.unknown()).nullable().optional(),
})

export type MonitoringOperation = z.infer<typeof monitoringOperationSchema>
export type MonitoringStatus = z.infer<typeof monitoringStatusSchema>
export type MonitoringAlertState = z.infer<typeof monitoringAlertStateSchema>
export type MonitoringEvent = z.infer<typeof monitoringEventSchema>
export type MonitoringSummaryItem = z.infer<typeof monitoringSummaryItemSchema>
export type MonitoringDashboardResponse = z.infer<
  typeof monitoringDashboardResponseSchema
>
export type MonitoringEventWritePayload = z.infer<
  typeof monitoringEventWritePayloadSchema
>
