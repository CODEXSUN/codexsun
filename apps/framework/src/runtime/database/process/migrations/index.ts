import { frameworkSystemLedgerMigration } from "./01-system-ledger.js"
import { frameworkMediaLibraryMigration } from "./02-media-library.js"
import { frameworkActivityLogMigration } from "./03-activity-log.js"
import { frameworkMonitoringEventsMigration } from "./04-monitoring-events.js"
import { frameworkOperationsGovernanceMigration } from "./05-operations-governance.js"
import { frameworkRuntimeJobsMigration } from "./06-runtime-jobs.js"

export const frameworkDatabaseMigrations = [
  frameworkSystemLedgerMigration,
  frameworkMediaLibraryMigration,
  frameworkActivityLogMigration,
  frameworkMonitoringEventsMigration,
  frameworkOperationsGovernanceMigration,
  frameworkRuntimeJobsMigration,
]
