import type { PlatformModuleSchema } from '@codexsun/platform-core-api'
import { createHash } from 'node:crypto'
import { sql } from 'kysely'
import type { Database } from '../../../database.js'

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
  column('identity_credentials', 'user_id', 1, 'char(36)', 'NO', null, 'PRI'),
  column('identity_credentials', 'password_hash', 2, 'varchar(512)', 'NO'),
  column('identity_credentials', 'updated_at', 3, 'datetime(3)', 'NO'),
  column('identity_permissions', 'id', 1, 'char(36)', 'NO', null, 'PRI'),
  column('identity_permissions', 'name', 2, 'varchar(191)', 'NO', null, 'UNI'),
  column('identity_role_permissions', 'role_id', 1, 'char(36)', 'NO', null, 'PRI'),
  column('identity_role_permissions', 'permission_id', 2, 'char(36)', 'NO', null, 'PRI'),
  column('identity_roles', 'id', 1, 'char(36)', 'NO', null, 'PRI'),
  column('identity_roles', 'name', 2, 'varchar(120)', 'NO'),
  column('identity_roles', 'portal', 3, 'varchar(32)', 'NO'),
  column('identity_sessions', 'id', 1, 'char(36)', 'NO', null, 'PRI'),
  column('identity_sessions', 'user_id', 2, 'char(36)', 'NO'),
  column('identity_sessions', 'portal', 3, 'varchar(32)', 'NO'),
  column('identity_sessions', 'token_hash', 4, 'char(64)', 'NO', null, 'UNI'),
  column('identity_sessions', 'expires_at', 5, 'datetime(3)', 'NO'),
  column('identity_sessions', 'revoked_at', 6, 'datetime(3)', 'YES', 'NULL'),
  column('identity_sessions', 'created_at', 7, 'datetime(3)', 'NO'),
  column('identity_user_roles', 'user_id', 1, 'char(36)', 'NO', null, 'PRI'),
  column('identity_user_roles', 'role_id', 2, 'char(36)', 'NO', null, 'PRI'),
  column('identity_users', 'id', 1, 'char(36)', 'NO', null, 'PRI'),
  column('identity_users', 'email', 2, 'varchar(320)', 'NO', null, 'UNI'),
  column('identity_users', 'display_name', 3, 'varchar(120)', 'NO'),
  column('identity_users', 'portal', 4, 'varchar(32)', 'NO'),
  column('identity_users', 'status', 5, 'varchar(32)', 'NO'),
  column('identity_users', 'created_at', 6, 'datetime(3)', 'NO'),
  column('identity_users', 'updated_at', 7, 'datetime(3)', 'NO'),
]

export const identitySchema: PlatformModuleSchema<Database> = {
  checksum: hashColumns(expectedColumns),
  inspect: inspectIdentitySchema,
  version: '1.0.0',
}

async function inspectIdentitySchema(database: Database): Promise<string> {
  const result = await sql<SchemaColumn>`
    select table_name as tableName, column_name as columnName,
      ordinal_position as ordinalPosition, column_type as columnType,
      is_nullable as isNullable, column_default as columnDefault,
      column_key as columnKey, extra as extra
    from information_schema.columns
    where table_schema = database()
      and table_name like 'identity_%'
    order by binary table_name, ordinal_position
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
