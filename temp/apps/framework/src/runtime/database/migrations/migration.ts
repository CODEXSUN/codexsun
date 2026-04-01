import type { DatabaseOrm } from '../orm'

export interface MigrationContext {
  db: DatabaseOrm
}

export interface Migration {
  id: string
  name: string
  up: (context: MigrationContext) => Promise<void>
}

export interface MigrationModule {
  key: string
  name: string
  migrations: Migration[]
}

export interface RegisteredMigration extends Migration {
  module: string
}

const migrationIdPattern = /^\d{3,}(?:-[a-z0-9]+)+$/

export function defineMigrationModule(key: string, name: string, migrations: Migration[]): MigrationModule {
  return {
    key,
    name,
    migrations,
  }
}

export function buildMigrationPlan(modules: readonly MigrationModule[]): RegisteredMigration[] {
  const seenIds = new Set<string>()
  const plan: RegisteredMigration[] = []

  for (const module of modules) {
    for (const migration of module.migrations) {
      if (!migrationIdPattern.test(migration.id)) {
        throw new Error(`Migration "${migration.id}" in module "${module.key}" must start with a zero-padded numeric prefix.`)
      }

      if (seenIds.has(migration.id)) {
        throw new Error(`Duplicate migration id "${migration.id}" found in module "${module.key}".`)
      }

      seenIds.add(migration.id)
      plan.push({
        ...migration,
        module: module.key,
      })
    }
  }

  return plan.sort((left, right) => left.id.localeCompare(right.id))
}
