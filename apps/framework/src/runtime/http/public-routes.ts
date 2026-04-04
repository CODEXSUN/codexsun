import type { AppSuite } from "../../application/app-manifest.js"
import { createWorkspaceHostBaseline } from "../../application/workspace-baseline.js"
import { getAppSettingsSnapshot } from "../../../../core/src/services/auth-option-service.js"
import { getPrimaryCompanyBrandProfile } from "../../../../core/src/services/company-service.js"
import { getStorefrontCatalog } from "../../../../ecommerce/src/services/product-service.js"
import { ApplicationError } from "../errors/application-error.js"
import { readMediaContent } from "../media/media-service.js"

import { definePublicRoute } from "./route-manifest.js"
import type { HttpRouteDefinition } from "./route-types.js"

export function createPublicHttpRoutes(appSuite: AppSuite): HttpRouteDefinition[] {
  return [
    definePublicRoute("/bootstrap", {
      legacyPaths: ["/public/bootstrap"],
      summary: "Public bootstrap metadata for unauthenticated setup-aware surfaces.",
      handler: async ({ databases }) => ({
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
            settings: "/public/v1/app-settings",
          },
          settings: (await getAppSettingsSnapshot(databases.primary)).item,
        }),
      }),
    }),
    definePublicRoute("/app-settings", {
      summary: "Public DB-backed app settings snapshot used for startup metadata and global option caches.",
      handler: async ({ databases }) => ({
        statusCode: 200,
        headers: { "content-type": "application/json; charset=utf-8" },
        body: JSON.stringify(await getAppSettingsSnapshot(databases.primary)),
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
    definePublicRoute("/framework/media-file", {
      summary: "Serve a public framework media file by asset id.",
      handler: async ({ config, databases, request }) => {
        const mediaId = request.url.searchParams.get("id")

        if (!mediaId) {
          throw new ApplicationError("Media id is required.", {}, 400)
        }

        const { item, content } = await readMediaContent(databases.primary, config, mediaId)

        if (item.storageScope !== "public") {
          throw new ApplicationError("Media asset is not publicly available.", { mediaId }, 404)
        }

        return {
          statusCode: 200,
          headers: {
            "cache-control": "public, max-age=3600",
            "content-type": item.mimeType,
          },
          body: content,
        }
      },
    }),
  ]
}
