export {
  createRuntimeDatabases,
  probeDatabase,
  type RuntimeDatabases,
} from "./client.js"
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
