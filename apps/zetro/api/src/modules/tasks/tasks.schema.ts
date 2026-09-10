import { z } from 'zod'

const taskScopeSchema = z.strictObject({
  application: z.string().trim().min(1).max(80),
  documentationPaths: z.array(z.string().trim().min(1).max(1_024)).max(8).optional(),
  folderPath: z.string().trim().min(1).max(1_024),
  module: z.string().trim().max(120),
})

const taskExecutionPlanSchema = z.strictObject({
  acceptanceCriteria: z.array(z.string().trim().min(1).max(500)).min(1).max(20),
  checks: z.array(z.string().trim().min(1).max(200)).min(1).max(20),
  scope: taskScopeSchema,
  sourceConversationId: z.string().uuid().nullable(),
})

export const createTaskSchema = z.strictObject({
  description: z.string().trim().max(2_000).default(''),
  priority: z.enum(['low', 'medium', 'high']).default('medium'),
  projectId: z.string().uuid(),
  parentTaskId: z.string().uuid().nullable().optional(),
  planningKind: z.enum(['task', 'phase', 'subtask']).default('task'),
  plan: taskExecutionPlanSchema.nullable().optional(),
  title: z.string().trim().min(1).max(160),
})

export const updateTaskSchema = z
  .strictObject({
    archived: z.boolean().optional(),
    description: z.string().trim().max(2_000).optional(),
    priority: z.enum(['low', 'medium', 'high']).optional(),
    pinned: z.boolean().optional(),
    plan: taskExecutionPlanSchema.nullable().optional(),
    status: z.enum(['todo', 'in_progress', 'done']).optional(),
    title: z.string().trim().min(1).max(160).optional(),
    workflow: z.enum(['review']).nullable().optional(),
  })
  .refine((value) => Object.keys(value).length > 0, 'Provide at least one task change.')

export const taskParametersSchema = z.strictObject({
  taskId: z.string().uuid(),
})

export const startTaskSchema = z.strictObject({ approved: z.literal(true) })

export const taskListQuerySchema = z.strictObject({
  archived: z
    .enum(['false', 'true'])
    .default('false')
    .transform((value) => value === 'true'),
  projectId: z.string().uuid(),
})
