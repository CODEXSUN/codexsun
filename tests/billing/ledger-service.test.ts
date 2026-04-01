import assert from "node:assert/strict"
import { mkdtempSync, rmSync } from "node:fs"
import os from "node:os"
import path from "node:path"
import test from "node:test"

import {
  createBillingLedger,
  deleteBillingLedger,
  getBillingLedger,
  listBillingLedgers,
  updateBillingLedger,
} from "../../apps/billing/src/services/ledger-service.js"
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

test("billing ledger service supports create, read, update, and guarded delete", async () => {
  const tempRoot = mkdtempSync(path.join(os.tmpdir(), "codexsun-billing-ledger-service-"))

  try {
    const config = getServerConfig(tempRoot)
    config.database.driver = "sqlite"
    config.database.sqliteFile = path.join(tempRoot, "primary.sqlite")
    config.offline.enabled = false

    const runtime = createRuntimeDatabases(config)

    try {
      await prepareApplicationDatabase(runtime)

      const created = await createBillingLedger(runtime.primary, adminUser, {
        name: "Salary Payable",
        group: "Current Liabilities",
        nature: "liability",
        closingSide: "credit",
        closingAmount: 125000,
      })

      assert.equal(created.item.name, "Salary Payable")

      const fetched = await getBillingLedger(runtime.primary, adminUser, created.item.id)
      assert.equal(fetched.item.group, "Current Liabilities")

      const updated = await updateBillingLedger(runtime.primary, adminUser, created.item.id, {
        name: "Salary Payable",
        group: "Current Liabilities",
        nature: "liability",
        closingSide: "credit",
        closingAmount: 150000,
      })

      assert.equal(updated.item.closingAmount, 150000)

      const listed = await listBillingLedgers(runtime.primary)
      assert.equal(listed.items.some((item) => item.id === created.item.id), true)

      await assert.rejects(
        () => deleteBillingLedger(runtime.primary, adminUser, "ledger-sales"),
        (error: unknown) =>
          error instanceof ApplicationError &&
          error.statusCode === 409 &&
          error.message.includes("referenced by posted vouchers")
      )

      const deleted = await deleteBillingLedger(runtime.primary, adminUser, created.item.id)
      assert.equal(deleted.deleted, true)
    } finally {
      await runtime.destroy()
    }
  } finally {
    rmSync(tempRoot, { recursive: true, force: true })
  }
})
