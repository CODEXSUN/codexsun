import type { PlatformModuleMigration } from '@codexsun/platform-core-api'
import { sql } from 'kysely'
import type { Database } from '../../database.js'

export const moduleRuntimeMigrations: readonly PlatformModuleMigration<Database>[] = [
  {
    checksum: 'sha256:8c4ded3da35ac589f8e3fed6b72172293d33eb81a52cb89d05619625cd87871f',
    id: '0001-module-runtime-schema',
    version: '1.0.0',
    async up(database) {
      await database.schema
        .createTable('platform_module_state')
        .ifNotExists()
        .addColumn('module_id', 'varchar(191)', (column) => column.primaryKey())
        .addColumn('kind', 'varchar(32)', (column) => column.notNull())
        .addColumn('installed_version', 'varchar(64)')
        .addColumn('requested_version', 'varchar(64)', (column) => column.notNull())
        .addColumn('manifest_checksum', 'varchar(128)', (column) => column.notNull())
        .addColumn('enabled', 'integer', (column) => column.notNull().defaultTo(1))
        .addColumn('runtime_state', 'varchar(32)', (column) => column.notNull())
        .addColumn('last_failure_code', 'varchar(128)')
        .addColumn('last_failure_message', 'varchar(512)')
        .addColumn('updated_at', 'datetime(3)', (column) => column.notNull())
        .execute()

      await database.schema
        .createTable('platform_module_migrations')
        .ifNotExists()
        .addColumn('module_id', 'varchar(191)', (column) => column.notNull())
        .addColumn('migration_id', 'varchar(191)', (column) => column.notNull())
        .addColumn('checksum', 'varchar(128)', (column) => column.notNull())
        .addColumn('module_version', 'varchar(64)', (column) => column.notNull())
        .addColumn('applied_at', 'datetime(3)', (column) => column.notNull())
        .addColumn('duration_ms', 'integer', (column) => column.notNull())
        .addPrimaryKeyConstraint('pk_platform_module_migrations', ['module_id', 'migration_id'])
        .execute()

      await database.schema
        .createTable('platform_module_seeds')
        .ifNotExists()
        .addColumn('module_id', 'varchar(191)', (column) => column.notNull())
        .addColumn('seed_id', 'varchar(191)', (column) => column.notNull())
        .addColumn('checksum', 'varchar(128)', (column) => column.notNull())
        .addColumn('module_version', 'varchar(64)', (column) => column.notNull())
        .addColumn('applied_at', 'datetime(3)', (column) => column.notNull())
        .addPrimaryKeyConstraint('pk_platform_module_seeds', ['module_id', 'seed_id'])
        .execute()
    },
  },
  {
    checksum: 'sha256:b4716a0a7c8618c39739369f5d37623e17d9f2f15ab7f417a570ebfc41aaeaec',
    id: '0002-module-schema-checksum',
    version: '1.1.0',
    async up(database) {
      await sql`
        alter table platform_module_state
        add column if not exists schema_checksum varchar(128) null after runtime_state
      `.execute(database)
    },
  },
]
