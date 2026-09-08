import { z } from 'zod'

export const createTaskSchema = z.strictObject({
  description: z.string().trim().max(2_000).default(''),
  priority: z.enum(['low', 'medium', 'high']).default('medium'),
  projectId: z.string().uuid(),
  title: z.string().trim().min(1).max(160),
})

export const updateTaskSchema = z
  .strictObject({
    archived: z.boolean().optional(),
    description: z.string().trim().max(2_000).optional(),
    priority: z.enum(['low', 'medium', 'high']).optional(),
    pinned: z.boolean().optional(),
    status: z.enum(['todo', 'in_progress', 'done']).optional(),
    title: z.string().trim().min(1).max(160).optional(),
  })
  .refine((value) => Object.keys(value).length > 0, 'Provide at least one task change.')

export const taskParametersSchema = z.strictObject({
  taskId: z.string().uuid(),
})

export const taskListQuerySchema = z.strictObject({
  archived: z
    .enum(['false', 'true'])
    .default('false')
    .transform((value) => value === 'true'),
  projectId: z.string().uuid(),
})
