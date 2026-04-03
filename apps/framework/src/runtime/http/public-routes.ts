import type { AppSuite } from "../../application/app-manifest.js"
import { createWorkspaceHostBaseline } from "../../application/workspace-baseline.js"
import { getPrimaryCompanyBrandProfile } from "../../../../core/src/services/company-service.js"
import { getStorefrontCatalog } from "../../../../ecommerce/src/services/product-service.js"

import { definePublicRoute } from "./route-manifest.js"
import type { HttpRouteDefinition } from "./route-types.js"

export function createPublicHttpRoutes(appSuite: AppSuite): HttpRouteDefinition[] {
  return [
    definePublicRoute("/bootstrap", {
      legacyPaths: ["/public/bootstrap"],
      summary: "Public bootstrap metadata for unauthenticated setup-aware surfaces.",
      handler: () => ({
        statusCode: 200,
        headers: { "content-type": "application/json; charset=utf-8" },
        body: JSON.stringify({
          scope: "public",
          app: {
            id: appSuite.framework.id,
            name: "codexsun",
          },
          activeShell: createWorkspaceHostBaseline(appSuite).activeShell,
          routes: {
            health: "/public/v1/health",
            apps: "/api/v1/apps",
          },
        }),
      }),
    }),
    definePublicRoute("/storefront/catalog", {
      legacyPaths: ["/public/storefront/catalog"],
      summary: "Public storefront catalog projection for commerce-facing surfaces.",
      handler: async ({ databases }) => ({
        statusCode: 200,
        headers: { "content-type": "application/json; charset=utf-8" },
        body: JSON.stringify(await getStorefrontCatalog(databases.primary)),
      }),
    }),
    definePublicRoute("/brand-profile", {
      summary: "Public primary company brand profile for shell and storefront surfaces.",
      handler: async ({ databases }) => ({
        statusCode: 200,
        headers: { "content-type": "application/json; charset=utf-8" },
        body: JSON.stringify(await getPrimaryCompanyBrandProfile(databases.primary)),
      }),
    }),
  ]
}
