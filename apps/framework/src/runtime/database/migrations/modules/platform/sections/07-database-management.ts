import type { DatabaseMigrationSection } from "../../../types.js"

export const databaseManagementMigrationSection: DatabaseMigrationSection = {
  key: "platform-07-database-management",
  order: 7,
  moduleKey: "platform",
  schemaSectionKey: "database-management",
  name: "Database Manager And Migrator",
  tableNames: [
    "database_backups",
    "database_restore_runs",
    "database_maintenance_runs",
    "database_migration_runs",
  ],
}
