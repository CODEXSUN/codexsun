import { replaceJsonStoreRecords } from "../../../framework/src/runtime/database/process/json-store.js"
import { defineDatabaseSeeder } from "../../../framework/src/runtime/database/process/types.js"

import { commonModuleItemsByKey, commonModuleMetadata } from "../../src/data/core-seed.js"
import type { CommonModuleKey } from "../../shared/index.js"

import { coreTableNames } from "../table-names.js"

export const coreCommonModulesSeeder = defineDatabaseSeeder({
  id: "core:common-modules:04-common-modules",
  appId: "core",
  moduleKey: "common-modules",
  name: "Seed core common module metadata and items",
  order: 40,
  run: async ({ database }) => {
    await replaceJsonStoreRecords(
      database,
      coreTableNames.commonModuleMetadata,
      commonModuleMetadata.map((module, index) => ({
        id: module.key,
        moduleKey: module.key,
        sortOrder: index + 1,
        payload: module,
      }))
    )

    await replaceJsonStoreRecords(
      database,
      coreTableNames.commonModuleItems,
      (
        Object.entries(commonModuleItemsByKey) as Array<
          [CommonModuleKey, (typeof commonModuleItemsByKey)[CommonModuleKey]]
        >
      ).flatMap(([moduleKey, items]) =>
        items.map((item, index) => ({
          id: item.id,
          moduleKey,
          sortOrder: index + 1,
          payload: item,
          createdAt: item.createdAt,
          updatedAt: item.updatedAt,
        }))
      )
    )
  },
})
