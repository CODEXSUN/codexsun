import { access, copyFile, mkdir, readFile, rm, writeFile } from "node:fs/promises"
import path from "node:path"

import type { Kysely } from "kysely"

import {
  companyBrandAssetPublishPayloadSchema,
  companyBrandAssetPublishResponseSchema,
  type CompanyBrandAssetPublishPayload,
  type CompanyBrandAssetPublishResponse,
  type CompanyBrandAssetDesignerVariant,
} from "../../shared/index.js"
import { ApplicationError } from "../../../framework/src/runtime/errors/application-error.js"
import { readMediaContent } from "../../../framework/src/runtime/media/media-service.js"
import type { ServerConfig } from "../../../framework/src/runtime/config/index.js"

type BrandAssetVariant = "primary" | "dark" | "favicon"

type PublishedBrandAssetManifest = {
  format: "svg"
  publishedAt: string
  version: string
  assets: Record<
    BrandAssetVariant,
    {
      fileName: string
      mimeType: "image/svg+xml"
      sourceUrl: string
    }
  >
}

type ResolvedBrandAssetSource = {
  extension: string
  mimeType: string
  sourceUrl: string
  content: Buffer
}

function decodeSvgTextBuffer(content: Uint8Array) {
  const bytes = content instanceof Buffer ? content : Buffer.from(content)

  if (bytes.length >= 2) {
    if (bytes[0] === 0xff && bytes[1] === 0xfe) {
      return new TextDecoder("utf-16le").decode(bytes.subarray(2)).replace(/^\uFEFF/, "")
    }

    if (bytes[0] === 0xfe && bytes[1] === 0xff) {
      return new TextDecoder("utf-16be").decode(bytes.subarray(2)).replace(/^\uFEFF/, "")
    }
  }

  const sample = bytes.subarray(0, Math.min(bytes.length, 64))
  const evenZeros = sample.filter((_, index) => index % 2 === 0 && sample[index] === 0).length
  const oddZeros = sample.filter((_, index) => index % 2 === 1 && sample[index] === 0).length
  const utf16LeLikely = oddZeros >= Math.max(4, Math.floor(sample.length / 4))
  const utf16BeLikely = evenZeros >= Math.max(4, Math.floor(sample.length / 4))

  if (utf16LeLikely) {
    return new TextDecoder("utf-16le").decode(bytes).replace(/^\uFEFF/, "")
  }

  if (utf16BeLikely) {
    return new TextDecoder("utf-16be").decode(bytes).replace(/^\uFEFF/, "")
  }

  return new TextDecoder("utf-8").decode(bytes).replace(/^\uFEFF/, "")
}

const legacyBrandAssetPaths: Record<BrandAssetVariant, { fileName: string; mimeType: "image/svg+xml" }> = {
  primary: { fileName: "logo.svg", mimeType: "image/svg+xml" },
  dark: { fileName: "logo-dark.svg", mimeType: "image/svg+xml" },
  favicon: { fileName: "favicon.svg", mimeType: "image/svg+xml" },
}

function brandStorageRoot(config: ServerConfig) {
  return path.join(repositoryRoot(config), "storage", "branding")
}

function brandBackupRoot(config: ServerConfig) {
  return path.join(repositoryRoot(config), "storage", "backups", "branding")
}

function brandManifestPath(config: ServerConfig) {
  return path.join(brandStorageRoot(config), "active", "brand-assets.json")
}

function publicBrandDirectory(config: ServerConfig) {
  return path.join(repositoryRoot(config), "public")
}

function repositoryRoot(config: ServerConfig) {
  return path.resolve(config.webRoot, "..", "..", "..", "..")
}

function activeBrandDirectory(config: ServerConfig) {
  return path.join(brandStorageRoot(config), "active")
}

function buildManagedBrandAssetPublicUrl(variant: BrandAssetVariant, version?: string) {
  const fileName = legacyBrandAssetPaths[variant].fileName

  return version
    ? `/${fileName}?v=${encodeURIComponent(version)}`
    : `/${fileName}`
}

function buildLegacyBrandAssetPublicUrl(variant: BrandAssetVariant) {
  return `/${legacyBrandAssetPaths[variant].fileName}`
}

async function pathExists(targetPath: string) {
  try {
    await access(targetPath)
    return true
  } catch {
    return false
  }
}

