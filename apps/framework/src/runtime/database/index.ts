export {
  createRuntimeDatabases,
  probeDatabase,
  type RuntimeDatabases,
} from "./client.js"
export {
  getFirstJsonStorePayload,
  listJsonStorePayloads,
  replaceJsonStoreRecords,
  ensureJsonStoreTable,
  type JsonStoreSeedRecord,
} from "./process/json-store.js"
export {
  prepareApplicationDatabase,
  runDatabaseMigrations,
  runDatabaseSeeders,
} from "./process/runner.js"
export {
  listRegisteredDatabaseMigrations,
  listRegisteredDatabaseSeeders,
  registeredDatabaseModules,
} from "./process/registry.js"
export {
  systemMigrationTableName,
  systemSeederTableName,
} from "./process/table-names.js"
export type {
  AppDatabaseModule,
  DatabasePrepareResult,
  DatabaseProcessMigration,
  DatabaseProcessRunResult,
  DatabaseProcessSeeder,
} from "./process/types.js"
export {
  findFoundationSection,
  findFoundationTable,
  frameworkFoundationSections,
  listFoundationTables,
  type DatabaseFoundationSection,
  type DatabaseFoundationTable,
} from "./schema/index.js"
export {
  platformMigrationSections,
  type DatabaseMigrationSection,
} from "./migrations/modules/platform/index.js"
