import { cxappDatabaseMigrations } from "../database/migration/index.js"
import { cxappDatabaseSeeders } from "../database/seeder/index.js"
import { defineAppDatabaseModule } from "../../framework/src/runtime/database/process/types.js"

export const cxappDatabaseModule = defineAppDatabaseModule({
  appId: "cxapp",
  label: "CxApp",
  order: 5,
  migrations: cxappDatabaseMigrations,
  seeders: cxappDatabaseSeeders,
})
