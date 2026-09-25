// Checksummed Migration for Workspace Access Module
// Creates core tables: zetro_workspaces, zetro_workspace_memberships, zetro_capability_grants, zetro_access_audit_logs

import { createLifecycleChecksum } from '@codexsun/platform-core';

export const workspaceAccessMigration001 = {
  id: 'zetro2.workspace-access.001',
  owner: 'zetro2.workspace-access',
  description: 'Create initial workspace access schema: workspaces, memberships, grants, and audit logs.',
  checksum: createLifecycleChecksum(
    'zetro2.workspace-access.001|initial workspace access schema|workspaces,memberships,capability_grants,access_audit_logs|v1'
  ),

  async apply(database) {
    // 1. zetro_workspaces
    await database.schema
      .createTable('zetro_workspaces')
      .ifNotExists()
      .addColumn('id', 'varchar(36)', (col) => col.primaryKey())
      .addColumn('slug', 'varchar(64)', (col) => col.notNull().unique())
      .addColumn('name', 'varchar(128)', (col) => col.notNull())
      .addColumn('description', 'text')
      .addColumn('root_path', 'varchar(255)', (col) => col.notNull())
      .addColumn('owner_user_id', 'varchar(64)', (col) => col.notNull())
      .addColumn('created_at', 'integer', (col) => col.notNull())
      .addColumn('updated_at', 'integer', (col) => col.notNull())
      .execute();

    // 2. zetro_workspace_memberships
    await database.schema
      .createTable('zetro_workspace_memberships')
      .ifNotExists()
      .addColumn('id', 'varchar(36)', (col) => col.primaryKey())
      .addColumn('workspace_id', 'varchar(36)', (col) =>
        col.notNull().references('zetro_workspaces.id').onDelete('cascade')
      )
      .addColumn('user_id', 'varchar(64)', (col) => col.notNull())
      .addColumn('role', 'varchar(32)', (col) => col.notNull())
      .addColumn('joined_at', 'integer', (col) => col.notNull())
      .addColumn('granted_by', 'varchar(64)', (col) => col.notNull())
      .addColumn('updated_at', 'integer')
      .execute();

    // 3. zetro_capability_grants
    await database.schema
      .createTable('zetro_capability_grants')
      .ifNotExists()
      .addColumn('id', 'varchar(36)', (col) => col.primaryKey())
      .addColumn('workspace_id', 'varchar(36)', (col) =>
        col.notNull().references('zetro_workspaces.id').onDelete('cascade')
      )
      .addColumn('user_id', 'varchar(64)')
      .addColumn('role', 'varchar(32)')
      .addColumn('capability', 'varchar(64)', (col) => col.notNull())
      .addColumn('scope_json', 'text')
      .addColumn('expires_at', 'integer')
      .addColumn('created_at', 'integer', (col) => col.notNull())
      .execute();

    // 4. zetro_access_audit_logs
    await database.schema
      .createTable('zetro_access_audit_logs')
      .ifNotExists()
      .addColumn('id', 'varchar(36)', (col) => col.primaryKey())
      .addColumn('workspace_id', 'varchar(36)')
      .addColumn('actor_id', 'varchar(64)', (col) => col.notNull())
      .addColumn('action', 'varchar(64)', (col) => col.notNull())
      .addColumn('target_type', 'varchar(32)', (col) => col.notNull())
      .addColumn('target_id', 'varchar(64)', (col) => col.notNull())
      .addColumn('details_json', 'text')
      .addColumn('created_at', 'integer', (col) => col.notNull())
      .execute();
  },
};

export const workspaceAccessMigration002 = {
  id: 'zetro2.workspace-access.002',
  owner: 'zetro2.workspace-access',
  description: 'Create action approvals table for bound, content-hashed, expiring approval requests.',
  checksum: createLifecycleChecksum(
    'zetro2.workspace-access.002|action approvals table|zetro_action_approvals|v1'
  ),

  async apply(database) {
    await database.schema
      .createTable('zetro_action_approvals')
      .ifNotExists()
      .addColumn('id', 'varchar(64)', (col) => col.primaryKey())
      .addColumn('workspace_id', 'varchar(36)', (col) =>
        col.notNull().references('zetro_workspaces.id').onDelete('cascade')
      )
      .addColumn('actor_id', 'varchar(64)', (col) => col.notNull())
      .addColumn('approver_id', 'varchar(64)')
      .addColumn('action', 'varchar(64)', (col) => col.notNull())
      .addColumn('target_resource', 'varchar(255)', (col) => col.notNull())
      .addColumn('content_digest', 'varchar(64)', (col) => col.notNull())
      .addColumn('status', 'varchar(32)', (col) => col.notNull())
      .addColumn('created_at', 'integer', (col) => col.notNull())
      .addColumn('expires_at', 'integer', (col) => col.notNull())
      .addColumn('consumed_at', 'integer')
      .addColumn('rejection_reason', 'text')
      .execute();
  },
};
