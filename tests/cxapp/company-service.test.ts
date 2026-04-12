import assert from "node:assert/strict"
import { mkdtempSync, rmSync } from "node:fs"
import os from "node:os"
import path from "node:path"
import test from "node:test"

import type { Kysely } from "kysely"

import { cxappTableNames } from "../../apps/cxapp/database/table-names.js"
import {
  getCompany,
  listCompanies,
} from "../../apps/cxapp/src/services/company-service.js"
import { getServerConfig } from "../../apps/framework/src/runtime/config/index.js"
import {
  createRuntimeDatabases,
  prepareApplicationDatabase,
} from "../../apps/framework/src/runtime/database/index.js"

type DynamicDatabase = Record<string, Record<string, unknown>>

test("company reads tolerate malformed persisted brand asset designer values", async () => {
  const tempRoot = mkdtempSync(path.join(os.tmpdir(), "codexsun-company-service-"))

  try {
    const config = getServerConfig(tempRoot)
    config.database.driver = "sqlite"
    config.database.sqliteFile = path.join(tempRoot, "primary.sqlite")
    config.offline.enabled = false

    const runtime = createRuntimeDatabases(config)

    try {
      await prepareApplicationDatabase(runtime)

      const queryDatabase = runtime.primary as Kysely<DynamicDatabase>
      const companyId = "company:legacy-branding"
      const timestamp = "2026-04-12T00:00:00.000Z"

      await queryDatabase
        .insertInto(cxappTableNames.companies)
        .values({
          id: companyId,
          module_key: "companies",
          sort_order: 99,
          created_at: timestamp,
          updated_at: timestamp,
          payload: JSON.stringify({
            id: companyId,
            name: "Legacy Branding Co",
            legalName: null,
            tagline: null,
            shortAbout: null,
            longAbout: null,
            registrationNumber: null,
            pan: null,
            financialYearStart: null,
            booksStart: null,
            website: null,
            description: null,
            facebookUrl: null,
            twitterUrl: null,
            instagramUrl: null,
            youtubeUrl: null,
            primaryEmail: null,
            primaryPhone: null,
            isPrimary: false,
            isActive: true,
            createdAt: timestamp,
            updatedAt: timestamp,
            logos: [],
            addresses: [],
            emails: [],
            phones: [],
            bankAccounts: [],
            brandAssetDesigner: {
              primary: {
                sourceUrl: "/storage/source/logo.svg",
                canvasWidth: "640",
                canvasHeight: 10,
                offsetX: "abc",
                offsetY: null,
                scale: "999",
                fillColor: "black",
                hoverFillColor: "#123456",
                colorMode: "legacy",
                colorOverrides: [
                  { source: "#ffffff", target: "#111111" },
                  { source: "white", target: "#000000" },
                ],
              },
              dark: "broken",
              favicon: null,
              print: {
                sourceUrl: "/storage/source/print.svg",
                canvasWidth: 420,
                canvasHeight: 120,
                offsetX: 12,
                offsetY: 4,
                scale: 100,
                fillColor: "#111111",
                hoverFillColor: "#222222",
                colorMode: "token",
                colorOverrides: [{ source: "#ffffff", target: "#000000" }],
              },
            },
          }),
        })
        .execute()

      const companies = await listCompanies(runtime.primary)
      const company = await getCompany(runtime.primary, {} as never, companyId)

      const listedCompany = companies.items.find((item) => item.id === companyId)

      assert.ok(listedCompany)
      assert.equal(company.item.brandAssetDesigner.primary.sourceUrl, "/storage/source/logo.svg")
      assert.equal(company.item.brandAssetDesigner.primary.canvasWidth, 640)
      assert.equal(company.item.brandAssetDesigner.primary.canvasHeight, 32)
      assert.equal(company.item.brandAssetDesigner.primary.offsetX, 0)
      assert.equal(company.item.brandAssetDesigner.primary.scale, 300)
      assert.equal(company.item.brandAssetDesigner.primary.fillColor, "#111111")
      assert.equal(company.item.brandAssetDesigner.primary.hoverFillColor, "#123456")
      assert.equal(company.item.brandAssetDesigner.primary.colorMode, "uniform")
      assert.deepEqual(company.item.brandAssetDesigner.primary.colorOverrides, [
        { source: "#ffffff", target: "#111111" },
      ])
      assert.equal(company.item.brandAssetDesigner.dark.sourceUrl, "")
      assert.equal(company.item.brandAssetDesigner.favicon.canvasWidth, 64)
      assert.equal(company.item.brandAssetDesigner.print.colorMode, "token")
    } finally {
      await runtime.destroy()
    }
  } finally {
    rmSync(tempRoot, { recursive: true, force: true })
  }
})
