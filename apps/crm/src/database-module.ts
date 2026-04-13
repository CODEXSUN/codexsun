import { defineAppDatabaseModule } from "../../framework/src/runtime/database/process/types.js"

import { crmDatabaseMigrations } from "../database/migration/index.js"
import { crmDatabaseSeeders } from "../database/seeder/index.js"

export const crmDatabaseModule = defineAppDatabaseModule({
  appId: "crm",
  label: "CRM",
  order: 25,
  migrations: crmDatabaseMigrations,
  seeders: crmDatabaseSeeders,
})
