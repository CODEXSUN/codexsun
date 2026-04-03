import assert from "node:assert/strict"
import { mkdtempSync, rmSync } from "node:fs"
import os from "node:os"
import path from "node:path"
import test from "node:test"

import { listCommonModuleItems, listCommonModuleSummaries } from "../../apps/core/src/services/common-module-service.js"
import { commonModuleTableNames } from "../../apps/core/database/table-names.js"
import { asQueryDatabase } from "../../apps/core/src/data/query-database.js"
import { getServerConfig } from "../../apps/framework/src/runtime/config/index.js"
import {
  createRuntimeDatabases,
  prepareApplicationDatabase,
} from "../../apps/framework/src/runtime/database/index.js"

test("common module service returns empty results for missing physical tables instead of failing", async () => {
  const tempRoot = mkdtempSync(path.join(os.tmpdir(), "codexsun-core-common-modules-"))

  try {
    const config = getServerConfig(tempRoot)
    config.database.driver = "sqlite"
    config.database.sqliteFile = path.join(tempRoot, "primary.sqlite")
    config.offline.enabled = false

    const runtime = createRuntimeDatabases(config)

    try {
      await prepareApplicationDatabase(runtime)
      await asQueryDatabase(runtime.primary).schema.dropTable(commonModuleTableNames.sliderThemes).execute()

      const summaries = await listCommonModuleSummaries(runtime.primary)
      const sliderThemesSummary = summaries.items.find((item) => item.key === "sliderThemes")
      const sliderThemes = await listCommonModuleItems(runtime.primary, "sliderThemes")

      assert.equal(sliderThemesSummary?.itemCount, 0)
      assert.equal(sliderThemesSummary?.activeCount, 0)
      assert.deepEqual(sliderThemes.items, [])
    } finally {
      await runtime.destroy()
    }
  } finally {
    rmSync(tempRoot, { recursive: true, force: true })
  }
})
