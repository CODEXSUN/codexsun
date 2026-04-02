import assert from "node:assert/strict"
import { mkdtempSync, rmSync } from "node:fs"
import os from "node:os"
import path from "node:path"
import test from "node:test"

import {
  createBillingCategory,
  deleteBillingCategory,
  getBillingCategory,
  listBillingCategories,
  restoreBillingCategory,
  updateBillingCategory,
} from "../../apps/billing/src/services/category-service.js"
import { getServerConfig } from "../../apps/framework/src/runtime/config/index.js"
import {
  createRuntimeDatabases,
  prepareApplicationDatabase,
} from "../../apps/framework/src/runtime/database/index.js"
import { ApplicationError } from "../../apps/framework/src/runtime/errors/application-error.js"

const adminUser = {
  id: "auth-user:platform-admin",
  email: "sundar@sundar.com",
  phoneNumber: "9999999999",
  displayName: "Sundar",
  actorType: "admin" as const,
  isSuperAdmin: true,
  avatarUrl: null,
  isActive: true,
  organizationName: "Codexsun",
  roles: [],
  permissions: [],
  createdAt: "2026-03-30T00:00:00.000Z",
  updatedAt: "2026-03-30T00:00:00.000Z",
}

test("billing category service lists seeded categories and supports create, update, soft delete, and restore", async () => {
  const tempRoot = mkdtempSync(path.join(os.tmpdir(), "codexsun-billing-category-service-"))

  try {
    const config = getServerConfig(tempRoot)
    config.database.driver = "sqlite"
    config.database.sqliteFile = path.join(tempRoot, "primary.sqlite")
    config.offline.enabled = false

    const runtime = createRuntimeDatabases(config)

    try {
      await prepareApplicationDatabase(runtime)

      const listed = await listBillingCategories(runtime.primary)
      const assetsCategory = listed.items.find((item) => item.name === "Assets")

      assert.ok(assetsCategory)

      const created = await createBillingCategory(runtime.primary, adminUser, {
        name: "Loans & Advances",
        description: "New custom category for future expansion.",
      })

      assert.equal(created.item.name, "Loans & Advances")
      assert.equal(created.item.nature, null)

      const fetched = await getBillingCategory(runtime.primary, adminUser, assetsCategory.id)
      assert.equal(
        fetched.item.description.includes("Fixed Assets, Current Assets"),
        true
      )

      const updated = await updateBillingCategory(
        runtime.primary,
        adminUser,
        assetsCategory.id,
        {
          name: "Assets",
          description: "Updated top-level category description for asset buckets.",
        }
      )

      assert.equal(updated.item.name, "Assets")
      assert.equal(
        updated.item.description,
        "Updated top-level category description for asset buckets."
      )

      const deleted = await deleteBillingCategory(runtime.primary, adminUser, assetsCategory.id)
      assert.equal(deleted.deleted, true)

      const deletedCategory = await getBillingCategory(runtime.primary, adminUser, assetsCategory.id)
      assert.notEqual(deletedCategory.item.deletedAt, null)

      const restored = await restoreBillingCategory(runtime.primary, adminUser, assetsCategory.id)
      assert.equal(restored.item.deletedAt, null)

      await assert.rejects(
        () =>
          createBillingCategory(runtime.primary, adminUser, {
            name: "Loans & Advances",
            description: "",
          }),
        (error: unknown) =>
          error instanceof ApplicationError &&
          error.statusCode === 409 &&
          error.message.includes("already exists")
      )
    } finally {
      await runtime.destroy()
    }
  } finally {
    rmSync(tempRoot, { recursive: true, force: true })
  }
})
