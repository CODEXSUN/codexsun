import type { ColumnType } from 'kysely'

type DatabaseTimestamp = ColumnType<Date, Date | string, Date | string>

export interface ModuleRuntimeStateTable {
  enabled: number
  installed_version: string | null
  kind: string
  last_failure_code: string | null
  last_failure_message: string | null
  manifest_checksum: string
  module_id: string
  requested_version: string
  runtime_state: string
  updated_at: DatabaseTimestamp
}

export interface ModuleRuntimeMigrationTable {
  applied_at: DatabaseTimestamp
  checksum: string
  duration_ms: number
  migration_id: string
  module_id: string
  module_version: string
}

export interface ModuleRuntimeSeedTable {
  applied_at: DatabaseTimestamp
  checksum: string
  module_id: string
  module_version: string
  seed_id: string
}

export interface ModuleRuntimeDatabaseSchema {
  platform_module_migrations: ModuleRuntimeMigrationTable
  platform_module_seeds: ModuleRuntimeSeedTable
  platform_module_state: ModuleRuntimeStateTable
}
