import { mailboxFoundationMigration } from './013-mailbox-foundation'
import { defineMigrationModule } from '../../migration'

export const mailboxMigrationModule = defineMigrationModule('mailbox', 'Mailbox', [
  mailboxFoundationMigration,
])

