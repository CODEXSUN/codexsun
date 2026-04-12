import assert from "node:assert/strict"
import { mkdtempSync, rmSync } from "node:fs"
import os from "node:os"
import path from "node:path"
import test from "node:test"

import { createInternalApiRoutes } from "../../../apps/api/src/internal/routes.js"
import { createCompany } from "../../../apps/cxapp/src/services/company-service.js"
import { createAuthService } from "../../../apps/cxapp/src/services/service-factory.js"
import {
  defaultCompanyBrandAssetDesigner,
  type CompanyBrandAssetDraftReadResponse,
  type CompanyBrandAssetDraftResponse,
} from "../../../apps/cxapp/shared/index.js"
import { createAppSuite } from "../../../apps/framework/src/application/app-suite.js"
import { getServerConfig } from "../../../apps/framework/src/runtime/config/index.js"
import {
  createRuntimeDatabases,
  prepareApplicationDatabase,
} from "../../../apps/framework/src/runtime/database/index.js"

test("internal route registry includes the company brand asset publish endpoint", () => {
  const routes = createInternalApiRoutes(createAppSuite())
  const routePaths = routes.map((route) => `${route.method} ${route.path}`)

  assert.ok(routePaths.includes("GET /internal/v1/cxapp/company-brand-draft"))
  assert.ok(routePaths.includes("PUT /internal/v1/cxapp/company-brand-draft"))
  assert.ok(routePaths.includes("POST /internal/v1/cxapp/company-brand-assets/publish"))
})

test("internal company brand draft routes save and read a temporary logo designer draft", async () => {
  const tempRoot = mkdtempSync(path.join(os.tmpdir(), "codexsun-company-brand-draft-routes-"))

  try {
    const config = getServerConfig(tempRoot)
    config.database.driver = "sqlite"
    config.database.sqliteFile = path.join(tempRoot, "primary.sqlite")
    config.offline.enabled = false

    const runtime = createRuntimeDatabases(config)

    try {
      await prepareApplicationDatabase(runtime)

      const appSuite = createAppSuite()
      const routes = createInternalApiRoutes(appSuite)
      const authService = createAuthService(runtime.primary, config)
      const adminLogin = await authService.login(
        {
          email: "sundar@sundar.com",
          password: "Kalarani1@@",
        },
        {
          ipAddress: "127.0.0.1",
          userAgent: "node:test",
        }
      )
      const headers = {
        authorization: `Bearer ${adminLogin.accessToken}`,
      }
      const company = await createCompany(runtime.primary, {} as never, {
        name: "Draft Route Co",
        legalName: "",
        tagline: "",
        shortAbout: "",
        longAbout: "",
        registrationNumber: "",
        pan: "",
        financialYearStart: "",
        booksStart: "",
        website: "",
        description: "",
        facebookUrl: "",
        twitterUrl: "",
        instagramUrl: "",
        youtubeUrl: "",
        isPrimary: false,
        isActive: true,
        logos: [],
        addresses: [],
        emails: [],
        phones: [],
        bankAccounts: [],
        brandAssetDesigner: defaultCompanyBrandAssetDesigner,
      })
      const getRoute = routes.find(
        (candidate) =>
          candidate.method === "GET" &&
          candidate.path === "/internal/v1/cxapp/company-brand-draft"
      )
      const putRoute = routes.find(
        (candidate) =>
          candidate.method === "PUT" &&
          candidate.path === "/internal/v1/cxapp/company-brand-draft"
      )

      assert.ok(getRoute)
      assert.ok(putRoute)

      const draftPayload = {
        designer: {
          ...defaultCompanyBrandAssetDesigner,
          primary: {
            ...defaultCompanyBrandAssetDesigner.primary,
            sourceUrl: "/storage/source/light.svg",
            canvasWidth: 420,
            offsetX: 14,
            fillColor: "#123456",
          },
          dark: {
            ...defaultCompanyBrandAssetDesigner.dark,
            sourceUrl: "/storage/source/dark.svg",
            canvasHeight: 140,
          },
          favicon: {
            ...defaultCompanyBrandAssetDesigner.favicon,
            sourceUrl: "/storage/source/favicon.svg",
          },
        },
      }
      const saveResponse = await putRoute.handler({
        appSuite,
        config,
        databases: runtime,
        request: {
          method: "PUT",
          pathname: "/internal/v1/cxapp/company-brand-draft",
          url: new URL(
            `http://localhost/internal/v1/cxapp/company-brand-draft?companyId=${encodeURIComponent(company.item.id)}`
          ),
          headers,
          bodyText: JSON.stringify(draftPayload),
          jsonBody: draftPayload,
        },
        route: {
          auth: putRoute.auth,
          path: putRoute.path,
          surface: putRoute.surface,
          version: putRoute.version,
        },
      })
      const savedPayload = JSON.parse(saveResponse.body) as CompanyBrandAssetDraftResponse

      assert.equal(saveResponse.statusCode, 200)
      assert.equal(savedPayload.item.companyId, company.item.id)
      assert.equal(savedPayload.item.designer.primary.canvasWidth, 420)
      assert.equal(savedPayload.item.designer.primary.fillColor, "#123456")

      const readResponse = await getRoute.handler({
        appSuite,
        config,
        databases: runtime,
        request: {
          method: "GET",
          pathname: "/internal/v1/cxapp/company-brand-draft",
          url: new URL(
            `http://localhost/internal/v1/cxapp/company-brand-draft?companyId=${encodeURIComponent(company.item.id)}`
          ),
          headers,
          bodyText: null,
          jsonBody: null,
        },
        route: {
          auth: getRoute.auth,
          path: getRoute.path,
          surface: getRoute.surface,
          version: getRoute.version,
        },
      })
      const readPayload = JSON.parse(readResponse.body) as CompanyBrandAssetDraftReadResponse

      assert.equal(readResponse.statusCode, 200)
      assert.equal(readPayload.item?.companyId, company.item.id)
      assert.equal(readPayload.item?.designer.primary.sourceUrl, "/storage/source/light.svg")
      assert.equal(readPayload.item?.designer.primary.offsetX, 14)
      assert.equal(readPayload.item?.designer.dark.canvasHeight, 140)
    } finally {
      await runtime.destroy()
    }
  } finally {
    rmSync(tempRoot, { recursive: true, force: true })
  }
})
