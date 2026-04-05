import { randomUUID } from "node:crypto"
import { mkdir, readFile, writeFile } from "node:fs/promises"
import path from "node:path"

import type { Kysely } from "kysely"

import type {
  Media,
  MediaFileType,
  MediaFolder,
  MediaFolderListResponse,
  MediaFolderResponse,
  MediaFolderUpsertPayload,
  MediaImageUploadPayload,
  MediaListResponse,
  MediaResponse,
  MediaSummary,
  MediaUpsertPayload,
} from "../../../shared/media.js"
import {
  mediaFolderListResponseSchema,
  mediaFolderResponseSchema,
  mediaFolderSchema,
  mediaFolderUpsertPayloadSchema,
  mediaImageUploadPayloadSchema,
  mediaListResponseSchema,
  mediaResponseSchema,
  mediaSchema,
  mediaUpsertPayloadSchema,
} from "../../../shared/media.js"
import type { ServerConfig } from "../config/index.js"
import {
  listJsonStorePayloads,
  replaceJsonStoreRecords,
} from "../database/process/json-store.js"
import { ApplicationError } from "../errors/application-error.js"

import { frameworkMediaTableNames } from "./media-table-names.js"
import {
  ensurePublicMediaSymlink,
  mediaAbsolutePath,
  mediaRootDirectory,
  moveMediaBinaryBetweenScopes,
  publicMediaFileUrl,
} from "./media-storage.js"

function normalizeOptionalString(value: string | null | undefined) {
  if (value == null) {
    return null
  }

  const trimmed = value.trim()
  return trimmed.length > 0 ? trimmed : null
}

function parseDataUrl(dataUrl: string) {
  const match = dataUrl.match(/^data:([^;,]+);base64,(.+)$/)
  const mimeType = match?.[1]
  const encodedContent = match?.[2]

  if (!mimeType || !encodedContent) {
    throw new ApplicationError("Media upload must be a valid base64 data URL.", {}, 400)
  }

  return {
    mimeType,
    buffer: Buffer.from(encodedContent, "base64"),
  }
}

function fileTypeFromMimeType(mimeType: string): MediaFileType {
  if (mimeType.startsWith("image/")) return "image"
  if (mimeType.startsWith("video/")) return "video"
  if (mimeType.startsWith("audio/")) return "audio"
  if (
    mimeType.includes("pdf") ||
    mimeType.includes("document") ||
    mimeType.includes("sheet") ||
    mimeType.includes("presentation") ||
    mimeType.startsWith("text/")
  ) {
    return "document"
  }
  if (mimeType.includes("zip") || mimeType.includes("archive") || mimeType.includes("compressed")) {
    return "archive"
  }
  return "other"
}

function extensionFromName(fileName: string, mimeType: string) {
  const explicitExtension = path.extname(fileName).replace(/^\./, "").trim()
  if (explicitExtension) {
    return explicitExtension.toLowerCase()
  }

  const fallback = mimeType.split("/")[1]?.split("+")[0]?.trim()
  return fallback || null
}

function sanitizeFileStem(fileName: string) {
  const baseName = path.basename(fileName, path.extname(fileName))
  const sanitized = baseName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")

  return sanitized || "media-file"
}

async function readFolders(database: Kysely<unknown>) {
  return (await listJsonStorePayloads<MediaFolder>(
    database,
    frameworkMediaTableNames.folders
  ))
    .map((item) => mediaFolderSchema.parse(item))
    .sort((left, right) => left.name.localeCompare(right.name))
}

async function writeFolders(database: Kysely<unknown>, folders: MediaFolder[]) {
  await replaceJsonStoreRecords(
    database,
    frameworkMediaTableNames.folders,
    folders.map((folder, index) => ({
      id: folder.id,
      moduleKey: "media-folders",
      sortOrder: index + 1,
      payload: folder,
      createdAt: folder.createdAt,
      updatedAt: folder.updatedAt,
    }))
  )
}

async function readFiles(database: Kysely<unknown>) {
  return (await listJsonStorePayloads<Media>(database, frameworkMediaTableNames.files))
    .map((item) => mediaSchema.parse(item))
    .sort((left, right) => right.updatedAt.localeCompare(left.updatedAt))
}

async function writeFiles(database: Kysely<unknown>, items: Media[]) {
  await replaceJsonStoreRecords(
    database,
    frameworkMediaTableNames.files,
    items.map((item, index) => ({
      id: item.id,
      moduleKey: "media-files",
      sortOrder: index + 1,
      payload: item,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
    }))
  )
}

