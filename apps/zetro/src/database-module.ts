import { zetroDatabaseMigrations } from "../database/migration/index.js"
import { zetroDatabaseSeeders } from "../database/seeder/index.js"
import { defineAppDatabaseModule } from "../../framework/src/runtime/database/process/types.js"

export const zetroDatabaseModule = defineAppDatabaseModule({
  appId: "zetro",
  label: "Zetro",
  order: 45,
  migrations: zetroDatabaseMigrations,
  seeders: zetroDatabaseSeeders,
})
