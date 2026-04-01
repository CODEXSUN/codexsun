import { z } from 'zod'
import { TaskScopeTypeEnum } from './task'

export const MilestoneStatusEnum = z.enum([
  'active',
  'completed',
  'archived',
])

const trimmedNullableString = z.string().trim().nullish().transform((value) => value?.trim() || null)

export const milestoneTaskStatsSchema = z.object({
  totalTasks: z.number().int().nonnegative(),
  pending: z.number().int().nonnegative(),
  inProgress: z.number().int().nonnegative(),
  review: z.number().int().nonnegative(),
  finalized: z.number().int().nonnegative(),
  overdue: z.number().int().nonnegative(),
})

export const milestoneSummarySchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  description: z.string().nullable(),
  entityType: TaskScopeTypeEnum.nullable(),
  entityId: z.string().nullable(),
  status: MilestoneStatusEnum,
  dueDate: z.string().nullable(),
  createdBy: z.string().min(1),
  createdAt: z.string().min(1),
  updatedAt: z.string().min(1),
  taskStats: milestoneTaskStatsSchema,
})

export const milestoneSchema = milestoneSummarySchema

export const milestoneUpsertPayloadSchema = z.object({
  title: z.string().trim().min(3),
  description: trimmedNullableString,
  entityType: TaskScopeTypeEnum.nullable().optional().default(null),
  entityId: trimmedNullableString,
  status: MilestoneStatusEnum.default('active'),
  dueDate: trimmedNullableString,
})

export const milestoneListResponseSchema = z.object({
  items: z.array(milestoneSummarySchema),
})

export const milestoneResponseSchema = z.object({
  item: milestoneSchema,
})

export type MilestoneStatus = z.infer<typeof MilestoneStatusEnum>
export type MilestoneTaskStats = z.infer<typeof milestoneTaskStatsSchema>
export type MilestoneSummary = z.infer<typeof milestoneSummarySchema>
export type Milestone = z.infer<typeof milestoneSchema>
export type MilestoneUpsertPayload = z.infer<typeof milestoneUpsertPayloadSchema>
export type MilestoneListResponse = z.infer<typeof milestoneListResponseSchema>
export type MilestoneResponse = z.infer<typeof milestoneResponseSchema>
