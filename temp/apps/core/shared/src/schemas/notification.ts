import { z } from 'zod'
import { TaskScopeTypeEnum } from './task'

export const NotificationTypeEnum = z.enum([
  'task_assigned',
  'task_review_requested',
  'task_due_soon',
  'task_overdue',
])

export const notificationSchema = z.object({
  id: z.string().min(1),
  userId: z.string().min(1),
  type: NotificationTypeEnum,
  title: z.string().min(1),
  message: z.string().min(1),
  entityType: TaskScopeTypeEnum.nullable(),
  entityId: z.string().nullable(),
  taskId: z.string().nullable(),
  dedupeKey: z.string().min(1),
  groupKey: z.string().nullable(),
  isRead: z.boolean(),
  createdAt: z.string().min(1),
  readAt: z.string().nullable(),
})

export const notificationListResponseSchema = z.object({
  items: z.array(notificationSchema),
  unreadCount: z.number().int().nonnegative(),
})

export const notificationResponseSchema = z.object({
  item: notificationSchema,
})

export type NotificationType = z.infer<typeof NotificationTypeEnum>
export type Notification = z.infer<typeof notificationSchema>
export type NotificationListResponse = z.infer<typeof notificationListResponseSchema>
export type NotificationResponse = z.infer<typeof notificationResponseSchema>
