import type { Kysely } from "kysely"

export type DatabaseProcessContext = {
  database: Kysely<unknown>
}

export type DatabaseProcessLogger = Pick<Console, "error" | "info">

export type DatabaseProcessMigration = {
  id: string
  appId: string
  moduleKey: string
  name: string
  order: number
  up: (
    context: DatabaseProcessContext
  ) => Promise<void> | void
}

export type DatabaseProcessSeeder = {
  id: string
  appId: string
  moduleKey: string
  name: string
  order: number
  run: (
    context: DatabaseProcessContext
  ) => Promise<void> | void
}

export type AppDatabaseModule = {
  appId: string
  label: string
  order: number
  migrations: DatabaseProcessMigration[]
  seeders: DatabaseProcessSeeder[]
}

export type DatabaseProcessRunResult = {
  applied: string[]
  skipped: string[]
}

export type DatabasePrepareResult = {
  migrations: DatabaseProcessRunResult
  seeders: DatabaseProcessRunResult
}

export function defineDatabaseMigration(
  migration: DatabaseProcessMigration
): DatabaseProcessMigration {
  return migration
}

export function defineDatabaseSeeder(
  seeder: DatabaseProcessSeeder
): DatabaseProcessSeeder {
  return seeder
}

export function defineAppDatabaseModule(
  module: AppDatabaseModule
): AppDatabaseModule {
  return module
}
