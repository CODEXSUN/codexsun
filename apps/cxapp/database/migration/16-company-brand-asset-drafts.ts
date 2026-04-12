import { ensureJsonStoreTable } from "../../../framework/src/runtime/database/index.js"
import { defineDatabaseMigration } from "../../../framework/src/runtime/database/process/types.js"

import { cxappTableNames } from "../table-names.js"

export const coreCompanyBrandAssetDraftsMigration = defineDatabaseMigration({
  id: "cxapp:companies:16-company-brand-asset-drafts",
  appId: "cxapp",
  moduleKey: "companies",
  name: "Create cxapp company brand asset drafts table",
  order: 160,
  up: async ({ database }) => {
    await ensureJsonStoreTable(database, cxappTableNames.companyBrandAssetDrafts)
  },
})
