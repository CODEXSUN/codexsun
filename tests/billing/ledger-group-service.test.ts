import assert from "node:assert/strict"
import { mkdtempSync, rmSync } from "node:fs"
import os from "node:os"
import path from "node:path"
import test from "node:test"

import {
  createBillingLedgerGroup,
  listBillingLedgerGroups,
} from "../../apps/billing/src/services/ledger-group-service.js"
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

test("billing ledger group service lists derived groups and supports create", async () => {
  const tempRoot = mkdtempSync(path.join(os.tmpdir(), "codexsun-billing-ledger-group-service-"))

  try {
    const config = getServerConfig(tempRoot)
    config.database.driver = "sqlite"
    config.database.sqliteFile = path.join(tempRoot, "primary.sqlite")
    config.offline.enabled = false

    const runtime = createRuntimeDatabases(config)

    try {
      await prepareApplicationDatabase(runtime)

      const listed = await listBillingLedgerGroups(runtime.primary)
      assert.equal(listed.items.some((item) => item.name === "Cash-in-Hand"), true)

      const created = await createBillingLedgerGroup(runtime.primary, adminUser, {
        name: "Loans & Advances",
        description: "New manually maintained billing group.",
      })

      assert.equal(created.item.name, "Loans & Advances")
      assert.equal(created.item.linkedLedgerCount, 0)

      await assert.rejects(
        () =>
          createBillingLedgerGroup(runtime.primary, adminUser, {
            name: "Cash-in-Hand",
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
