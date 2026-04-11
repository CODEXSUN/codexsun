import assert from "node:assert/strict"
import test from "node:test"

import { formatDashboardDocumentTitle } from "../../apps/ui/src/features/dashboard/dashboard-metadata.ts"

test("dashboard document title uses page title and runtime brand", () => {
  assert.equal(
    formatDashboardDocumentTitle({
      brandName: "Tech Media",
      pageTitle: "Companies",
    }),
    "Companies | Tech Media"
  )
})

test("dashboard document title collapses to brand name when page title matches", () => {
  assert.equal(
    formatDashboardDocumentTitle({
      brandName: "Tech Media",
      pageTitle: "Tech Media",
    }),
    "Tech Media"
  )
})