function toMediaSummary(item: Media, folders: MediaFolder[]): MediaSummary {
  const folderName = item.folderId
    ? folders.find((folder) => folder.id === item.folderId)?.name ?? null
    : null

  return {
    ...item,
    folderName,
  }
}

function buildMediaFileUrl(
  itemId: string,
  scope: "public" | "private",
  backendKey: string
) {
  return scope === "public"
    ? publicMediaFileUrl(backendKey)
    : `/internal/v1/framework/media-file?id=${encodeURIComponent(itemId)}`
}

export async function listMediaFolders(
  database: Kysely<unknown>
): Promise<MediaFolderListResponse> {
  return mediaFolderListResponseSchema.parse({
    items: await readFolders(database),
  })
}

export async function createMediaFolder(
  database: Kysely<unknown>,
  payload: unknown
): Promise<MediaFolderResponse> {
  const parsedPayload = mediaFolderUpsertPayloadSchema.parse(payload)
  const folders = await readFolders(database)
  const timestamp = new Date().toISOString()

  const item = mediaFolderSchema.parse({
    id: `media-folder:${randomUUID()}`,
    name: parsedPayload.name.trim(),
    parentId: normalizeOptionalString(parsedPayload.parentId),
    isActive: parsedPayload.isActive,
    createdAt: timestamp,
    updatedAt: timestamp,
  })

  await writeFolders(database, [...folders, item])
  return mediaFolderResponseSchema.parse({ item })
}

export async function updateMediaFolder(
  database: Kysely<unknown>,
  folderId: string,
  payload: unknown
): Promise<MediaFolderResponse> {
  const parsedPayload = mediaFolderUpsertPayloadSchema.parse(payload)
  const folders = await readFolders(database)
  const existing = folders.find((folder) => folder.id === folderId)

  if (!existing) {
    throw new ApplicationError("Media folder could not be found.", { folderId }, 404)
  }

  const updated = mediaFolderSchema.parse({
    ...existing,
    name: parsedPayload.name.trim(),
    parentId: normalizeOptionalString(parsedPayload.parentId),
    isActive: parsedPayload.isActive,
    updatedAt: new Date().toISOString(),
  })

  await writeFolders(
    database,
    folders.map((folder) => (folder.id === folderId ? updated : folder))
  )
  return mediaFolderResponseSchema.parse({ item: updated })
}

export async function toggleMediaFolderActive(
  database: Kysely<unknown>,
  folderId: string,
  isActive: boolean
): Promise<MediaFolderResponse> {
  const folders = await readFolders(database)
  const existing = folders.find((folder) => folder.id === folderId)

  if (!existing) {
    throw new ApplicationError("Media folder could not be found.", { folderId }, 404)
  }

  const updated = mediaFolderSchema.parse({
    ...existing,
    isActive,
    updatedAt: new Date().toISOString(),
  })

  await writeFolders(
    database,
    folders.map((folder) => (folder.id === folderId ? updated : folder))
  )
  return mediaFolderResponseSchema.parse({ item: updated })
}

export async function listMedia(database: Kysely<unknown>): Promise<MediaListResponse> {
  const folders = await readFolders(database)
  const items = await readFiles(database)

  return mediaListResponseSchema.parse({
    items: items.map((item) => toMediaSummary(item, folders)),
  })
}

export async function getMedia(
  database: Kysely<unknown>,
  mediaId: string
): Promise<MediaResponse> {
  const items = await readFiles(database)
  const item = items.find((entry) => entry.id === mediaId)

  if (!item) {
    throw new ApplicationError("Media asset could not be found.", { mediaId }, 404)
  }

  return mediaResponseSchema.parse({ item })
}

