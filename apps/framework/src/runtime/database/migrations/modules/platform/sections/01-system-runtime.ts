import type { DatabaseMigrationSection } from "../../../types.js"

export const systemRuntimeMigrationSection: DatabaseMigrationSection = {
  key: "platform-01-system-runtime",
  order: 1,
  moduleKey: "platform",
  schemaSectionKey: "system-runtime",
  name: "System And Runtime Control",
  tableNames: [
    "system_migrations",
    "system_seeders",
    "system_settings",
    "system_jobs",
    "system_job_locks",
  ],
}
