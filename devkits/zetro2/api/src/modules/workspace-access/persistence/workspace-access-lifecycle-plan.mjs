// Workspace Access Lifecycle Plan
// Configures moduleId, migrations, and seeders for PlatformCore MigrationRunner

import {
  workspaceAccessMigration001,
  workspaceAccessMigration002,
} from './workspace-access-migration.mjs';
import { workspaceAccessSeeder001 } from './workspace-access-seeder.mjs';

export const workspaceAccessLifecyclePlan = Object.freeze({
  moduleId: 'zetro2.workspace-access',
  migrations: [workspaceAccessMigration001, workspaceAccessMigration002],
  seeders: [workspaceAccessSeeder001],
});
