import assert from "node:assert/strict"
import test from "node:test"

import {
  findFoundationSection,
  findFoundationTable,
  frameworkFoundationSections,
  platformMigrationSections,
} from "../../../apps/framework/src/runtime/database/index.js"

test("framework foundation sections stay ordered across the full platform baseline", () => {
  assert.deepEqual(
    frameworkFoundationSections.map((section) => section.order),
    [1, 2, 3, 4, 5, 6, 7, 8]
  )

  assert.equal(findFoundationSection("companies")?.name, "Companies As Client Root")
  assert.equal(findFoundationTable("auth_users")?.name, "auth_users")
  assert.equal(findFoundationTable("audit_logs")?.name, "audit_logs")
})

test("platform migration sections map one-to-one with schema foundation sections", () => {
  assert.deepEqual(
    platformMigrationSections.map((section) => section.schemaSectionKey),
    frameworkFoundationSections.map((section) => section.key)
  )

  const authMigration = platformMigrationSections.find(
    (section) => section.schemaSectionKey === "auth-control"
  )

  assert.ok(authMigration)
  assert.ok(authMigration.tableNames.includes("auth_users"))
  assert.ok(authMigration.tableNames.includes("company_memberships"))
})
