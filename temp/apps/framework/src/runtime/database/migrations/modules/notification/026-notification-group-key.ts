import { notificationTableNames } from '../../../table-names'
import type { Migration } from '../../migration'

export const notificationGroupKeyMigration: Migration = {
  id: '026-notification-group-key',
  name: 'Notification group key',
  async up({ db }) {
    await db.execute(`
      ALTER TABLE ${notificationTableNames.notifications}
      ADD COLUMN group_key VARCHAR(128) NULL AFTER dedupe_key
    `).catch((error: unknown) => {
      const message = error instanceof Error ? error.message.toLowerCase() : ''
      if (message.includes('duplicate column name')) {
        return
      }
      throw error
    })

    await db.execute(`
      CREATE INDEX idx_notifications_user_group_created
      ON ${notificationTableNames.notifications} (user_id, group_key, created_at)
    `).catch((error: unknown) => {
      const message = error instanceof Error ? error.message.toLowerCase() : ''
      if (message.includes('duplicate key name')) {
        return
      }
      throw error
    })
  },
}


