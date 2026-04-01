import fs from 'node:fs'
import fsp from 'node:fs/promises'
import path from 'node:path'
import { randomUUID } from 'node:crypto'
import type { ServerResponse } from 'node:http'
import type { MediaStorageScope } from '@shared/index'
import { environment } from '../config/environment'
import { ApplicationError } from '../errors/application-error'

const contentTypesByExtension: Record<string, string> = {
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml',
  '.pdf': 'application/pdf',
  '.txt': 'text/plain; charset=utf-8',
  '.mp4': 'video/mp4',
  '.webm': 'video/webm',
}

const extensionByMimeType: Record<string, string> = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/gif': '.gif',
  'image/webp': '.webp',
  'image/svg+xml': '.svg',
}

interface UploadedMediaFile {
  fileName: string
  filePath: string
  mimeType: string
  fileSize: number
  width: number | null
  height: number | null
}

function sanitizePathSegment(value: string) {
  const sanitized = value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, '-')
    .replace(/^-+|-+$/g, '')

  return sanitized || 'asset'
}

function toStoredFileName(fileName: string, originalName: string, extension: string) {
  const targetName = path.parse(fileName).name || path.parse(originalName).name || 'asset'
  return `${sanitizePathSegment(targetName)}${extension}`
}

function decodeBase64DataUrl(dataUrl: string) {
  const match = dataUrl.match(/^data:([^;,]+);base64,(.+)$/)

  if (!match) {
    throw new ApplicationError('Upload payload must be a base64 data URL.', {}, 400)
  }

  try {
    return {
      mimeType: match[1].toLowerCase(),
      buffer: Buffer.from(match[2], 'base64'),
    }
  } catch {
    throw new ApplicationError('Upload payload is not valid base64 data.', {}, 400)
  }
}

function readPngDimensions(buffer: Buffer) {
  if (buffer.length < 24) {
    return null
  }

  return {
    width: buffer.readUInt32BE(16),
    height: buffer.readUInt32BE(20),
  }
}

function readGifDimensions(buffer: Buffer) {
  if (buffer.length < 10) {
    return null
  }

  return {
    width: buffer.readUInt16LE(6),
    height: buffer.readUInt16LE(8),
  }
}

function readJpegDimensions(buffer: Buffer) {
  let offset = 2

  while (offset < buffer.length) {
    if (buffer[offset] !== 0xff) {
      offset += 1
      continue
    }

    const marker = buffer[offset + 1]
    if (marker === undefined) {
      return null
    }

    const segmentLength = buffer.readUInt16BE(offset + 2)
    if ([0xc0, 0xc1, 0xc2, 0xc3, 0xc5, 0xc6, 0xc7, 0xc9, 0xca, 0xcb, 0xcd, 0xce, 0xcf].includes(marker)) {
      return {
        height: buffer.readUInt16BE(offset + 5),
        width: buffer.readUInt16BE(offset + 7),
      }
    }

    if (segmentLength < 2) {
      return null
    }

    offset += 2 + segmentLength
  }

  return null
}

function getImageDimensions(buffer: Buffer, mimeType: string) {
  if (mimeType === 'image/png') {
    return readPngDimensions(buffer)
  }

  if (mimeType === 'image/gif') {
    return readGifDimensions(buffer)
  }

  if (mimeType === 'image/jpeg') {
    return readJpegDimensions(buffer)
  }

  return null
}

function resolveUploadExtension(mimeType: string, originalName: string) {
  const originalExtension = path.extname(originalName).toLowerCase()
  if (originalExtension) {
    return originalExtension
  }

  const extension = extensionByMimeType[mimeType]
  if (!extension) {
    throw new ApplicationError('Unsupported upload mime type.', { mimeType }, 400)
  }

  return extension
}

export function normalizeStoragePath(value: string) {
  const normalized = value.replace(/\\/g, '/').replace(/^\/+/, '').trim()

  if (!normalized) {
    throw new ApplicationError('Storage path is required.', { value }, 400)
  }

  if (normalized.split('/').some((segment) => segment === '..' || segment.length === 0)) {
    throw new ApplicationError('Storage path contains invalid segments.', { value }, 400)
  }

  return normalized
}

export function createMediaUrl(storageScope: MediaStorageScope, filePath: string) {
  const normalized = normalizeStoragePath(filePath)

  if (storageScope === 'public') {
    const encodedPath = normalized.split('/').map(encodeURIComponent).join('/')
    return `${environment.media.publicBaseUrl}/${encodedPath}`
  }

  return `private://${normalized}`
}

