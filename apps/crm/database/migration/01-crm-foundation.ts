import { ensureJsonStoreTable } from "../../../framework/src/runtime/database/process/json-store.js"
import { defineDatabaseMigration } from "../../../framework/src/runtime/database/process/types.js"

import { crmTableNames } from "../table-names.js"

export const crmFoundationMigration = defineDatabaseMigration({
  id: "crm:foundation:01-crm-foundation",
  appId: "crm",
  moduleKey: "foundation",
  name: "Create CRM foundation JSON stores for leads and interactions",
  order: 10,
  up: async ({ database }) => {
    await ensureJsonStoreTable(database, crmTableNames.leads)
    await ensureJsonStoreTable(database, crmTableNames.interactions)
  },
})
