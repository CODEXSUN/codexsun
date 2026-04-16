import { billingDatabaseModule } from "../../../../../billing/src/database-module.js"
import { crmDatabaseModule } from "../../../../../crm/src/database-module.js"
import { coreDatabaseModule } from "../../../../../core/src/database-module.js"
import { cxappDatabaseModule } from "../../../../../cxapp/src/database-module.js"
import { ecommerceDatabaseModule } from "../../../../../ecommerce/src/database-module.js"
import { frappeDatabaseModule } from "../../../../../frappe/src/database-module.js"
import { stockDatabaseModule } from "../../../../../stock/src/database-module.js"

import { frameworkDatabaseMigrations } from "./migrations/index.js"
import {
  defineAppDatabaseModule,
  type AppDatabaseModule,
  type DatabaseProcessMigration,
  type DatabaseProcessSeeder,
} from "./types.js"

export const frameworkDatabaseModule = defineAppDatabaseModule({
  appId: "framework",
  label: "Framework",
  order: 0,
  migrations: frameworkDatabaseMigrations,
  seeders: [],
})

export const registeredDatabaseModules: AppDatabaseModule[] = [
  frameworkDatabaseModule,
  cxappDatabaseModule,
  coreDatabaseModule,
  billingDatabaseModule,
  crmDatabaseModule,
  ecommerceDatabaseModule,
  stockDatabaseModule,
  frappeDatabaseModule,
].sort((left, right) => left.order - right.order || left.appId.localeCompare(right.appId))

export function listRegisteredDatabaseMigrations() {
  return registeredDatabaseModules.flatMap((module) =>
    [...module.migrations].sort(compareDatabaseProcess<DatabaseProcessMigration>())
  )
}

export function listRegisteredDatabaseSeeders() {
  return registeredDatabaseModules.flatMap((module) =>
    [...module.seeders].sort(compareDatabaseProcess<DatabaseProcessSeeder>())
  )
}

function compareDatabaseProcess<T extends DatabaseProcessMigration | DatabaseProcessSeeder>() {
  return (left: T, right: T) =>
    left.order - right.order || left.id.localeCompare(right.id)
}
