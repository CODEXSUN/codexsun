import { coreBootstrapSeeder } from "./01-bootstrap.js"
import { coreCompaniesSeeder } from "./02-companies.js"
import { coreContactsSeeder } from "./03-contacts.js"
import { coreCommonModulesSeeder } from "./04-common-modules.js"
import { coreAuthFoundationSeeder } from "./05-auth-foundation.js"
import { coreMailboxSeeder } from "./06-mailbox.js"
import { coreCommonModuleTablesSeeder } from "./07-common-module-tables.js"
import { coreProductsSeeder } from "./08-products.js"
import { coreAuthOptionCatalogSeeder } from "./09-auth-option-catalog.js"

export const coreDatabaseSeeders = [
  coreBootstrapSeeder,
  coreCompaniesSeeder,
  coreContactsSeeder,
  coreCommonModulesSeeder,
  coreAuthFoundationSeeder,
  coreMailboxSeeder,
  coreCommonModuleTablesSeeder,
  coreProductsSeeder,
  coreAuthOptionCatalogSeeder,
]