function extractPathname(sourceUrl: string) {
  if (sourceUrl.startsWith("http://") || sourceUrl.startsWith("https://")) {
    throw new ApplicationError(
      "Publishing brand assets only supports local managed media or root-relative public assets.",
      { sourceUrl },
      400
    )
  }

  if (!sourceUrl.startsWith("/")) {
    throw new ApplicationError("Brand asset sources must be root-relative URLs.", { sourceUrl }, 400)
  }

  const parsed = new URL(sourceUrl, "http://codexsun.local")
  return {
    pathname: parsed.pathname,
    searchParams: parsed.searchParams,
  }
}

function resolvePublicPath(config: ServerConfig, relativeUrlPath: string) {
  const targetPath = path.resolve(publicBrandDirectory(config), relativeUrlPath.replace(/^\/+/, ""))
  const allowedRoot = path.resolve(publicBrandDirectory(config))

  if (!targetPath.startsWith(allowedRoot)) {
    throw new ApplicationError("Brand asset path escapes the public directory.", { relativeUrlPath }, 400)
  }

  return targetPath
}

function resolveStoragePath(config: ServerConfig, relativeUrlPath: string) {
  const targetPath = path.resolve(repositoryRoot(config), relativeUrlPath.replace(/^\/+/, ""))
  const allowedRoot = path.resolve(repositoryRoot(config), "storage")

  if (!targetPath.startsWith(allowedRoot)) {
    throw new ApplicationError("Brand asset path escapes the storage directory.", { relativeUrlPath }, 400)
  }

  return targetPath
}

function resolveLegacyStoragePath(config: ServerConfig, relativeUrlPath: string) {
  const targetPath = path.resolve(config.webRoot, relativeUrlPath.replace(/^\/+/, ""))
  const allowedRoot = path.resolve(config.webRoot, "storage")

  if (!targetPath.startsWith(allowedRoot)) {
    throw new ApplicationError("Brand asset path escapes the legacy storage directory.", { relativeUrlPath }, 400)
  }

  return targetPath
}

async function resolveBrandAssetSource(
  database: Kysely<unknown>,
  config: ServerConfig,
  sourceUrl: string
): Promise<ResolvedBrandAssetSource> {
  const { pathname, searchParams } = extractPathname(sourceUrl.trim())

  if (
    pathname === "/internal/v1/framework/media-file" ||
    pathname === "/public/v1/framework/media-file"
  ) {
    const mediaId = searchParams.get("id")

    if (!mediaId) {
      throw new ApplicationError("Media id is required for framework media URLs.", { sourceUrl }, 400)
    }

    const { item, content } = await readMediaContent(database, config, mediaId)

    return {
      extension: path.extname(item.fileName ?? "").replace(/^\./, "").toLowerCase(),
      mimeType: item.mimeType,
      sourceUrl,
      content,
    }
  }

  let absolutePath: string

  if (pathname.startsWith("/storage/")) {
    const nextStoragePath = resolveStoragePath(config, pathname)
    absolutePath =
      (await pathExists(nextStoragePath))
        ? nextStoragePath
        : resolveLegacyStoragePath(config, pathname)
  } else {
    absolutePath = resolvePublicPath(config, pathname)
  }

  return {
    extension: path.extname(pathname).replace(/^\./, "").toLowerCase(),
    mimeType: "image/svg+xml",
    sourceUrl,
    content: await readFile(absolutePath),
  }
}

function createBrandVersion(publishedAt: string) {
  return publishedAt.replace(/[:.]/g, "-")
}

function parseSvgLength(value: string | null | undefined) {
  if (!value) {
    return null
  }

  const match = value.match(/-?\d+(?:\.\d+)?/)
  return match ? Number(match[0]) : null
}

function extractSvgAttribute(attributes: string, name: string) {
  const pattern = new RegExp(`${name}\\s*=\\s*["']([^"']+)["']`, "i")
  return attributes.match(pattern)?.[1] ?? null
}

function normalizeHexColor(value: string | null | undefined) {
  if (!value) {
    return null
  }

  const normalized = value.trim()

  if (/^#[0-9a-fA-F]{6}$/.test(normalized)) {
    return normalized.toLowerCase()
  }

  if (/^#[0-9a-fA-F]{3}$/.test(normalized)) {
    return `#${normalized[1]}${normalized[1]}${normalized[2]}${normalized[2]}${normalized[3]}${normalized[3]}`.toLowerCase()
  }

  return null
}

