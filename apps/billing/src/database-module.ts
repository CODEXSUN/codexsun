import { billingDatabaseMigrations } from "../database/migration/index.js"
import { billingDatabaseSeeders } from "../database/seeder/index.js"
import { defineAppDatabaseModule } from "../../framework/src/runtime/database/process/types.js"

export const billingDatabaseModule = defineAppDatabaseModule({
  appId: "billing",
  label: "Billing",
  order: 15,
  migrations: billingDatabaseMigrations,
  seeders: billingDatabaseSeeders,
})
