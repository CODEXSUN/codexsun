import type { DatabaseFoundationSection } from "../types.js"

export const databaseManagementSection: DatabaseFoundationSection = {
  key: "database-management",
  order: 7,
  name: "Database Manager And Migrator",
  purpose: "Tracks backups, restore runs, maintenance, and migration runs.",
  tables: [
    { key: "database_backups", name: "database_backups", purpose: "Backup catalog." },
    { key: "database_restore_runs", name: "database_restore_runs", purpose: "Restore execution records." },
    { key: "database_maintenance_runs", name: "database_maintenance_runs", purpose: "Maintenance execution records." },
    { key: "database_migration_runs", name: "database_migration_runs", purpose: "Migration execution records." },
  ],
}
