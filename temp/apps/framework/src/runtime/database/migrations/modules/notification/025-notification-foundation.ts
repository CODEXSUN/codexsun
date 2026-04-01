import { authTableNames, notificationTableNames } from '../../../table-names'
import type { Migration } from '../../migration'

export const notificationFoundationMigration: Migration = {
  id: '025-notification-foundation',
  name: 'Notification foundation',
  async up({ db }) {
    await db.execute(`
      CREATE TABLE IF NOT EXISTS ${notificationTableNames.notifications} (
        id VARCHAR(64) PRIMARY KEY,
        user_id VARCHAR(64) NOT NULL,
        type VARCHAR(64) NOT NULL,
        title VARCHAR(255) NOT NULL,
        message TEXT NOT NULL,
        entity_type VARCHAR(32) NULL,
        entity_id VARCHAR(64) NULL,
        task_id VARCHAR(64) NULL,
        dedupe_key VARCHAR(255) NOT NULL,
        group_key VARCHAR(128) NULL,
        is_read TINYINT(1) NOT NULL DEFAULT 0,
        read_at DATETIME NULL,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT fk_notifications_user FOREIGN KEY (user_id) REFERENCES ${authTableNames.users}(id) ON DELETE CASCADE,
        UNIQUE KEY uq_notifications_dedupe (dedupe_key),
        INDEX idx_notifications_user_created (user_id, created_at),
        INDEX idx_notifications_user_read (user_id, is_read),
        INDEX idx_notifications_user_group_created (user_id, group_key, created_at)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `)
  },
}


