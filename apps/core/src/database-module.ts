import { coreDatabaseMigrations } from "../database/migration/index.js"
import { coreDatabaseSeeders } from "../database/seeder/index.js"
import { defineAppDatabaseModule } from "../../framework/src/runtime/database/process/types.js"

export const coreDatabaseModule = defineAppDatabaseModule({
  appId: "core",
  label: "Core",
  order: 10,
  migrations: coreDatabaseMigrations,
  seeders: coreDatabaseSeeders,
})
