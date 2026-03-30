import { frappeDatabaseMigrations } from "../database/migration/index.js"
import { frappeDatabaseSeeders } from "../database/seeder/index.js"
import { defineAppDatabaseModule } from "../../framework/src/runtime/database/process/types.js"

export const frappeDatabaseModule = defineAppDatabaseModule({
  appId: "frappe",
  label: "Frappe",
  order: 30,
  migrations: frappeDatabaseMigrations,
  seeders: frappeDatabaseSeeders,
})