function sanitizeSvgSource(svgSource: string) {
  return svgSource
    .replace(/^\uFEFF/, "")
    .replace(/<\?xml[\s\S]*?\?>/gi, "")
    .replace(/<!DOCTYPE[\s\S]*?>/gi, "")
    .replace(/<!--[\s\S]*?-->/g, "")
    .replace(/<metadata\b[^>]*>[\s\S]*?<\/metadata>/gi, "")
    .replace(/<metadata\b[^>]*\/>/gi, "")
    .trim()
}

function parseSourceSvg(svgSource: string) {
  const sanitizedSource = sanitizeSvgSource(svgSource)
  const rootMatch = sanitizedSource.match(/<svg\b([^>]*)>([\s\S]*)<\/svg>/i)
  const selfClosingMatch = sanitizedSource.match(/<svg\b([^>]*)\/>/i)

  if (!rootMatch && !selfClosingMatch) {
    throw new ApplicationError("The selected source does not contain a valid SVG document.", {}, 400)
  }

  const attributes = rootMatch?.[1] ?? selfClosingMatch?.[1] ?? ""
  const innerMarkup = rootMatch?.[2] ?? ""
  const width = parseSvgLength(extractSvgAttribute(attributes, "width"))
  const height = parseSvgLength(extractSvgAttribute(attributes, "height"))
  const viewBox = extractSvgAttribute(attributes, "viewBox")
  const viewBoxParts = viewBox?.split(/[\s,]+/).map(Number).filter(Number.isFinite) ?? []
  const parsedWidth = width ?? (viewBoxParts.length === 4 ? (viewBoxParts[2] ?? 100) : 100)
  const parsedHeight = height ?? (viewBoxParts.length === 4 ? (viewBoxParts[3] ?? 100) : 100)
  const resolvedViewBox =
    viewBoxParts.length === 4
      ? viewBoxParts.join(" ")
      : `0 0 ${parsedWidth} ${parsedHeight}`

  return {
    innerMarkup,
    viewBox: resolvedViewBox,
    width: Math.max(1, parsedWidth),
    height: Math.max(1, parsedHeight),
  }
}

