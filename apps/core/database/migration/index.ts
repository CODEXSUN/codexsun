import { coreBootstrapMigration } from "./01-bootstrap.js"
import { coreCompaniesMigration } from "./02-companies.js"
import { coreContactsMigration } from "./03-contacts.js"
import { coreCommonModulesMigration } from "./04-common-modules.js"
import { coreAuthFoundationMigration } from "./05-auth-foundation.js"
import { coreAuthSessionsMigration } from "./06-auth-sessions.js"
import { coreMailboxMigration } from "./07-mailbox.js"

export const coreDatabaseMigrations = [
  coreBootstrapMigration,
  coreCompaniesMigration,
  coreContactsMigration,
  coreCommonModulesMigration,
  coreAuthFoundationMigration,
  coreAuthSessionsMigration,
  coreMailboxMigration,
]
