import { frameworkSystemLedgerMigration } from "./01-system-ledger.js"
import { frameworkMediaLibraryMigration } from "./02-media-library.js"

export const frameworkDatabaseMigrations = [
  frameworkSystemLedgerMigration,
  frameworkMediaLibraryMigration,
]