function rewriteSvgHexColors(
  svgMarkup: string,
  resolveReplacement: (normalizedColor: string) => string | null
) {
  return svgMarkup
    .replace(
      /(fill|stroke)\s*=\s*(["'])(#[0-9a-fA-F]{3,8})\2/gi,
      (match, attributeName: string, quote: string, colorValue: string) => {
        const normalizedColor = normalizeHexColor(colorValue)
        const replacement = normalizedColor ? resolveReplacement(normalizedColor) : null

        return replacement ? `${attributeName}=${quote}${replacement}${quote}` : match
      }
    )
    .replace(/(fill|stroke)\s*:\s*(#[0-9a-fA-F]{3,8})/gi, (match, propertyName: string, colorValue: string) => {
      const normalizedColor = normalizeHexColor(colorValue)
      const replacement = normalizedColor ? resolveReplacement(normalizedColor) : null

      return replacement ? `${propertyName}:${replacement}` : match
    })
}

function applySvgDesignerColors(
  svgMarkup: string,
  designer: CompanyBrandAssetDesignerVariant
) {
  const overrideMap = new Map(
    (designer.colorOverrides ?? []).map((entry) => [entry.source.toLowerCase(), entry.target.toLowerCase()])
  )

  if (designer.colorMode === "token") {
    if (overrideMap.size === 0) {
      return svgMarkup
    }

    return rewriteSvgHexColors(svgMarkup, (normalizedColor) => overrideMap.get(normalizedColor) ?? null)
  }

  return rewriteSvgHexColors(svgMarkup, () => designer.fillColor)
}

function buildDesignedSvg(sourceSvg: string, designer: CompanyBrandAssetDesignerVariant) {
  const parsed = parseSourceSvg(sourceSvg)
  const scaledWidth = Math.max(1, Number((parsed.width * designer.scale) / 100))
  const scaledHeight = Math.max(1, Number((parsed.height * designer.scale) / 100))
  const recoloredMarkup = applySvgDesignerColors(parsed.innerMarkup, designer)

  return [
    `<svg xmlns="http://www.w3.org/2000/svg" width="${designer.canvasWidth}" height="${designer.canvasHeight}" viewBox="0 0 ${designer.canvasWidth} ${designer.canvasHeight}" fill="none">`,
    `  <svg x="${designer.offsetX}" y="${designer.offsetY}" width="${scaledWidth}" height="${scaledHeight}" viewBox="${parsed.viewBox}" overflow="visible">`,
    `    ${recoloredMarkup}`,
    "  </svg>",
    "</svg>",
    "",
  ].join("\n")
}

async function backupCurrentBrandAsset(
  config: ServerConfig,
  variant: BrandAssetVariant,
  version: string
) {
  const fileName = legacyBrandAssetPaths[variant].fileName
  const currentLogoPath = path.join(publicBrandDirectory(config), fileName)

  if (!(await pathExists(currentLogoPath))) {
    return null
  }

  await mkdir(brandBackupRoot(config), { recursive: true })

  const backupPath = path.join(
    brandBackupRoot(config),
    `${path.basename(fileName, path.extname(fileName))}-${version}${path.extname(fileName)}`
  )
  await copyFile(currentLogoPath, backupPath)

  return backupPath.replace(/\\/g, "/")
}

async function readPublishedBrandAssetManifest(config: ServerConfig) {
  const manifestPath = brandManifestPath(config)

  if (!(await pathExists(manifestPath))) {
    return null
  }

  return JSON.parse(await readFile(manifestPath, "utf8")) as PublishedBrandAssetManifest
}

export async function readPublishedBrandAsset(
  config: ServerConfig,
  variant: BrandAssetVariant
) {
  const manifest = await readPublishedBrandAssetManifest(config)

  if (manifest) {
    const asset = manifest.assets[variant] ?? manifest.assets.primary
    const absolutePath = path.join(publicBrandDirectory(config), asset.fileName)

    if (await pathExists(absolutePath)) {
      return {
        content: await readFile(absolutePath),
        mimeType: asset.mimeType,
      }
    }
  }

  const fallback = legacyBrandAssetPaths[variant] ?? legacyBrandAssetPaths.primary
  const fallbackPath = path.join(publicBrandDirectory(config), fallback.fileName)

  if (!(await pathExists(fallbackPath))) {
    throw new ApplicationError("Brand asset is not available.", { variant }, 404)
  }

  return {
    content: await readFile(fallbackPath),
    mimeType: fallback.mimeType,
  }
}

export async function getPublishedBrandAssetPublicUrl(
  config: ServerConfig,
  variant: BrandAssetVariant
) {
  const manifest = await readPublishedBrandAssetManifest(config)

  if (manifest) {
    const asset = manifest.assets[variant] ?? manifest.assets.primary
    const absolutePath = path.join(publicBrandDirectory(config), asset.fileName)

    if (await pathExists(absolutePath)) {
      return buildManagedBrandAssetPublicUrl(variant, manifest.version)
    }
  }

  const fallback = legacyBrandAssetPaths[variant] ?? legacyBrandAssetPaths.primary
  const fallbackPath = path.join(publicBrandDirectory(config), fallback.fileName)

  if (await pathExists(fallbackPath)) {
    return buildLegacyBrandAssetPublicUrl(variant)
  }

  return null
}

function assertSvgSource(sourceAsset: ResolvedBrandAssetSource, fieldName: string, sourceUrl: string) {
  if (sourceAsset.extension !== "svg" && sourceAsset.mimeType !== "image/svg+xml") {
    throw new ApplicationError(
      "Only SVG logos can be published from the branding designer.",
      {
        fieldName,
        sourceUrl,
        mimeType: sourceAsset.mimeType,
      },
      400
    )
  }
}

export async function publishCompanyBrandAssets(
  database: Kysely<unknown>,
  config: ServerConfig,
  payload: unknown
): Promise<CompanyBrandAssetPublishResponse> {
  const parsedPayload = companyBrandAssetPublishPayloadSchema.parse(payload)
  const primarySourceAsset = await resolveBrandAssetSource(database, config, parsedPayload.primary.sourceUrl)
  const darkSourceAsset = await resolveBrandAssetSource(database, config, parsedPayload.dark.sourceUrl)
  const faviconSourceAsset = await resolveBrandAssetSource(database, config, parsedPayload.favicon.sourceUrl)

  assertSvgSource(primarySourceAsset, "primary.sourceUrl", parsedPayload.primary.sourceUrl)
  assertSvgSource(darkSourceAsset, "dark.sourceUrl", parsedPayload.dark.sourceUrl)
  assertSvgSource(faviconSourceAsset, "favicon.sourceUrl", parsedPayload.favicon.sourceUrl)

  const publishedAt = new Date().toISOString()
  const version = createBrandVersion(publishedAt)
  const backupPaths = {
    primary: await backupCurrentBrandAsset(config, "primary", version),
    dark: await backupCurrentBrandAsset(config, "dark", version),
    favicon: await backupCurrentBrandAsset(config, "favicon", version),
  }
  const managedDirectory = publicBrandDirectory(config)
  const storageDirectory = activeBrandDirectory(config)
  const publicUrls = {
    primary: buildManagedBrandAssetPublicUrl("primary", version),
    dark: buildManagedBrandAssetPublicUrl("dark", version),
    favicon: buildManagedBrandAssetPublicUrl("favicon", version),
  }

  const primarySvg = buildDesignedSvg(decodeSvgTextBuffer(primarySourceAsset.content), parsedPayload.primary)
  const darkSvg = buildDesignedSvg(decodeSvgTextBuffer(darkSourceAsset.content), parsedPayload.dark)
  const faviconSvg = buildDesignedSvg(decodeSvgTextBuffer(faviconSourceAsset.content), parsedPayload.favicon)

  await mkdir(managedDirectory, { recursive: true })
  await mkdir(storageDirectory, { recursive: true })
  await mkdir(path.dirname(brandManifestPath(config)), { recursive: true })
  await rm(path.join(managedDirectory, "brand"), { recursive: true, force: true })

  await writeFile(path.join(storageDirectory, legacyBrandAssetPaths.primary.fileName), primarySvg, "utf8")
  await writeFile(path.join(storageDirectory, legacyBrandAssetPaths.dark.fileName), darkSvg, "utf8")
  await writeFile(path.join(storageDirectory, legacyBrandAssetPaths.favicon.fileName), faviconSvg, "utf8")

  await writeFile(path.join(managedDirectory, legacyBrandAssetPaths.primary.fileName), primarySvg, "utf8")
  await writeFile(path.join(managedDirectory, legacyBrandAssetPaths.dark.fileName), darkSvg, "utf8")
  await writeFile(path.join(managedDirectory, legacyBrandAssetPaths.favicon.fileName), faviconSvg, "utf8")

  const manifest: PublishedBrandAssetManifest = {
    format: "svg",
    publishedAt,
    version,
    assets: {
      primary: {
        fileName: "logo.svg",
        mimeType: "image/svg+xml",
        sourceUrl: parsedPayload.primary.sourceUrl,
      },
      dark: {
        fileName: "logo-dark.svg",
        mimeType: "image/svg+xml",
        sourceUrl: parsedPayload.dark.sourceUrl,
      },
      favicon: {
        fileName: "favicon.svg",
        mimeType: "image/svg+xml",
        sourceUrl: parsedPayload.favicon.sourceUrl,
      },
    },
  }

  await writeFile(brandManifestPath(config), JSON.stringify(manifest, null, 2), "utf8")

  return companyBrandAssetPublishResponseSchema.parse({
    item: {
      format: "svg",
      publishedAt,
      version,
      backupPath: backupPaths.primary,
      backupPaths,
      message:
        backupPaths.primary || backupPaths.dark || backupPaths.favicon
          ? "Brand SVG assets were published to the public folder and previous files were backed up."
          : "Brand SVG assets were published to the public folder.",
      sourceUrl: parsedPayload.primary.sourceUrl,
      sourceUrls: {
        primary: parsedPayload.primary.sourceUrl,
        dark: parsedPayload.dark.sourceUrl,
        favicon: parsedPayload.favicon.sourceUrl,
      },
      publicUrl: publicUrls.primary,
      publicUrls,
      mimeType: "image/svg+xml",
    },
  })
}
