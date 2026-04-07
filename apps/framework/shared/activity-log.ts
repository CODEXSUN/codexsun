import { z } from "zod"

export const activityLogLevelSchema = z.enum(["info", "warn", "error"])

export const activityLogItemSchema = z.object({
  id: z.string().min(1),
  category: z.string().min(1),
  action: z.string().min(1),
  level: activityLogLevelSchema,
  message: z.string().min(1),
  actorId: z.string().nullable(),
  actorEmail: z.string().nullable(),
  actorType: z.string().nullable(),
  requestId: z.string().nullable(),
  routePath: z.string().nullable(),
  context: z.record(z.string(), z.unknown()).nullable(),
  createdAt: z.string().min(1),
})

export const activityLogListResponseSchema = z.object({
  items: z.array(activityLogItemSchema),
})

export const activityLogWritePayloadSchema = z.object({
  category: z.string().min(1),
  action: z.string().min(1),
  level: activityLogLevelSchema.default("info"),
  message: z.string().min(1),
  actorId: z.string().min(1).nullable().optional(),
  actorEmail: z.string().min(1).nullable().optional(),
  actorType: z.string().min(1).nullable().optional(),
  requestId: z.string().min(1).nullable().optional(),
  routePath: z.string().min(1).nullable().optional(),
  context: z.record(z.string(), z.unknown()).nullable().optional(),
})

export const activityLogWriteResponseSchema = z.object({
  item: activityLogItemSchema,
})

export type ActivityLogLevel = z.infer<typeof activityLogLevelSchema>
export type ActivityLogItem = z.infer<typeof activityLogItemSchema>
export type ActivityLogListResponse = z.infer<typeof activityLogListResponseSchema>
export type ActivityLogWritePayload = z.infer<typeof activityLogWritePayloadSchema>
export type ActivityLogWriteResponse = z.infer<typeof activityLogWriteResponseSchema>
