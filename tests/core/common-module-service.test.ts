import assert from "node:assert/strict"
import { mkdtempSync, rmSync } from "node:fs"
import os from "node:os"
import path from "node:path"
import test from "node:test"

import {
  createCommonModuleItem,
  deleteCommonModuleItem,
  getCommonModuleItem,
  listCommonModuleItems,
  listCommonModuleSummaries,
  updateCommonModuleItem,
} from "../../apps/core/src/services/common-module-service.js"
import { ApplicationError } from "../../apps/framework/src/runtime/errors/application-error.js"
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

test("common module service supports create, update, read, and delete against physical shared master tables", async () => {
  const tempRoot = mkdtempSync(path.join(os.tmpdir(), "codexsun-core-common-modules-crud-"))

  try {
    const config = getServerConfig(tempRoot)
    config.database.driver = "sqlite"
    config.database.sqliteFile = path.join(tempRoot, "primary.sqlite")
    config.offline.enabled = false

    const runtime = createRuntimeDatabases(config)

    try {
      await prepareApplicationDatabase(runtime)

      const created = await createCommonModuleItem(runtime.primary, "countries", {
        code: "AE",
        name: "United Arab Emirates",
        phone_code: "+971",
        isActive: true,
      })

      assert.equal(created.module, "countries")
      assert.equal(created.item.name, "United Arab Emirates")

      const fetched = await getCommonModuleItem(runtime.primary, "countries", created.item.id)
      assert.equal(fetched.item.code, "AE")

      const updated = await updateCommonModuleItem(runtime.primary, "countries", created.item.id, {
        code: "AE",
        name: "UAE",
        phone_code: "+971",
        isActive: false,
      })

      assert.equal(updated.item.name, "UAE")
      assert.equal(updated.item.isActive, false)

      const deleted = await deleteCommonModuleItem(runtime.primary, "countries", created.item.id)
      assert.equal(deleted.deleted, true)

      const countries = await listCommonModuleItems(runtime.primary, "countries")
      assert.equal(countries.items.some((item) => item.id === created.item.id), false)
      assert.equal(countries.items[0]?.id, "1")
      assert.equal(countries.items[0]?.name, "-")
    } finally {
      await runtime.destroy()
    }
  } finally {
    rmSync(tempRoot, { recursive: true, force: true })
  }
})

test("common module service keeps the seeded default record protected from deletion", async () => {
  const tempRoot = mkdtempSync(path.join(os.tmpdir(), "codexsun-core-common-modules-default-"))

  try {
    const config = getServerConfig(tempRoot)
    config.database.driver = "sqlite"
    config.database.sqliteFile = path.join(tempRoot, "primary.sqlite")
    config.offline.enabled = false

    const runtime = createRuntimeDatabases(config)

    try {
      await prepareApplicationDatabase(runtime)

      await assert.rejects(
        () => deleteCommonModuleItem(runtime.primary, "countries", "1"),
        (error: unknown) => {
          assert.ok(error instanceof ApplicationError)
          assert.equal(error.statusCode, 409)
          assert.match(error.message, /default record cannot be deleted/i)
          return true
        }
      )
    } finally {
      await runtime.destroy()
    }
  } finally {
    rmSync(tempRoot, { recursive: true, force: true })
  }
})

test("common module service blocks deleting referenced shared master records", async () => {
  const tempRoot = mkdtempSync(path.join(os.tmpdir(), "codexsun-core-common-modules-references-"))

  try {
    const config = getServerConfig(tempRoot)
    config.database.driver = "sqlite"
    config.database.sqliteFile = path.join(tempRoot, "primary.sqlite")
    config.offline.enabled = false

    const runtime = createRuntimeDatabases(config)

    try {
      await prepareApplicationDatabase(runtime)

      const country = await createCommonModuleItem(runtime.primary, "countries", {
        code: "SG",
        name: "Singapore",
        phone_code: "+65",
        isActive: true,
      })

      await createCommonModuleItem(runtime.primary, "states", {
        country_id: country.item.id,
        code: "SG-01",
        name: "Central",
        isActive: true,
      })

      await assert.rejects(
        () => deleteCommonModuleItem(runtime.primary, "countries", country.item.id),
        (error: unknown) => {
          assert.ok(error instanceof ApplicationError)
          assert.equal(error.statusCode, 409)
          assert.match(error.message, /referenced by States/i)
          return true
        }
      )
    } finally {
      await runtime.destroy()
    }
  } finally {
    rmSync(tempRoot, { recursive: true, force: true })
  }
})
