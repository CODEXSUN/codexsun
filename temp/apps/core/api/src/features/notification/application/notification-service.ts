import type {
  NotificationListResponse,
  NotificationResponse,
  NotificationType,
} from '@shared/index'
import {
  notificationListResponseSchema,
  notificationResponseSchema,
} from '@shared/index'
import { ApplicationError } from '@framework-core/runtime/errors/application-error'
import type { NotificationRepository } from '../data/notification-repository'

interface PersistenceError {
  sqlMessage?: string
  message?: string
}

function createUniqueDedupeKey(type: NotificationType, taskId: string | null, userId: string) {
  return `${type}:${taskId ?? 'none'}:${userId}:${Date.now()}`
}

export class NotificationService {
  constructor(private readonly repository: NotificationRepository) {}

  async listForUser(userId: string) {
    const result = await this.repository.listForUser(userId)
    return notificationListResponseSchema.parse(result satisfies NotificationListResponse)
  }

  async createNotification(input: {
    userId: string
    type: NotificationType
    title: string
    message: string
    entityType: 'general' | 'product' | 'invoice' | 'order' | 'customer' | 'user' | null
    entityId?: string | null
    taskId?: string | null
    dedupeKey?: string | null
  }) {
    try {
      const item = await this.repository.create({
        userId: input.userId,
        type: input.type,
        title: input.title,
        message: input.message,
        entityType: input.entityType,
        entityId: input.entityId ?? null,
        taskId: input.taskId ?? null,
        dedupeKey: input.dedupeKey?.trim() || createUniqueDedupeKey(input.type, input.taskId ?? null, input.userId),
        groupKey: `${input.type}:${input.userId}`,
      })
      if (!item) {
        throw new ApplicationError('Expected notification to be retrievable after creation.', {}, 500)
      }
      return notificationResponseSchema.parse({ item } satisfies NotificationResponse)
    } catch (error) {
      const detail = error instanceof Error ? error.message.toLowerCase() : ''
      if (detail.includes('duplicate') || detail.includes('uq_notifications_dedupe')) {
        return null
      }
      this.throwPersistenceError(error, 'create')
    }
  }

  async markRead(userId: string, notificationId: string) {
    await this.repository.markRead(userId, notificationId)
    return this.listForUser(userId)
  }

  async markAllRead(userId: string) {
    await this.repository.markAllRead(userId)
    return this.listForUser(userId)
  }

  async markReadByTask(userId: string, taskId: string) {
    await this.repository.markReadByTask(userId, taskId)
    return this.listForUser(userId)
  }

  private throwPersistenceError(error: unknown, action: 'create' | 'update'): never {
    if (error instanceof ApplicationError) {
      throw error
    }

    const persistenceError = error as PersistenceError
    throw new ApplicationError(
      'Failed to persist notification data.',
      { action, detail: persistenceError.sqlMessage ?? persistenceError.message ?? 'unknown persistence error' },
      500,
    )
  }
}
