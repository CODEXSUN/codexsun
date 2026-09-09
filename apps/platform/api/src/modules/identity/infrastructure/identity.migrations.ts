import type { PlatformModuleMigration } from '@codexsun/platform-core-api'
import type { Database } from '../../../database.js'

export const identityMigrations: readonly PlatformModuleMigration<Database>[] = [
  {
    checksum: 'sha256:0c7e89003bb61f27504db65d31494fa74dce3649dddbd2b84cfe88cc93c34a28',
    id: '0001-identity-schema',
    version: '1.0.0',
    async up(database) {
      await database.schema
        .createTable('identity_users')
        .ifNotExists()
        .addColumn('id', 'char(36)', (column) => column.primaryKey())
        .addColumn('email', 'varchar(320)', (column) => column.notNull().unique())
        .addColumn('display_name', 'varchar(120)', (column) => column.notNull())
        .addColumn('portal', 'varchar(32)', (column) => column.notNull())
        .addColumn('status', 'varchar(32)', (column) => column.notNull())
        .addColumn('created_at', 'datetime(3)', (column) => column.notNull())
        .addColumn('updated_at', 'datetime(3)', (column) => column.notNull())
        .execute()

      await database.schema
        .createTable('identity_credentials')
        .ifNotExists()
        .addColumn('user_id', 'char(36)', (column) => column.primaryKey())
        .addColumn('password_hash', 'varchar(512)', (column) => column.notNull())
        .addColumn('updated_at', 'datetime(3)', (column) => column.notNull())
        .execute()

      await database.schema
        .createTable('identity_sessions')
        .ifNotExists()
        .addColumn('id', 'char(36)', (column) => column.primaryKey())
        .addColumn('user_id', 'char(36)', (column) => column.notNull())
        .addColumn('portal', 'varchar(32)', (column) => column.notNull())
        .addColumn('token_hash', 'char(64)', (column) => column.notNull().unique())
        .addColumn('expires_at', 'datetime(3)', (column) => column.notNull())
        .addColumn('revoked_at', 'datetime(3)')
        .addColumn('created_at', 'datetime(3)', (column) => column.notNull())
        .execute()

      await database.schema
        .createTable('identity_roles')
        .ifNotExists()
        .addColumn('id', 'char(36)', (column) => column.primaryKey())
        .addColumn('name', 'varchar(120)', (column) => column.notNull())
        .addColumn('portal', 'varchar(32)', (column) => column.notNull())
        .execute()

      await database.schema
        .createTable('identity_permissions')
        .ifNotExists()
        .addColumn('id', 'char(36)', (column) => column.primaryKey())
        .addColumn('name', 'varchar(191)', (column) => column.notNull().unique())
        .execute()

      await database.schema
        .createTable('identity_role_permissions')
        .ifNotExists()
        .addColumn('role_id', 'char(36)', (column) => column.notNull())
        .addColumn('permission_id', 'char(36)', (column) => column.notNull())
        .addPrimaryKeyConstraint('pk_identity_role_permissions', ['role_id', 'permission_id'])
        .execute()

      await database.schema
        .createTable('identity_user_roles')
        .ifNotExists()
        .addColumn('user_id', 'char(36)', (column) => column.notNull())
        .addColumn('role_id', 'char(36)', (column) => column.notNull())
        .addPrimaryKeyConstraint('pk_identity_user_roles', ['user_id', 'role_id'])
        .execute()
    },
  },
]
