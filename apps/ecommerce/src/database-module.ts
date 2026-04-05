import { ecommerceDatabaseMigrations } from "../database/migration/index.js"
import { ecommerceDatabaseSeeders } from "../database/seeder/index.js"
import { defineAppDatabaseModule } from "../../framework/src/runtime/database/process/types.js"

export const ecommerceDatabaseModule = defineAppDatabaseModule({
  appId: "ecommerce",
  label: "Ecommerce",
  order: 30,
  migrations: ecommerceDatabaseMigrations,
  seeders: ecommerceDatabaseSeeders,
})
