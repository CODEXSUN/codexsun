import { z } from "zod"
import { runtimeSettingsSnapshotSchema } from "./runtime-settings.js"

export const remoteServerTargetSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  baseUrl: z.string().url(),
  description: z.string().nullable(),
  isActive: z.boolean(),
  hasMonitorSecret: z.boolean(),
  confirmedAt: z.string().nullable(),
  createdAt: z.string().min(1),
  updatedAt: z.string().min(1),
  createdBy: z.string().nullable(),
  updatedBy: z.string().nullable(),
})

export const remoteServerTargetDetailSchema = remoteServerTargetSchema.extend({
  monitorSecret: z.string().nullable(),
})

export const remoteServerTargetCreatePayloadSchema = z.object({
  name: z.string().trim().min(1),
  baseUrl: z.string().trim().url(),
  description: z.string().trim().max(500).optional().nullable(),
  isActive: z.boolean().optional().default(true),
  monitorSecret: z.string().trim().optional(),
})

export const remoteServerTargetUpdatePayloadSchema = z.object({
  name: z.string().trim().min(1),
  baseUrl: z.string().trim().url(),
  description: z.string().trim().max(500).optional().nullable(),
  isActive: z.boolean().optional().default(true),
  monitorSecret: z.string().trim().optional(),
})

export const remoteServerGeneratedSecretResponseSchema = z.object({
  item: remoteServerTargetSchema,
  generatedSecret: z.string().min(1),
})

export const generatedMonitorSecretResponseSchema = z.object({
  generatedSecret: z.string().min(1),
  snapshot: runtimeSettingsSnapshotSchema,
})

export const remoteServerSnapshotSchema = z.object({
  status: z.literal("live"),
  generatedAt: z.string().min(1),
  appName: z.string().min(1),
  appVersion: z.string().nullable(),
  environment: z.string().min(1),
  appDomain: z.string().min(1),
  frontendDomain: z.string().min(1),
  appHttpPort: z.number().int().positive(),
  frontendHttpPort: z.number().int().positive(),
  databaseDriver: z.string().min(1),
  databaseName: z.string().nullable(),
  gitSyncEnabled: z.boolean(),
  gitBranch: z.string().nullable(),
  gitStatus: z.enum(["clean", "dirty"]).nullable(),
  canAutoUpdate: z.boolean(),
  hasRemoteUpdate: z.boolean(),
  latestUpdateMessage: z.string().nullable(),
  latestUpdateTimestamp: z.string().nullable(),
  healthUrl: z.string().url(),
  databaseReachable: z.boolean(),
})

export const remoteServerStatusStateSchema = z.enum([
  "live",
  "pending_secret",
  "unauthorized",
  "unreachable",
  "invalid_response",
])

export const remoteServerStatusItemSchema = z.object({
  target: remoteServerTargetSchema,
  status: remoteServerStatusStateSchema,
  checkedAt: z.string().min(1),
  latencyMs: z.number().int().nonnegative().nullable(),
  error: z.string().nullable(),
  snapshot: remoteServerSnapshotSchema.nullable(),
})

export const remoteServerStatusSummarySchema = z.object({
  total: z.number().int().nonnegative(),
  live: z.number().int().nonnegative(),
  pendingSecret: z.number().int().nonnegative(),
  unauthorized: z.number().int().nonnegative(),
  unreachable: z.number().int().nonnegative(),
  invalidResponse: z.number().int().nonnegative(),
})

export const remoteServerDashboardSchema = z.object({
  generatedAt: z.string().min(1),
  monitorConfigured: z.boolean(),
  items: z.array(remoteServerStatusItemSchema),
  summary: remoteServerStatusSummarySchema,
})

export type RemoteServerTarget = z.infer<typeof remoteServerTargetSchema>
export type RemoteServerTargetDetail = z.infer<typeof remoteServerTargetDetailSchema>
export type RemoteServerTargetCreatePayload = z.infer<
  typeof remoteServerTargetCreatePayloadSchema
>
export type RemoteServerTargetUpdatePayload = z.infer<
  typeof remoteServerTargetUpdatePayloadSchema
>
export type RemoteServerSnapshot = z.infer<typeof remoteServerSnapshotSchema>
export type RemoteServerStatusItem = z.infer<typeof remoteServerStatusItemSchema>
export type RemoteServerDashboard = z.infer<typeof remoteServerDashboardSchema>
export type RemoteServerGeneratedSecretResponse = z.infer<
  typeof remoteServerGeneratedSecretResponseSchema
>
export type GeneratedMonitorSecretResponse = z.infer<
  typeof generatedMonitorSecretResponseSchema
>
