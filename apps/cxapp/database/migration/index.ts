import { coreBootstrapMigration as cxappBootstrapMigration } from "./01-bootstrap.js"
import { coreCompaniesMigration as cxappCompaniesMigration } from "./02-companies.js"
import { coreAuthFoundationMigration as cxappAuthFoundationMigration } from "./05-auth-foundation.js"
import { coreAuthSessionsMigration as cxappAuthSessionsMigration } from "./06-auth-sessions.js"
import { coreMailboxMigration as cxappMailboxMigration } from "./07-mailbox.js"
import { coreMailboxArchiveMigration as cxappMailboxArchiveMigration } from "./08-mailbox-archive.js"
import { coreAuthPermissionScopeMigration as cxappAuthPermissionScopeMigration } from "./13-auth-permission-scope.js"
import { coreAuthOptionCatalogMigration as cxappAuthOptionCatalogMigration } from "./14-auth-option-catalog.js"
import { coreAuthHardeningMigration as cxappAuthHardeningMigration } from "./15-auth-hardening.js"

export const cxappDatabaseMigrations = [
  cxappBootstrapMigration,
  cxappCompaniesMigration,
  cxappAuthFoundationMigration,
  cxappAuthSessionsMigration,
  cxappMailboxMigration,
  cxappMailboxArchiveMigration,
  cxappAuthPermissionScopeMigration,
  cxappAuthOptionCatalogMigration,
  cxappAuthHardeningMigration,
]
