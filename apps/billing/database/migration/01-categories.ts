import { ensureJsonStoreTable } from "../../../framework/src/runtime/database/process/json-store.js"
import { defineDatabaseMigration } from "../../../framework/src/runtime/database/process/types.js"

import { billingTableNames } from "../table-names.js"

export const billingCategoriesMigration = defineDatabaseMigration({
  id: "billing:categories:01-categories",
  appId: "billing",
  moduleKey: "categories",
  name: "Create billing category table",
  order: 10,
  up: async ({ database }) => {
    await ensureJsonStoreTable(database, billingTableNames.categories)
  },
})
