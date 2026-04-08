import { z } from "zod"

export const runtimeJobStatusSchema = z.enum(["queued", "running", "completed", "failed"])

export const runtimeJobDashboardItemSchema = z.object({
  id: z.string().min(1),
  queueName: z.string().min(1),
  handlerKey: z.string().min(1),
  appId: z.string().min(1),
  moduleKey: z.string().min(1),
  dedupeKey: z.string().nullable(),
  payload: z.unknown(),
  status: runtimeJobStatusSchema,
  attempts: z.number().int().nonnegative(),
  maxAttempts: z.number().int().positive(),
  scheduledAt: z.string().min(1),
  availableAt: z.string().min(1),
  startedAt: z.string().nullable(),
  completedAt: z.string().nullable(),
  failedAt: z.string().nullable(),
  lockedBy: z.string().nullable(),
  lockedAt: z.string().nullable(),
  lastError: z.string().nullable(),
  resultSummary: z.string().nullable(),
  createdAt: z.string().min(1),
  updatedAt: z.string().min(1),
})

export const runtimeJobDashboardSummarySchema = z.object({
  total: z.number().int().nonnegative(),
  queued: z.number().int().nonnegative(),
  running: z.number().int().nonnegative(),
  completed: z.number().int().nonnegative(),
  failed: z.number().int().nonnegative(),
  readyNow: z.number().int().nonnegative(),
})

export const runtimeJobDashboardSchema = z.object({
  generatedAt: z.string().min(1),
  summary: runtimeJobDashboardSummarySchema,
  items: z.array(runtimeJobDashboardItemSchema),
})

export type RuntimeJobStatus = z.infer<typeof runtimeJobStatusSchema>
export type RuntimeJobDashboardItem = z.infer<typeof runtimeJobDashboardItemSchema>
export type RuntimeJobDashboardSummary = z.infer<typeof runtimeJobDashboardSummarySchema>
export type RuntimeJobDashboard = z.infer<typeof runtimeJobDashboardSchema>
