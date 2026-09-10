import { z } from 'zod'

const statusSchema = z.enum([
  'blocked',
  'completed',
  'failed',
  'pending',
  'running',
  'stopped',
  'stopping',
])
const taskSchema = z.object({
  input: z.unknown().optional(),
  attempts: z.number(),
  completedAt: z.string().nullable(),
  createdAt: z.string(),
  error: z.string().nullable(),
  id: z.string(),
  maxAttempts: z.number(),
  projectId: z.string().nullable(),
  recoveryCount: z.number(),
  result: z.unknown(),
  startedAt: z.string().nullable(),
  status: statusSchema,
  title: z.string(),
  type: z.string(),
  updatedAt: z.string(),
})
const stepSchema = z.object({
  completedAt: z.string(),
  id: z.string(),
  message: z.string(),
  status: z.enum(['completed', 'failed', 'info', 'skipped']),
  taskId: z.string(),
})
export const taskListSchema = z.object({ tasks: z.array(taskSchema) })
export const taskResponseSchema = z.object({
  task: taskSchema.extend({ steps: z.array(stepSchema).optional() }),
})
