import { z } from 'zod'

export const operationsSettingsSchema = z.strictObject({
  autoSweepWorktrees: z.boolean(),
  metricRetentionDays: z.number().int().min(1).max(365),
  worktreeRetentionDays: z.number().int().min(1).max(365),
})

export const connectedAppMetricSchema = z.strictObject({
  appId: z.string().trim().min(1).max(120),
  component: z.string().trim().min(1).max(120),
  labels: z.record(z.string(), z.string().max(500)).default({}),
  observedAt: z.iso.datetime(),
  status: z.enum(['degraded', 'offline', 'online']),
  values: z.record(z.string(), z.number().finite()).default({}),
})
