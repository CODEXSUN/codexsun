import { z } from 'zod'

const taskSchema = z.strictObject({
  createdAt: z.string(),
  description: z.string(),
  id: z.string().uuid(),
  priority: z.enum(['low', 'medium', 'high']),
  status: z.enum(['todo', 'in_progress', 'done']),
  title: z.string().min(1),
  updatedAt: z.string(),
})

export const taskListResponseSchema = z.strictObject({ tasks: z.array(taskSchema) })
export const taskResponseSchema = z.strictObject({ task: taskSchema })
