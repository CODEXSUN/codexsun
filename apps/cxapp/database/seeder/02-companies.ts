import { replaceJsonStoreRecords } from "../../../framework/src/runtime/database/index.js"
import { defineDatabaseSeeder } from "../../../framework/src/runtime/database/process/types.js"

import { companies } from "../../src/data/cxapp-seed.js"

import { cxappTableNames } from "../table-names.js"

export const coreCompaniesSeeder = defineDatabaseSeeder({
  id: "cxapp:companies:02-companies",
  appId: "cxapp",
  moduleKey: "companies",
  name: "Seed cxapp companies",
  order: 20,
  run: async ({ database }) => {
    await replaceJsonStoreRecords(
      database,
      cxappTableNames.companies,
      companies.map((company, index) => ({
        id: company.id,
        moduleKey: "companies",
        sortOrder: index + 1,
        payload: company,
        createdAt: company.createdAt,
        updatedAt: company.updatedAt,
      }))
    )
  },
})
