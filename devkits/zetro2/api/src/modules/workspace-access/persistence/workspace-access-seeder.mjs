// Repeat-Safe Seeder for Workspace Access Module
// Seeds initial default workspace and initial owner membership if not present

import { createLifecycleChecksum } from '@codexsun/platform-core';

export const workspaceAccessSeeder001 = {
  id: 'zetro2.workspace-access.seed.001',
  owner: 'zetro2.workspace-access',
  description: 'Seed default workspace and initial owner membership if not present.',
  checksum: createLifecycleChecksum(
    'zetro2.workspace-access.seed.001|seed default workspace, initial owner membership, and base grants|repeat-safe'
  ),

  async seed(database) {
    const now = Math.floor(Date.now() / 1000);

    // 1. Check if default workspace exists
    const existingWs = await database
      .selectFrom('zetro_workspaces')
      .selectAll()
      .where('id', '=', 'ws-default')
      .executeTakeFirst();

    if (!existingWs) {
      await database
        .insertInto('zetro_workspaces')
        .values({
          id: 'ws-default',
          slug: 'default',
          name: 'Default Workspace',
          description: 'Primary initialized workspace for Zetro2 environment.',
          root_path: 'storage/apps/private/zetro2/workspaces/default',
          owner_user_id: 'usr-admin',
          created_at: now,
          updated_at: now,
        })
        .execute();
    }

    // 2. Check if default owner membership exists
    const existingMembership = await database
      .selectFrom('zetro_workspace_memberships')
      .selectAll()
      .where('workspace_id', '=', 'ws-default')
      .where('user_id', '=', 'usr-admin')
      .executeTakeFirst();

    if (!existingMembership) {
      await database
        .insertInto('zetro_workspace_memberships')
        .values({
          id: 'mem-default-owner',
          workspace_id: 'ws-default',
          user_id: 'usr-admin',
          role: 'Owner',
          joined_at: now,
          granted_by: 'system',
          updated_at: now,
        })
        .execute();
    }
  },
};
