import { coreBootstrapMigration } from "./01-bootstrap.js"
import { coreCompaniesMigration } from "./02-companies.js"
import { coreContactsMigration } from "./03-contacts.js"
import { coreCommonModulesMigration } from "./04-common-modules.js"
import { coreAuthFoundationMigration } from "./05-auth-foundation.js"
import { coreAuthSessionsMigration } from "./06-auth-sessions.js"
import { coreMailboxMigration } from "./07-mailbox.js"
import { coreCommonModuleTablesMigration } from "./08-common-module-tables.js"
import { coreCommonModuleTableBackfillMigration } from "./09-common-module-table-backfill.js"
import { coreContactCodeBackfillMigration } from "./10-contact-code-backfill.js"
import { coreCommonModuleSeedSyncMigration } from "./11-common-module-seed-sync.js"
import { coreProductsMigration } from "./12-products.js"

export const coreDatabaseMigrations = [
  coreBootstrapMigration,
  coreCompaniesMigration,
  coreContactsMigration,
  coreCommonModulesMigration,
  coreAuthFoundationMigration,
  coreAuthSessionsMigration,
  coreMailboxMigration,
  coreCommonModuleTablesMigration,
  coreCommonModuleTableBackfillMigration,
  coreContactCodeBackfillMigration,
  coreCommonModuleSeedSyncMigration,
  coreProductsMigration,
]
