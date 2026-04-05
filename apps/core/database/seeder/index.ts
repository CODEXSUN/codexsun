import { coreContactsSeeder } from "./03-contacts.js"
import { coreCommonModulesSeeder } from "./04-common-modules.js"
import { coreCommonModuleTablesSeeder } from "./07-common-module-tables.js"
import { coreProductsSeeder } from "./08-products.js"

export const coreDatabaseSeeders = [
  coreContactsSeeder,
  coreCommonModulesSeeder,
  coreCommonModuleTablesSeeder,
  coreProductsSeeder,
]
