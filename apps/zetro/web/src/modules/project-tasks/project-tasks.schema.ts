import { z } from 'zod'

const taskScopeSchema = z.strictObject({
  application: z.string().min(1),
  documentationPaths: z.array(z.string().min(1)).optional(),
  folderPath: z.string().min(1),
  module: z.string(),
})
const taskPlanSchema = z.strictObject({
  acceptanceCriteria: z.array(z.string().min(1)).min(1),
  checks: z.array(z.string().min(1)).min(1),
  scope: taskScopeSchema,
  sourceConversationId: z.uuid().nullable(),
})

export const taskSchema = z.strictObject({
  archived: z.boolean(),
  createdAt: z.iso.datetime(),
  description: z.string(),
  executionAttempt: z
    .strictObject({ startedAt: z.iso.datetime(), systemTaskId: z.uuid() })
    .nullable(),
  id: z.uuid(),
  priority: z.enum(['high', 'low', 'medium']),
  projectId: z.uuid(),
  pinned: z.boolean(),
  parentTaskId: z.uuid().nullable(),
  planningKind: z.enum(['task', 'phase', 'subtask']),
  plan: taskPlanSchema.nullable(),
  status: z.enum(['done', 'in_progress', 'todo']),
  title: z.string().min(1),
  updatedAt: z.iso.datetime(),
  workflow: z.enum(['review']).nullable(),
})

export const taskListResponseSchema = z.strictObject({ tasks: z.array(taskSchema) })
export const taskResponseSchema = z.strictObject({ task: taskSchema })
