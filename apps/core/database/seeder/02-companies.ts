import { replaceJsonStoreRecords } from "../../../framework/src/runtime/database"
import { defineDatabaseSeeder } from "../../../framework/src/runtime/database/process/types.js"

import { companies } from "../../src/data/core-seed.js"

import { coreTableNames } from "../table-names.js"

export const coreCompaniesSeeder = defineDatabaseSeeder({
  id: "core:companies:02-companies",
  appId: "core",
  moduleKey: "companies",
  name: "Seed core companies",
  order: 20,
  run: async ({ database }) => {
    await replaceJsonStoreRecords(
      database,
      coreTableNames.companies,
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