export async function uploadMediaImage(
  database: Kysely<unknown>,
  config: ServerConfig,
  payload: unknown
): Promise<MediaResponse> {
  const parsedPayload = mediaImageUploadPayloadSchema.parse(payload)
  const folders = await readFolders(database)
  const items = await readFiles(database)
  const { buffer, mimeType } = parseDataUrl(parsedPayload.dataUrl)
  const extension = extensionFromName(parsedPayload.originalName, mimeType)
  const mediaId = `media:${randomUUID()}`
  const timeStamp = new Date()
  const year = String(timeStamp.getUTCFullYear())
  const month = String(timeStamp.getUTCMonth() + 1).padStart(2, "0")
  const relativeFileName = extension
    ? `${randomUUID()}-${sanitizeFileStem(parsedPayload.fileName)}.${extension}`
    : `${randomUUID()}-${sanitizeFileStem(parsedPayload.fileName)}`
  const relativePath = path.join(year, month, relativeFileName)
  const backendKey = relativePath.replace(/\\/g, "/")
  const absolutePath = mediaAbsolutePath(config, parsedPayload.storageScope, relativePath)

  await mkdir(path.dirname(absolutePath), { recursive: true })
  await writeFile(absolutePath, buffer)

  if (parsedPayload.storageScope === "public") {
    await ensurePublicMediaSymlink(config)
  }

  const timestamp = new Date().toISOString()
  const item = mediaSchema.parse({
    id: mediaId,
    fileName: parsedPayload.fileName.trim(),
    originalName: parsedPayload.originalName.trim(),
    title: normalizeOptionalString(parsedPayload.title),
    altText: normalizeOptionalString(parsedPayload.altText),
    description: normalizeOptionalString(parsedPayload.description),
    provider: "local",
    storageScope: parsedPayload.storageScope,
    fileType: fileTypeFromMimeType(mimeType),
    mimeType,
    fileSize: buffer.byteLength,
    folderId: normalizeOptionalString(parsedPayload.folderId),
    folderName:
      normalizeOptionalString(parsedPayload.folderId) == null
        ? null
        : folders.find((folder) => folder.id === parsedPayload.folderId)?.name ?? null,
    tags: parsedPayload.tags,
    width: null,
    height: null,
    fileUrl: buildMediaFileUrl(mediaId, parsedPayload.storageScope, backendKey),
    thumbnailUrl: null,
    backendKey,
    disk: parsedPayload.storageScope,
    root: mediaRootDirectory(config),
    extension,
    isActive: parsedPayload.isActive,
    createdAt: timestamp,
    updatedAt: timestamp,
    versions: [],
  })

  await writeFiles(database, [item, ...items])
  return mediaResponseSchema.parse({ item })
}

export async function updateMedia(
  database: Kysely<unknown>,
  config: ServerConfig,
  mediaId: string,
  payload: unknown
): Promise<MediaResponse> {
  const parsedPayload = mediaUpsertPayloadSchema.parse(payload)
  const items = await readFiles(database)
  const existing = items.find((entry) => entry.id === mediaId)

  if (!existing) {
    throw new ApplicationError("Media asset could not be found.", { mediaId }, 404)
  }

  const updated = mediaSchema.parse({
    ...existing,
    title: normalizeOptionalString(parsedPayload.title),
    altText: normalizeOptionalString(parsedPayload.altText),
    description: normalizeOptionalString(parsedPayload.description),
    folderId: normalizeOptionalString(parsedPayload.folderId),
    storageScope: parsedPayload.storageScope,
    fileUrl: buildMediaFileUrl(mediaId, parsedPayload.storageScope, existing.backendKey),
    tags: parsedPayload.tags,
    isActive: parsedPayload.isActive,
    updatedAt: new Date().toISOString(),
  })

  await moveMediaBinaryBetweenScopes(
    config,
    existing.backendKey,
    existing.storageScope,
    parsedPayload.storageScope
  )

  await writeFiles(
    database,
    items.map((entry) => (entry.id === mediaId ? updated : entry))
  )
  return mediaResponseSchema.parse({ item: updated })
}

export async function toggleMediaActive(
  database: Kysely<unknown>,
  mediaId: string,
  isActive: boolean
): Promise<MediaResponse> {
  const items = await readFiles(database)
  const existing = items.find((entry) => entry.id === mediaId)

  if (!existing) {
    throw new ApplicationError("Media asset could not be found.", { mediaId }, 404)
  }

  const updated = mediaSchema.parse({
    ...existing,
    isActive,
    updatedAt: new Date().toISOString(),
  })

  await writeFiles(
    database,
    items.map((entry) => (entry.id === mediaId ? updated : entry))
  )
  return mediaResponseSchema.parse({ item: updated })
}

export async function readMediaContent(
  database: Kysely<unknown>,
  config: ServerConfig,
  mediaId: string
) {
  const items = await readFiles(database)
  const item = items.find((entry) => entry.id === mediaId)

  if (!item) {
    throw new ApplicationError("Media asset could not be found.", { mediaId }, 404)
  }

  const absolutePath = mediaAbsolutePath(config, item.storageScope, item.backendKey)
  const content = await readFile(absolutePath)

  return {
    item,
    content,
  }
}
