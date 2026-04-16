import { defineAppDatabaseModule } from "../../framework/src/runtime/database/process/types.js"
import { stockDatabaseMigrations } from "../database/migration/index.js"
import { stockDatabaseSeeders } from "../database/seeder/index.js"

export const stockDatabaseModule = defineAppDatabaseModule({
  appId: "stock",
  label: "Stock",
  order: 45,
  migrations: stockDatabaseMigrations,
  seeders: stockDatabaseSeeders,
})
