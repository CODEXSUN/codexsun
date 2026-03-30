import { coreBootstrapSeeder } from "./01-bootstrap.js"
import { coreCompaniesSeeder } from "./02-companies.js"
import { coreContactsSeeder } from "./03-contacts.js"
import { coreCommonModulesSeeder } from "./04-common-modules.js"
import { coreAuthFoundationSeeder } from "./05-auth-foundation.js"
import { coreMailboxSeeder } from "./06-mailbox.js"

export const coreDatabaseSeeders = [
  coreBootstrapSeeder,
  coreCompaniesSeeder,
  coreContactsSeeder,
  coreCommonModulesSeeder,
  coreAuthFoundationSeeder,
  coreMailboxSeeder,
]
