import type { AppSuite } from "../../../framework/src/application/app-manifest.js"
import { createWorkspaceHostBaseline } from "../../../framework/src/application/workspace-baseline.js"
import { getAppSettingsSnapshot } from "../../../cxapp/src/services/auth-option-service.js"
import {
  readPublishedBrandAsset,
} from "../../../cxapp/src/services/company-brand-assets-service.js"
import { getPrimaryCompanyBrandProfile } from "../../../cxapp/src/services/company-service.js"
import {
  getStorefrontCatalog,
  getStorefrontLanding,
  getStorefrontLegalPage,
  getStorefrontProduct,
} from "../../../ecommerce/src/services/catalog-service.js"
import { trackOrderByReference } from "../../../ecommerce/src/services/order-service.js"
import { getRazorpayPaymentConfig } from "../../../ecommerce/src/services/razorpay-service.js"
import {
  getStorefrontRobotsTxt,
  getStorefrontSitemapXml,
} from "../../../ecommerce/src/services/storefront-seo-service.js"
import { getStorefrontSettings } from "../../../ecommerce/src/services/storefront-settings-service.js"
import { ApplicationError } from "../../../framework/src/runtime/errors/application-error.js"
import { readMediaContent } from "../../../framework/src/runtime/media/media-service.js"

import { definePublicRoute } from "../../../framework/src/runtime/http/route-manifest.js"
import type { HttpRouteDefinition } from "../../../framework/src/runtime/http/route-types.js"

export function createPublicApiRoutes(appSuite: AppSuite): HttpRouteDefinition[] {
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
      summary: "Public storefront catalog composed from core product masters and ecommerce settings.",
      handler: async ({ databases, request }) => ({
        statusCode: 200,
        headers: { "content-type": "application/json; charset=utf-8" },
        body: JSON.stringify(
          await getStorefrontCatalog(databases.primary, {
            search: request.url.searchParams.get("search") ?? undefined,
            category: request.url.searchParams.get("category") ?? undefined,
            department: request.url.searchParams.get("department") ?? undefined,
            tag: request.url.searchParams.get("tag") ?? undefined,
            sort: request.url.searchParams.get("sort") ?? undefined,
          })
        ),
      }),
    }),
    definePublicRoute("/storefront/home", {
      summary: "Public storefront landing payload for hero, categories, and product rails.",
      handler: async ({ databases }) => ({
        statusCode: 200,
        headers: { "content-type": "application/json; charset=utf-8" },
        body: JSON.stringify(await getStorefrontLanding(databases.primary)),
      }),
    }),
    definePublicRoute("/storefront/settings", {
      summary: "Public storefront settings used by cart, checkout, and other non-home surfaces.",
      handler: async ({ databases }) => ({
        statusCode: 200,
        headers: { "content-type": "application/json; charset=utf-8" },
        body: JSON.stringify(await getStorefrontSettings(databases.primary)),
      }),
    }),
    definePublicRoute("/storefront/product", {
      summary: "Public storefront product detail payload resolved by id or slug.",
      handler: async ({ databases, request }) => ({
        statusCode: 200,
        headers: { "content-type": "application/json; charset=utf-8" },
        body: JSON.stringify(
          await getStorefrontProduct(databases.primary, {
            id: request.url.searchParams.get("id"),
            slug: request.url.searchParams.get("slug"),
          })
        ),
      }),
    }),
    definePublicRoute("/storefront/legal-page", {
      summary: "Public storefront legal and trust page payload by page id.",
      handler: async ({ databases, request }) => {
        const pageId = (request.url.searchParams.get("pageId") ?? "").trim().toLowerCase()

        if (
          pageId !== "shipping" &&
          pageId !== "returns" &&
          pageId !== "privacy" &&
          pageId !== "terms" &&
          pageId !== "contact"
        ) {
          throw new ApplicationError("A valid legal page id is required.", { pageId }, 400)
        }

        return {
          statusCode: 200,
          headers: { "content-type": "application/json; charset=utf-8" },
          body: JSON.stringify(
            await getStorefrontLegalPage(databases.primary, pageId)
          ),
        }
      },
    }),
    definePublicRoute("/storefront/track-order", {
      summary: "Public storefront order tracking lookup by order number and email.",
      handler: async ({ databases, request }) => ({
        statusCode: 200,
        headers: { "content-type": "application/json; charset=utf-8" },
        body: JSON.stringify(
          await trackOrderByReference(databases.primary, {
            orderNumber: request.url.searchParams.get("orderNumber") ?? "",
            email: request.url.searchParams.get("email") ?? "",
          })
        ),
      }),
    }),
    definePublicRoute("/storefront/payment-config", {
      summary: "Public Razorpay checkout configuration for the storefront frontend.",
      handler: async ({ config }) => ({
        statusCode: 200,
        headers: { "content-type": "application/json; charset=utf-8" },
        body: JSON.stringify(getRazorpayPaymentConfig(config)),
      }),
    }),
    definePublicRoute("/storefront/robots.txt", {
      legacyPaths: ["/robots.txt"],
      summary: "Public crawl policy for the storefront surface.",
      handler: async ({ config }) => ({
        statusCode: 200,
        headers: { "content-type": "text/plain; charset=utf-8" },
        body: getStorefrontRobotsTxt(config),
      }),
    }),
    definePublicRoute("/storefront/sitemap.xml", {
      legacyPaths: ["/sitemap.xml"],
      summary: "Public storefront sitemap baseline for canonical public pages.",
      handler: async ({ config, databases }) => ({
        statusCode: 200,
        headers: { "content-type": "application/xml; charset=utf-8" },
        body: await getStorefrontSitemapXml(databases.primary, config),
      }),
    }),
    definePublicRoute("/brand-profile", {
      summary: "Public primary company brand profile for shell and storefront surfaces.",
      handler: async ({ databases, config }) => ({
        statusCode: 200,
        headers: { "content-type": "application/json; charset=utf-8" },
        body: JSON.stringify(await getPrimaryCompanyBrandProfile(databases.primary, config)),
      }),
    }),
    definePublicRoute("/brand-logo", {
      summary: "Serve the active public primary brand logo asset.",
      handler: async ({ config }) => {
        const { content, mimeType } = await readPublishedBrandAsset(config, "primary")

        return {
          statusCode: 200,
          headers: {
            "cache-control": "no-store, no-cache, must-revalidate",
            "content-type": mimeType,
          },
          body: content,
        }
      },
    }),
    definePublicRoute("/brand-logo-dark", {
      summary: "Serve the active public dark brand logo asset.",
      handler: async ({ config }) => {
        const { content, mimeType } = await readPublishedBrandAsset(config, "dark")

        return {
          statusCode: 200,
          headers: {
            "cache-control": "no-store, no-cache, must-revalidate",
            "content-type": mimeType,
          },
          body: content,
        }
      },
    }),
    definePublicRoute("/brand-favicon", {
      summary: "Serve the active public favicon brand asset.",
      handler: async ({ config }) => {
        const { content, mimeType } = await readPublishedBrandAsset(config, "favicon")

        return {
          statusCode: 200,
          headers: {
            "cache-control": "no-store, no-cache, must-revalidate",
            "content-type": mimeType,
          },
          body: content,
        }
      },
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
