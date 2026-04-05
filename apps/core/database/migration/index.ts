import { coreContactsMigration } from "./03-contacts.js"
import { coreCommonModulesMigration } from "./04-common-modules.js"
import { coreCommonModuleTablesMigration } from "./08-common-module-tables.js"
import { coreCommonModuleTableBackfillMigration } from "./09-common-module-table-backfill.js"
import { coreContactCodeBackfillMigration } from "./10-contact-code-backfill.js"
import { coreCommonModuleSeedSyncMigration } from "./11-common-module-seed-sync.js"
import { coreProductsMigration } from "./12-products.js"

export const coreDatabaseMigrations = [
  coreContactsMigration,
  coreCommonModulesMigration,
  coreCommonModuleTablesMigration,
  coreCommonModuleTableBackfillMigration,
  coreContactCodeBackfillMigration,
  coreCommonModuleSeedSyncMigration,
  coreProductsMigration,
]
