import { z } from 'zod'

export const serviceKindSchema = z.enum(['api', 'web', 'worker'])
export const serviceStateSchema = z.enum(['online', 'degraded', 'offline'])
export const serviceActionSchema = z.enum(['start', 'stop'])

export const serviceSnapshotSchema = z.object({
  applicationId: z.string().min(1),
  checkedAt: z.iso.datetime(),
  controllable: z.boolean(),
  cpuSeconds: z.number().nonnegative().nullable(),
  healthUrl: z.url(),
  healthy: z.boolean(),
  id: z.string().min(1),
  kind: serviceKindSchema,
  latencyMs: z.number().int().nonnegative().nullable(),
  logsAvailable: z.boolean(),
  memoryBytes: z.number().int().nonnegative().nullable(),
  pid: z.number().int().positive().nullable(),
  port: z.number().int().min(6000).max(6999),
  protected: z.boolean(),
  state: serviceStateSchema,
  uptimeSeconds: z.number().int().nonnegative().nullable(),
})

export const orchestrationSummarySchema = z.object({
  degraded: z.number().int().nonnegative(),
  offline: z.number().int().nonnegative(),
  online: z.number().int().nonnegative(),
  total: z.number().int().nonnegative(),
})

export const orchestrationOverviewSchema = z.object({
  checkedAt: z.iso.datetime(),
  services: z.array(serviceSnapshotSchema),
  summary: orchestrationSummarySchema,
})

export const serviceActionRequestSchema = z.strictObject({
  action: serviceActionSchema,
})

export const serviceActionResponseSchema = z.object({
  message: z.string().min(1),
  service: serviceSnapshotSchema,
})

export const serviceLogsResponseSchema = z.object({
  lines: z.array(z.string()),
  serviceId: z.string().min(1),
  updatedAt: z.iso.datetime(),
})

export const orchestrationErrorSchema = z.object({
  error: z.object({
    code: z.string().min(1),
    message: z.string().min(1),
  }),
})

export type OrchestrationOverview = z.infer<typeof orchestrationOverviewSchema>
export type ServiceAction = z.infer<typeof serviceActionSchema>
export type ServiceActionResponse = z.infer<typeof serviceActionResponseSchema>
export type ServiceLogsResponse = z.infer<typeof serviceLogsResponseSchema>
export type ServiceSnapshot = z.infer<typeof serviceSnapshotSchema>
