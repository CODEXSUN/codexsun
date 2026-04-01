import { z } from 'zod'

export const TaskGroupTypeEnum = z.enum([
  'sprint',
  'batch',
  'focus',
])

export const TaskGroupStatusEnum = z.enum([
  'active',
  'archived',
])

const trimmedNullableString = z.string().trim().nullish().transform((value) => value?.trim() || null)

export const taskGroupSummarySchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  type: TaskGroupTypeEnum,
  status: TaskGroupStatusEnum,
  createdBy: z.string().min(1),
  createdAt: z.string().min(1),
  updatedAt: z.string().min(1),
})

export const taskGroupSchema = taskGroupSummarySchema

export const taskGroupUpsertPayloadSchema = z.object({
  title: z.string().trim().min(3),
  type: TaskGroupTypeEnum.default('focus'),
  status: TaskGroupStatusEnum.default('active'),
  description: trimmedNullableString.optional(),
})

export const taskGroupListResponseSchema = z.object({
  items: z.array(taskGroupSummarySchema),
})

export const taskGroupResponseSchema = z.object({
  item: taskGroupSchema,
})

export type TaskGroupType = z.infer<typeof TaskGroupTypeEnum>
export type TaskGroupStatus = z.infer<typeof TaskGroupStatusEnum>
export type TaskGroupSummary = z.infer<typeof taskGroupSummarySchema>
export type TaskGroup = z.infer<typeof taskGroupSchema>
export type TaskGroupUpsertPayload = z.infer<typeof taskGroupUpsertPayloadSchema>
export type TaskGroupListResponse = z.infer<typeof taskGroupListResponseSchema>
export type TaskGroupResponse = z.infer<typeof taskGroupResponseSchema>
