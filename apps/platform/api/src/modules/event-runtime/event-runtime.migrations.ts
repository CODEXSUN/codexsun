import type { PlatformModuleMigration } from '@codexsun/platform-core-api'
import type { Database } from '../../database.js'

export const eventRuntimeMigrations: readonly PlatformModuleMigration<Database>[] = [
  {
    checksum: 'sha256:7f0a229f40f7e2b9e84d9901718b41fbd46116611223d5670dfa3d39e7f2a8cb',
    id: '0001-event-runtime-schema',
    version: '1.0.0',
    async up(database) {
      await database.schema
        .createTable('platform_event_outbox')
        .ifNotExists()
        .addColumn('event_id', 'varchar(191)', (column) => column.primaryKey())
        .addColumn('event_type', 'varchar(191)', (column) => column.notNull())
        .addColumn('event_version', 'varchar(64)', (column) => column.notNull())
        .addColumn('publisher_id', 'varchar(191)', (column) => column.notNull())
        .addColumn('correlation_id', 'varchar(191)')
        .addColumn('payload_json', 'text', (column) => column.notNull())
        .addColumn('occurred_at', 'datetime(3)', (column) => column.notNull())
        .addIndex('idx_platform_event_outbox_type', ['event_type', 'occurred_at'])
        .execute()

      await database.schema
        .createTable('platform_event_inbox')
        .ifNotExists()
        .addColumn('consumer_id', 'varchar(191)', (column) => column.notNull())
        .addColumn('event_id', 'varchar(191)', (column) => column.notNull())
        .addColumn('state', 'varchar(16)', (column) => column.notNull())
        .addColumn('attempts', 'integer', (column) => column.notNull().defaultTo(0))
        .addColumn('next_attempt_at', 'datetime(3)')
        .addColumn('lease_expires_at', 'datetime(3)')
        .addColumn('last_failure', 'varchar(512)')
        .addColumn('processed_at', 'datetime(3)')
        .addColumn('updated_at', 'datetime(3)', (column) => column.notNull())
        .addPrimaryKeyConstraint('pk_platform_event_inbox', ['consumer_id', 'event_id'])
        .addIndex('idx_platform_event_inbox_claim', ['consumer_id', 'state', 'next_attempt_at'])
        .execute()
    },
  },
]
