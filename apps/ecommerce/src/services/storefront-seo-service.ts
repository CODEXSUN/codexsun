import type { Kysely } from "kysely"

import {
  buildStorefrontAbsoluteUrl,
  normalizeStorefrontCanonicalPath,
  storefrontLegalPageIds,
  type StorefrontSeoTarget,
} from "../../shared/index.js"
import type { ServerConfig } from "../../../framework/src/runtime/config/index.js"

import { readProjectedStorefrontProducts } from "./projected-product-service.js"
import { getStorefrontSettings } from "./storefront-settings-service.js"

function escapeXml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;")
}

function normalizeHost(value: string) {
  return value.trim().replace(/^https?:\/\//, "").replace(/\/+$/, "")
}

export function resolveStorefrontPublicOrigin(config: Pick<
  ServerConfig,
  | "cloudflareEnabled"
  | "frontendDomain"
  | "frontendHttpPort"
  | "frontendHttpsPort"
  | "tlsEnabled"
>) {
  const protocol = config.tlsEnabled || config.cloudflareEnabled ? "https" : "http"
  const host = normalizeHost(config.frontendDomain)
  const hasPort = /:\d+$/.test(host)
  const port = protocol === "https" ? config.frontendHttpsPort : config.frontendHttpPort
  const includePort =
    !hasPort &&
    !((protocol === "https" && port === 443) || (protocol === "http" && port === 80))

  return `${protocol}://${host}${includePort ? `:${port}` : ""}`
}

export function getStorefrontRobotsTxt(
  config: Pick<
    ServerConfig,
    | "cloudflareEnabled"
    | "frontendDomain"
    | "frontendHttpPort"
    | "frontendHttpsPort"
    | "tlsEnabled"
  >
) {
  const origin = resolveStorefrontPublicOrigin(config)

  return [
    "User-agent: *",
    "Allow: /",
    "Disallow: /cart",
    "Disallow: /checkout",
    "Disallow: /track-order",
    "Disallow: /customer",
    "Disallow: /account",
    "Disallow: /profile",
    "Disallow: /shop/cart",
    "Disallow: /shop/checkout",
    "Disallow: /shop/track-order",
    "Disallow: /shop/customer",
    "Disallow: /shop/account",
    "Disallow: /shop/profile",
    `Sitemap: ${origin}/sitemap.xml`,
  ].join("\n")
}

export async function getStorefrontSitemapXml(
  database: Kysely<unknown>,
  config: Pick<
    ServerConfig,
    | "cloudflareEnabled"
    | "frontendDomain"
    | "frontendHttpPort"
    | "frontendHttpsPort"
    | "frontendTarget"
    | "tlsEnabled"
  >
) {
  const settings = await getStorefrontSettings(database)
  const products = await readProjectedStorefrontProducts(database)
  const origin = resolveStorefrontPublicOrigin(config)
  const target = config.frontendTarget as StorefrontSeoTarget
  const staticEntries = [
    { path: "/", lastmod: settings.updatedAt },
    { path: "/catalog", lastmod: settings.updatedAt },
    ...storefrontLegalPageIds.map((pageId) => ({
      path: `/${pageId}`,
      lastmod: settings.updatedAt,
    })),
  ]
  const productEntries = products
    .filter((item) => item.isActive && item.slug.trim().length > 0)
    .map((item) => ({
      path: `/products/${encodeURIComponent(item.slug)}`,
      lastmod: item.updatedAt,
    }))

  const urlEntries = [...staticEntries, ...productEntries]
    .map((entry) => {
      const loc = buildStorefrontAbsoluteUrl(origin, entry.path, target)
      const lastmod = entry.lastmod ? `<lastmod>${escapeXml(entry.lastmod)}</lastmod>` : ""

      return `<url><loc>${escapeXml(loc)}</loc>${lastmod}</url>`
    })
    .join("")

  return `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urlEntries}</urlset>`
}

export function resolveStorefrontCanonicalUrl(
  origin: string,
  pathname: string,
  target: StorefrontSeoTarget
) {
  return buildStorefrontAbsoluteUrl(origin, normalizeStorefrontCanonicalPath(pathname, target), target)
}
