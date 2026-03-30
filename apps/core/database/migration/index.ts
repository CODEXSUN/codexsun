import { coreBootstrapMigration } from "./01-bootstrap.js"
import { coreCompaniesMigration } from "./02-companies.js"
import { coreContactsMigration } from "./03-contacts.js"
import { coreCommonModulesMigration } from "./04-common-modules.js"

export const coreDatabaseMigrations = [
  coreBootstrapMigration,
  coreCompaniesMigration,
  coreContactsMigration,
  coreCommonModulesMigration,
]
