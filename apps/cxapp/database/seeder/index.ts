import { coreBootstrapSeeder as cxappBootstrapSeeder } from "./01-bootstrap.js"
import { coreCompaniesSeeder as cxappCompaniesSeeder } from "./02-companies.js"
import { coreAuthFoundationSeeder as cxappAuthFoundationSeeder } from "./05-auth-foundation.js"
import { coreMailboxSeeder as cxappMailboxSeeder } from "./06-mailbox.js"
import { coreAuthOptionCatalogSeeder as cxappAuthOptionCatalogSeeder } from "./09-auth-option-catalog.js"

export const cxappDatabaseSeeders = [
  cxappBootstrapSeeder,
  cxappCompaniesSeeder,
  cxappAuthFoundationSeeder,
  cxappMailboxSeeder,
  cxappAuthOptionCatalogSeeder,
]
