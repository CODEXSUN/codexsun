import { notificationFoundationMigration } from './025-notification-foundation'
import { notificationGroupKeyMigration } from './026-notification-group-key'
import { defineMigrationModule } from '../../migration'

export const notificationMigrationModule = defineMigrationModule('notification', 'Notification', [
  notificationFoundationMigration,
  notificationGroupKeyMigration,
])

