import assert from "node:assert/strict"
import { mkdtempSync, rmSync } from "node:fs"
import os from "node:os"
import path from "node:path"
import test from "node:test"

import {
  createBillingVoucherGroup,
  deleteBillingVoucherGroup,
  listBillingVoucherGroups,
  restoreBillingVoucherGroup,
  updateBillingVoucherGroup,
} from "../../apps/billing/src/services/voucher-group-service.js"
import {
  createBillingVoucherType,
  deleteBillingVoucherType,
  listBillingVoucherTypes,
  restoreBillingVoucherType,
  updateBillingVoucherType,
} from "../../apps/billing/src/services/voucher-type-service.js"
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

test("billing voucher group and voucher type services support seeded masters and CRUD", async () => {
  const tempRoot = mkdtempSync(path.join(os.tmpdir(), "codexsun-billing-voucher-master-service-"))

  try {
    const config = getServerConfig(tempRoot)
    config.database.driver = "sqlite"
    config.database.sqliteFile = path.join(tempRoot, "primary.sqlite")
    config.offline.enabled = false

    const runtime = createRuntimeDatabases(config)

    try {
      await prepareApplicationDatabase(runtime)

      const seededGroups = await listBillingVoucherGroups(runtime.primary)
      assert.ok(seededGroups.items.some((item) => item.name === "Sales"))

      await assert.rejects(
        () =>
          createBillingVoucherGroup(runtime.primary, adminUser, {
            name: "Receipt",
            postingType: "receipt",
            description: "Incoming collection lanes.",
          }),
        (error: unknown) =>
          error instanceof ApplicationError &&
          error.statusCode === 409 &&
          error.message.includes("already exists")
      )

      const customGroup = await createBillingVoucherGroup(runtime.primary, adminUser, {
        name: "Journal",
        description: "Adjustment journal lanes.",
      })

      const updatedGroup = await updateBillingVoucherGroup(
        runtime.primary,
        adminUser,
        customGroup.item.id,
        {
          name: "Journal",
          description: "Updated adjustment journal lanes.",
        }
      )

      assert.equal(updatedGroup.item.description, "Updated adjustment journal lanes.")

      const createdType = await createBillingVoucherType(runtime.primary, adminUser, {
        categoryId: "category-liabilities",
        ledgerId: "ledger-sundry-creditors",
        name: "Journal Adjustment Premium",
        voucherGroupId: customGroup.item.id,
        description: "Premium journal adjustment type.",
      })

      assert.equal(createdType.item.postingType, "journal")

      const updatedType = await updateBillingVoucherType(
        runtime.primary,
        adminUser,
        createdType.item.id,
        {
          categoryId: "category-liabilities",
          ledgerId: "ledger-sundry-creditors",
          name: "Journal Adjustment Premium",
          voucherGroupId: customGroup.item.id,
          description: "Updated premium journal adjustment type.",
        }
      )

      assert.equal(updatedType.item.description, "Updated premium journal adjustment type.")
      assert.equal(updatedType.item.categoryName, "Liabilities")
      assert.equal(updatedType.item.ledgerName, "Sundry Creditors")

      const listedTypes = await listBillingVoucherTypes(runtime.primary)
      assert.ok(listedTypes.items.some((item) => item.id === createdType.item.id))

      const deletedType = await deleteBillingVoucherType(runtime.primary, adminUser, createdType.item.id)
      assert.equal(deletedType.deleted, true)

      const restoredType = await restoreBillingVoucherType(runtime.primary, adminUser, createdType.item.id)
      assert.equal(restoredType.item.deletedAt, null)

      await deleteBillingVoucherType(runtime.primary, adminUser, createdType.item.id)
      const deletedGroup = await deleteBillingVoucherGroup(runtime.primary, adminUser, customGroup.item.id)
      assert.equal(deletedGroup.deleted, true)

      const restoredGroup = await restoreBillingVoucherGroup(runtime.primary, adminUser, customGroup.item.id)
      assert.equal(restoredGroup.item.deletedAt, null)
    } finally {
      await runtime.destroy()
    }
  } finally {
    rmSync(tempRoot, { recursive: true, force: true })
  }
})