export function resolveStorageFilePath(storageScope: MediaStorageScope, filePath: string) {
  const normalized = normalizeStoragePath(filePath)
  const baseDirectory =
    storageScope === 'public' ? environment.media.publicDirectory : environment.media.privateDirectory

  return path.join(baseDirectory, ...normalized.split('/'))
}

export async function persistUploadedMediaFile(input: {
  dataUrl: string
  fileName: string
  originalName: string
  storageScope: MediaStorageScope
  folderId?: string | null
}): Promise<UploadedMediaFile> {
  const { buffer, mimeType } = decodeBase64DataUrl(input.dataUrl)

  if (!mimeType.startsWith('image/')) {
    throw new ApplicationError('Only image uploads are supported in this flow.', { mimeType }, 400)
  }

  const extension = resolveUploadExtension(mimeType, input.originalName)
  const storedFileName = toStoredFileName(input.fileName, input.originalName, extension)
  const folderSegment = sanitizePathSegment(input.folderId ?? 'root')
  const createdAt = new Date()
  const relativePath = normalizeStoragePath(
    [
      'uploads',
      String(createdAt.getUTCFullYear()),
      String(createdAt.getUTCMonth() + 1).padStart(2, '0'),
      folderSegment,
      `${randomUUID()}-${storedFileName}`,
    ].join('/'),
  )
  const absolutePath = resolveStorageFilePath(input.storageScope, relativePath)
  const dimensions = getImageDimensions(buffer, mimeType)

  await fsp.mkdir(path.dirname(absolutePath), { recursive: true })
  await fsp.writeFile(absolutePath, buffer)

  return {
    fileName: storedFileName,
    filePath: relativePath,
    mimeType,
    fileSize: buffer.byteLength,
    width: dimensions?.width ?? null,
    height: dimensions?.height ?? null,
  }
}

export async function deleteStoredMediaFile(storageScope: MediaStorageScope, filePath: string) {
  const absolutePath = resolveStorageFilePath(storageScope, filePath)

  try {
    await fsp.unlink(absolutePath)
  } catch (error) {
    const nodeError = error as NodeJS.ErrnoException
    if (nodeError.code !== 'ENOENT') {
      throw error
    }
  }
}

export async function ensureMediaStorage() {
  await fsp.mkdir(environment.media.publicDirectory, { recursive: true })
  await fsp.mkdir(environment.media.privateDirectory, { recursive: true })
  await fsp.mkdir(path.dirname(environment.media.webPublicSymlink), { recursive: true })

  const placeholderDirectory = path.join(environment.media.publicDirectory, 'placeholders')
  const placeholderFile = path.join(placeholderDirectory, 'default.txt')
  await fsp.mkdir(placeholderDirectory, { recursive: true })

  try {
    await fsp.access(placeholderFile)
  } catch {
    await fsp.writeFile(
      placeholderFile,
      'Default public media placeholder created by the media manager bootstrap.\n',
      'utf8',
    )
  }

  try {
    const linkStats = await fsp.lstat(environment.media.webPublicSymlink)
    if (linkStats.isSymbolicLink() || linkStats.isDirectory()) {
      return
    }
  } catch {
    await fsp.symlink(environment.media.publicDirectory, environment.media.webPublicSymlink, 'junction')
  }
}

export async function servePublicMediaAsset(response: ServerResponse, relativePath: string) {
  const normalized = normalizeStoragePath(relativePath)
  const filePath = resolveStorageFilePath('public', normalized)

  let stats
  try {
    stats = await fsp.stat(filePath)
  } catch {
    throw new ApplicationError('Public media file not found.', { path: normalized }, 404)
  }

  if (!stats.isFile()) {
    throw new ApplicationError('Requested public media path is not a file.', { path: normalized }, 404)
  }

  const extension = path.extname(filePath).toLowerCase()
  const contentType = contentTypesByExtension[extension] ?? 'application/octet-stream'

  response.writeHead(200, {
    'content-type': contentType,
    'content-length': stats.size,
    'cache-control': 'public, max-age=300',
    'access-control-allow-origin': typeof response.getHeader('access-control-allow-origin') === 'string'
      ? String(response.getHeader('access-control-allow-origin'))
      : environment.corsOrigin,
    'access-control-allow-headers': 'authorization, content-type',
    'access-control-allow-methods': 'GET, POST, PATCH, DELETE, OPTIONS',
    vary: 'Origin',
  })

  await new Promise<void>((resolve, reject) => {
    const stream = fs.createReadStream(filePath)
    stream.on('error', reject)
    stream.on('end', () => resolve())
    stream.pipe(response)
  })
}
