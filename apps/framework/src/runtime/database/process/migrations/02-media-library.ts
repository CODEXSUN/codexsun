import { ensureJsonStoreTable } from "../json-store.js"
import { defineDatabaseMigration } from "../types.js"
import { frameworkMediaTableNames } from "../../../media/media-table-names.js"

export const frameworkMediaLibraryMigration = defineDatabaseMigration({
  id: "framework:runtime:02-media-library",
  appId: "framework",
  moduleKey: "media-library",
  name: "Create framework media json-store tables",
  order: 20,
  up: async ({ database }) => {
    await ensureJsonStoreTable(database, frameworkMediaTableNames.folders)
    await ensureJsonStoreTable(database, frameworkMediaTableNames.files)
  },
})
