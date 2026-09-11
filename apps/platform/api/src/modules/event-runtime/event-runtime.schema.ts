import { createHash } from 'node:crypto'
import { sql } from 'kysely'
import type { PlatformModuleSchema } from '@codexsun/platform-core-api'
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

const columns: readonly SchemaColumn[] = [
  column('platform_event_inbox', 'consumer_id', 1, 'varchar(191)', 'NO', null, 'PRI'),
  column('platform_event_inbox', 'event_id', 2, 'varchar(191)', 'NO', null, 'PRI'),
  column('platform_event_inbox', 'state', 3, 'varchar(16)', 'NO'),
  column('platform_event_inbox', 'attempts', 4, 'int(11)', 'NO', '0'),
  column('platform_event_inbox', 'next_attempt_at', 5, 'datetime(3)', 'YES', 'NULL'),
  column('platform_event_inbox', 'lease_expires_at', 6, 'datetime(3)', 'YES', 'NULL'),
  column('platform_event_inbox', 'last_failure', 7, 'varchar(512)', 'YES', 'NULL'),
  column('platform_event_inbox', 'processed_at', 8, 'datetime(3)', 'YES', 'NULL'),
  column('platform_event_inbox', 'updated_at', 9, 'datetime(3)', 'NO'),
  column('platform_event_outbox', 'event_id', 1, 'varchar(191)', 'NO', null, 'PRI'),
  column('platform_event_outbox', 'event_type', 2, 'varchar(191)', 'NO', null, 'MUL'),
  column('platform_event_outbox', 'event_version', 3, 'varchar(64)', 'NO'),
  column('platform_event_outbox', 'publisher_id', 4, 'varchar(191)', 'NO'),
  column('platform_event_outbox', 'correlation_id', 5, 'varchar(191)', 'YES', 'NULL'),
  column('platform_event_outbox', 'payload_json', 6, 'text', 'NO'),
  column('platform_event_outbox', 'occurred_at', 7, 'datetime(3)', 'NO'),
]

export const eventRuntimeSchema: PlatformModuleSchema<Database> = {
  checksum: hashColumns(columns),
  inspect: async (database) => {
    const result = await sql<SchemaColumn>`
      select table_name as tableName, column_name as columnName,
        ordinal_position as ordinalPosition, column_type as columnType,
        is_nullable as isNullable, column_default as columnDefault,
        column_key as columnKey, extra as extra
      from information_schema.columns
      where table_schema = database()
        and table_name in ('platform_event_inbox', 'platform_event_outbox')
      order by table_name, ordinal_position
    `.execute(database)
    return hashColumns(result.rows.map(normalize))
  },
  version: '1.0.0',
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

function normalize(value: SchemaColumn): SchemaColumn {
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

function hashColumns(value: readonly SchemaColumn[]): string {
  return `sha256:${createHash('sha256').update(JSON.stringify(value)).digest('hex')}`
}
