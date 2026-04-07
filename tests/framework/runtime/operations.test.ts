import assert from "node:assert/strict"
import { existsSync, mkdtempSync, rmSync } from "node:fs"
import os from "node:os"
import path from "node:path"
import test from "node:test"

import { getServerConfig } from "../../../apps/framework/src/runtime/config/index.js"
import {
  createRuntimeDatabases,
  prepareApplicationDatabase,
} from "../../../apps/framework/src/runtime/database/index.js"
import {
  createDatabaseBackup,
  listDatabaseBackupDashboard,
  runDatabaseRestoreDrill,
} from "../../../apps/framework/src/runtime/operations/database-backup-service.js"
import {
  completeSecurityReview,
  getSecurityReviewDashboard,
  updateSecurityReviewItem,
} from "../../../apps/framework/src/runtime/operations/security-review-service.js"

test("database backup service creates local backups and records restore drills", async () => {
  const tempRoot = mkdtempSync(path.join(os.tmpdir(), "codexsun-ops-backup-"))

  try {
    const config = getServerConfig(tempRoot)
    config.database.driver = "sqlite"
    config.database.sqliteFile = path.join(tempRoot, "primary.sqlite")
    config.offline.enabled = false
    config.operations.backups.enabled = true
    config.operations.backups.cadenceHours = 24
    config.operations.backups.maxBackups = 5
    config.operations.backups.googleDrive.enabled = false

    const runtime = createRuntimeDatabases(config)

    try {
      await prepareApplicationDatabase(runtime)

      const backup = await createDatabaseBackup(runtime.primary, config, {
        trigger: "manual",
      })

      assert.equal(backup.status, "completed")
      assert.equal(backup.trigger, "manual")
      assert.equal(existsSync(backup.filePath), true)

      const drill = await runDatabaseRestoreDrill(runtime.primary, config, backup.id)

      assert.equal(drill.mode, "drill")
      assert.equal(drill.status, "completed")

      const dashboard = await listDatabaseBackupDashboard(runtime.primary, config)

      assert.equal(dashboard.backups.length, 1)
      assert.equal(dashboard.restoreRuns.length, 1)
      assert.equal(dashboard.backups[0]?.id, backup.id)
      assert.equal(dashboard.restoreRuns[0]?.id, drill.id)
      assert.match(dashboard.backupDirectory, /storage[\\\/]backups[\\\/]database$/)
    } finally {
      await runtime.destroy()
    }
  } finally {
    rmSync(tempRoot, { recursive: true, force: true })
  }
})

test("security review service seeds checklist items, updates status, and records review runs", async () => {
  const tempRoot = mkdtempSync(path.join(os.tmpdir(), "codexsun-ops-security-review-"))

  try {
    const config = getServerConfig(tempRoot)
    config.database.driver = "sqlite"
    config.database.sqliteFile = path.join(tempRoot, "primary.sqlite")
    config.offline.enabled = false

    const runtime = createRuntimeDatabases(config)

    try {
      await prepareApplicationDatabase(runtime)

      const initialDashboard = await getSecurityReviewDashboard(runtime.primary)

      assert.ok(initialDashboard.items.length >= 10)
      assert.equal(initialDashboard.counts.total, initialDashboard.items.length)

      const firstItem = initialDashboard.items[0]
      assert.ok(firstItem)

      const updateResult = await updateSecurityReviewItem(runtime.primary, firstItem.id, {
        status: "passed",
        evidence: "Validated from automated test.",
        notes: "No blocker.",
        reviewedBy: "security.owner@codexsun.local",
      })

      assert.equal(updateResult.item.status, "passed")
      assert.equal(updateResult.item.reviewedBy, "security.owner@codexsun.local")

      const runResult = await completeSecurityReview(runtime.primary, {
        reviewedBy: "security.owner@codexsun.local",
        summary: "Automated security review checkpoint.",
      })

      assert.equal(runResult.run.overallStatus, "healthy")

      const finalDashboard = await getSecurityReviewDashboard(runtime.primary)

      assert.equal(finalDashboard.counts.passed >= 1, true)
      assert.equal(finalDashboard.runs.length, 1)
      assert.equal(finalDashboard.runs[0]?.summary, "Automated security review checkpoint.")
    } finally {
      await runtime.destroy()
    }
  } finally {
    rmSync(tempRoot, { recursive: true, force: true })
  }
})
