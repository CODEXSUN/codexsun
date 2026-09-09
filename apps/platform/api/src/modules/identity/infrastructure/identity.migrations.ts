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
  {
    checksum: 'sha256:cd3fda72662e14ecea1ff8b01cae293e72f4a120692f96ad33b0fb1149c97d86',
    id: '0002-identity-devices-and-security',
    version: '1.1.0',
    async up(database) {
      await database.schema
        .createTable('identity_user_identifiers')
        .ifNotExists()
        .addColumn('id', 'char(36)', (column) => column.primaryKey())
        .addColumn('user_id', 'char(36)', (column) => column.notNull())
        .addColumn('identifier_type', 'varchar(16)', (column) => column.notNull())
        .addColumn('identifier_value', 'varchar(320)', (column) => column.notNull())
        .addColumn('verified_at', 'datetime(3)')
        .addColumn('created_at', 'datetime(3)', (column) => column.notNull())
        .addUniqueConstraint('uq_identity_identifier', ['identifier_type', 'identifier_value'])
        .execute()

      await database
        .insertInto('identity_user_identifiers')
        .columns([
          'id',
          'user_id',
          'identifier_type',
          'identifier_value',
          'verified_at',
          'created_at',
        ])
        .expression((query) =>
          query
            .selectFrom('identity_users')
            .select([
              'id',
              'id as user_id',
              query.val('email').as('identifier_type'),
              'email as identifier_value',
              'created_at as verified_at',
              'created_at',
            ]),
        )
        .ignore()
        .execute()

      await database.schema
        .createTable('identity_devices')
        .ifNotExists()
        .addColumn('user_id', 'char(36)', (column) => column.notNull())
        .addColumn('device_id', 'varchar(128)', (column) => column.notNull())
        .addColumn('device_name', 'varchar(120)', (column) => column.notNull())
        .addColumn('client_type', 'varchar(16)', (column) => column.notNull())
        .addColumn('token_hash', 'char(64)', (column) => column.notNull())
        .addColumn('status', 'varchar(16)', (column) => column.notNull())
        .addColumn('first_seen_at', 'datetime(3)', (column) => column.notNull())
        .addColumn('last_seen_at', 'datetime(3)', (column) => column.notNull())
        .addColumn('activated_at', 'datetime(3)')
        .addColumn('activated_by', 'char(36)')
        .addPrimaryKeyConstraint('pk_identity_devices', ['user_id', 'device_id'])
        .execute()

      await database.schema
        .alterTable('identity_sessions')
        .addColumn('device_id', 'varchar(128)', (column) => column.notNull().defaultTo('legacy'))
        .execute()

      await database.schema
        .createTable('identity_security_events')
        .ifNotExists()
        .addColumn('id', 'char(36)', (column) => column.primaryKey())
        .addColumn('event_type', 'varchar(80)', (column) => column.notNull())
        .addColumn('outcome', 'varchar(16)', (column) => column.notNull())
        .addColumn('risk', 'varchar(16)', (column) => column.notNull())
        .addColumn('actor_user_id', 'char(36)')
        .addColumn('subject_user_id', 'char(36)')
        .addColumn('device_id', 'varchar(128)')
        .addColumn('client_type', 'varchar(16)')
        .addColumn('ip_address', 'varchar(64)')
        .addColumn('user_agent', 'varchar(512)')
        .addColumn('path', 'varchar(512)')
        .addColumn('created_at', 'datetime(3)', (column) => column.notNull())
        .execute()
    },
  },
  {
    checksum: 'sha256:0bb2219d84d7cd4e09a3aa5276fe47ba75bdbf86024d9228f14e62d516c0a0a9',
    id: '0003-identity-access-indexes',
    version: '1.1.0',
    async up(database) {
      await database.schema
        .createIndex('ix_identity_sessions_user_expiry')
        .ifNotExists()
        .on('identity_sessions')
        .columns(['user_id', 'expires_at'])
        .execute()
      await database.schema
        .createIndex('ix_identity_devices_status_seen')
        .ifNotExists()
        .on('identity_devices')
        .columns(['status', 'last_seen_at'])
        .execute()
      await database.schema
        .createIndex('ix_identity_identifiers_user')
        .ifNotExists()
        .on('identity_user_identifiers')
        .column('user_id')
        .execute()
      await database.schema
        .createIndex('ix_identity_security_created')
        .ifNotExists()
        .on('identity_security_events')
        .column('created_at')
        .execute()
      await database.schema
        .createIndex('ix_identity_security_actor')
        .ifNotExists()
        .on('identity_security_events')
        .columns(['actor_user_id', 'created_at'])
        .execute()
    },
  },
]
