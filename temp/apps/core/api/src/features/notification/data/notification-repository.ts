import type { Notification, NotificationType } from '@shared/index'
import type { RowDataPacket } from 'mysql2'
import { randomUUID } from 'node:crypto'
import { ensureDatabaseSchema } from '@framework-core/runtime/database/database'
import { db } from '@framework-core/runtime/database/orm'
import { notificationTableNames } from '@framework-core/runtime/database/table-names'

interface NotificationRow extends RowDataPacket {
  id: string
  user_id: string
  type: NotificationType
  title: string
  message: string
  entity_type: Notification['entityType']
  entity_id: string | null
  task_id: string | null
  dedupe_key: string
  group_key: string | null
  is_read: number
  created_at: Date
  read_at: Date | null
}

function toTimestamp(value: Date) {
  return value.toISOString()
}

function toNotification(row: NotificationRow): Notification {
  return {
    id: row.id,
    userId: row.user_id,
    type: row.type,
    title: row.title,
    message: row.message,
    entityType: row.entity_type,
    entityId: row.entity_id,
    taskId: row.task_id,
    dedupeKey: row.dedupe_key,
    groupKey: row.group_key,
    isRead: Boolean(row.is_read),
    createdAt: toTimestamp(row.created_at),
    readAt: row.read_at ? toTimestamp(row.read_at) : null,
  }
}

export class NotificationRepository {
  async listForUser(userId: string) {
    await ensureDatabaseSchema()

    const rows = await db.query<NotificationRow>(
      `
        SELECT
          id,
          user_id,
          type,
          title,
          message,
          entity_type,
          entity_id,
          task_id,
          dedupe_key,
          group_key,
          is_read,
          created_at,
          read_at
        FROM ${notificationTableNames.notifications}
        WHERE user_id = ?
        ORDER BY
          CASE type
            WHEN 'task_overdue' THEN 1
            WHEN 'task_due_soon' THEN 2
            WHEN 'task_assigned' THEN 3
            WHEN 'task_review_requested' THEN 4
            ELSE 99
          END ASC,
          created_at DESC
        LIMIT 25
      `,
      [userId],
    )

    const unreadRow = await db.first<{ unread_count: number } & RowDataPacket>(
      `
        SELECT COUNT(*) AS unread_count
        FROM ${notificationTableNames.notifications}
        WHERE user_id = ? AND is_read = 0
      `,
      [userId],
    )

    return {
      items: rows.map(toNotification),
      unreadCount: Number(unreadRow?.unread_count ?? 0),
    }
  }

  async create(input: {
    userId: string
    type: NotificationType
    title: string
    message: string
    entityType: Notification['entityType']
    entityId: string | null
    taskId: string | null
    dedupeKey: string
    groupKey: string | null
  }) {
    await ensureDatabaseSchema()
    const notificationId = randomUUID()

    await db.execute(
      `
        INSERT INTO ${notificationTableNames.notifications} (
          id,
          user_id,
          type,
          title,
          message,
          entity_type,
          entity_id,
          task_id,
          dedupe_key,
          group_key
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
      [
        notificationId,
        input.userId,
        input.type,
        input.title,
        input.message,
        input.entityType,
        input.entityId,
        input.taskId,
        input.dedupeKey,
        input.groupKey,
      ],
    )

    const row = await db.first<NotificationRow>(
      `
        SELECT
          id,
          user_id,
          type,
          title,
          message,
          entity_type,
          entity_id,
          task_id,
          dedupe_key,
          group_key,
          is_read,
          created_at,
          read_at
        FROM ${notificationTableNames.notifications}
        WHERE id = ?
        LIMIT 1
      `,
      [notificationId],
    )

    return row ? toNotification(row) : null
  }

  async markRead(userId: string, notificationId: string) {
    await ensureDatabaseSchema()

    await db.execute(
      `
        UPDATE ${notificationTableNames.notifications}
        SET is_read = 1, read_at = CURRENT_TIMESTAMP
        WHERE id = ? AND user_id = ?
      `,
      [notificationId, userId],
    )
  }

  async markAllRead(userId: string) {
    await ensureDatabaseSchema()

    await db.execute(
      `
        UPDATE ${notificationTableNames.notifications}
        SET is_read = 1, read_at = CURRENT_TIMESTAMP
        WHERE user_id = ? AND is_read = 0
      `,
      [userId],
    )
  }

  async markReadByTask(userId: string, taskId: string) {
    await ensureDatabaseSchema()

    await db.execute(
      `
        UPDATE ${notificationTableNames.notifications}
        SET is_read = 1, read_at = CURRENT_TIMESTAMP
        WHERE user_id = ? AND task_id = ? AND is_read = 0
      `,
      [userId, taskId],
    )
  }
}
