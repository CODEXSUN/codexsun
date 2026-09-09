import type { PlatformModuleSchema } from '@codexsun/platform-core-api'
import { createHash } from 'node:crypto'
import { sql } from 'kysely'
import type { Database } from '../../database.js'

interface SchemaColumn {
  columnDefault: string | null
  columnKey: string
  columnName: string
  columnType: string
  extra: string
  isNullable: 'NO' | 'YES'
  ordinalPosition: number
  tableName: string
}

const expectedColumns: readonly SchemaColumn[] = [
  column('platform_module_migrations', 'module_id', 1, 'varchar(191)', 'NO', null, 'PRI'),
  column('platform_module_migrations', 'migration_id', 2, 'varchar(191)', 'NO', null, 'PRI'),
  column('platform_module_migrations', 'checksum', 3, 'varchar(128)', 'NO'),
  column('platform_module_migrations', 'module_version', 4, 'varchar(64)', 'NO'),
  column('platform_module_migrations', 'applied_at', 5, 'datetime(3)', 'NO'),
  column('platform_module_migrations', 'duration_ms', 6, 'int(11)', 'NO'),
  column('platform_module_seeds', 'module_id', 1, 'varchar(191)', 'NO', null, 'PRI'),
  column('platform_module_seeds', 'seed_id', 2, 'varchar(191)', 'NO', null, 'PRI'),
  column('platform_module_seeds', 'checksum', 3, 'varchar(128)', 'NO'),
  column('platform_module_seeds', 'module_version', 4, 'varchar(64)', 'NO'),
  column('platform_module_seeds', 'applied_at', 5, 'datetime(3)', 'NO'),
  column('platform_module_state', 'module_id', 1, 'varchar(191)', 'NO', null, 'PRI'),
  column('platform_module_state', 'kind', 2, 'varchar(32)', 'NO'),
  column('platform_module_state', 'installed_version', 3, 'varchar(64)', 'YES', 'NULL'),
  column('platform_module_state', 'requested_version', 4, 'varchar(64)', 'NO'),
  column('platform_module_state', 'manifest_checksum', 5, 'varchar(128)', 'NO'),
  column('platform_module_state', 'enabled', 6, 'int(11)', 'NO', '1'),
  column('platform_module_state', 'runtime_state', 7, 'varchar(32)', 'NO'),
  column('platform_module_state', 'schema_checksum', 8, 'varchar(128)', 'YES', 'NULL'),
  column('platform_module_state', 'last_failure_code', 9, 'varchar(128)', 'YES', 'NULL'),
  column('platform_module_state', 'last_failure_message', 10, 'varchar(512)', 'YES', 'NULL'),
  column('platform_module_state', 'updated_at', 11, 'datetime(3)', 'NO'),
]

export const moduleRuntimeSchema: PlatformModuleSchema<Database> = {
  checksum: hashColumns(expectedColumns),
  inspect: inspectModuleRuntimeSchema,
  version: '1.1.0',
}

async function inspectModuleRuntimeSchema(database: Database): Promise<string> {
  const result = await sql<SchemaColumn>`
    select
      table_name as tableName,
      column_name as columnName,
      ordinal_position as ordinalPosition,
      column_type as columnType,
      is_nullable as isNullable,
      column_default as columnDefault,
      column_key as columnKey,
      extra as extra
    from information_schema.columns
    where table_schema = database()
      and table_name in (
        'platform_module_migrations',
        'platform_module_seeds',
        'platform_module_state'
      )
    order by table_name, ordinal_position
  `.execute(database)
  return hashColumns(result.rows.map(normalizeColumn))
}

function column(
  tableName: string,
  columnName: string,
  ordinalPosition: number,
  columnType: string,
  isNullable: 'NO' | 'YES',
  columnDefault: string | null = null,
  columnKey = '',
): SchemaColumn {
  return {
    columnDefault,
    columnKey,
    columnName,
    columnType,
    extra: '',
    isNullable,
    ordinalPosition,
    tableName,
  }
}

function normalizeColumn(value: SchemaColumn): SchemaColumn {
  return {
    columnDefault: value.columnDefault === null ? null : String(value.columnDefault),
    columnKey: value.columnKey,
    columnName: value.columnName,
    columnType: value.columnType,
    extra: value.extra,
    isNullable: value.isNullable,
    ordinalPosition: Number(value.ordinalPosition),
    tableName: value.tableName,
  }
}

function hashColumns(columns: readonly SchemaColumn[]): string {
  return `sha256:${createHash('sha256').update(JSON.stringify(columns)).digest('hex')}`
}
