import { z } from 'zod'

export const taskSchema = z.strictObject({
  archived: z.boolean(),
  createdAt: z.iso.datetime(),
  description: z.string(),
  id: z.uuid(),
  priority: z.enum(['high', 'low', 'medium']),
  projectId: z.uuid(),
  pinned: z.boolean(),
  parentTaskId: z.uuid().nullable(),
  planningKind: z.enum(['task', 'phase', 'subtask']),
  status: z.enum(['done', 'in_progress', 'todo']),
  title: z.string().min(1),
  updatedAt: z.iso.datetime(),
  workflow: z.enum(['review']).nullable(),
})

export const taskListResponseSchema = z.strictObject({ tasks: z.array(taskSchema) })
export const taskResponseSchema = z.strictObject({ task: taskSchema })
