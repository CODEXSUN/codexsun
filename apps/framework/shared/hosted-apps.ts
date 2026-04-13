import { z } from "zod"

import { systemUpdateStatusSchema } from "./system-update.js"

export const hostedAppDockerStateSchema = z.enum([
  "running",
  "exited",
  "missing",
  "unknown",
])

export const hostedAppHealthStateSchema = z.enum([
  "live",
  "starting",
  "failed",
  "down",
  "unknown",
])

export const hostedAppSoftwareUpdateModeSchema = z.enum([
  "git_sync_update",
  "clean_rebuild",
])

export const hostedAppStatusItemSchema = z.object({
  clientId: z.string().min(1),
  displayName: z.string().min(1),
  containerName: z.string().min(1),
  configuredLocalDomain: z.string().min(1).nullable(),
  configuredCloudDomain: z.string().min(1).nullable(),
  configuredPublicPort: z.number().int().positive().nullable(),
  hostPort: z.number().int().positive().nullable(),
  dockerState: hostedAppDockerStateSchema,
  healthState: hostedAppHealthStateSchema,
  healthMessage: z.string().min(1).nullable(),
  running: z.boolean(),
  reachable: z.boolean(),
  startedAt: z.string().min(1).nullable(),
  image: z.string().min(1).nullable(),
  liveUrl: z.string().min(1).nullable(),
})

export const hostedAppsStatusSummarySchema = z.object({
  total: z.number().int().nonnegative(),
  running: z.number().int().nonnegative(),
  live: z.number().int().nonnegative(),
  starting: z.number().int().nonnegative(),
  failed: z.number().int().nonnegative(),
  down: z.number().int().nonnegative(),
  missing: z.number().int().nonnegative(),
})

export const hostedAppsStatusResponseSchema = z.object({
  generatedAt: z.string().min(1),
  dockerAvailable: z.boolean(),
  issues: z.array(z.string()),
  softwareUpdateMode: hostedAppSoftwareUpdateModeSchema,
  items: z.array(hostedAppStatusItemSchema),
  summary: hostedAppsStatusSummarySchema,
})

export const hostedAppsSoftwareUpdateResponseSchema = z.object({
  mode: hostedAppSoftwareUpdateModeSchema,
  restartScheduled: z.boolean(),
  message: z.string().min(1),
  currentCommit: z.string().min(1).nullable(),
  previousCommit: z.string().min(1).nullable(),
  clearedPaths: z.array(z.string()),
  rootPath: z.string().min(1).nullable(),
  status: systemUpdateStatusSchema.nullable(),
})

export type HostedAppStatusItem = z.infer<typeof hostedAppStatusItemSchema>
export type HostedAppsStatusSummary = z.infer<typeof hostedAppsStatusSummarySchema>
export type HostedAppsStatusResponse = z.infer<typeof hostedAppsStatusResponseSchema>
export type HostedAppsSoftwareUpdateResponse = z.infer<
  typeof hostedAppsSoftwareUpdateResponseSchema
>
export type HostedAppSoftwareUpdateMode = z.infer<
  typeof hostedAppSoftwareUpdateModeSchema
>
