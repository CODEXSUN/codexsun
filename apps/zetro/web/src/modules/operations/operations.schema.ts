import { z } from 'zod'

export const operationsSettingsSchema = z.object({
  autoSweepWorktrees: z.boolean(),
  metricRetentionDays: z.number(),
  worktreeRetentionDays: z.number(),
})
export const operationsSettingsResponseSchema = z.object({ settings: operationsSettingsSchema })
export const worktreeSchema = z.object({
  conversationId: z.string(),
  dirty: z.boolean(),
  modifiedAt: z.string(),
  path: z.string(),
  projectId: z.string().nullable(),
  sizeBytes: z.number(),
})
export const worktreeListSchema = z.object({ worktrees: z.array(worktreeSchema) })
export const metricsSchema = z.object({
  api: z.object({ heapBytes: z.number(), residentBytes: z.number(), uptimeSeconds: z.number() }),
  codex: z.string(),
  connectedApps: z.array(
    z.object({
      appId: z.string(),
      component: z.string(),
      observedAt: z.string(),
      status: z.string(),
      values: z.record(z.string(), z.number()),
    }),
  ),
  database: z.enum(['mariadb', 'sqlite']),
  disk: z.object({ freeBytes: z.number(), totalBytes: z.number() }),
  generatedAt: z.string(),
  host: z.object({
    cpuCount: z.number(),
    freeMemoryBytes: z.number(),
    loadAverage: z.array(z.number()),
    totalMemoryBytes: z.number(),
  }),
  systemTasks: z.record(z.string(), z.number()),
  worktrees: z.object({ count: z.number(), dirty: z.number(), sizeBytes: z.number() }),
})
