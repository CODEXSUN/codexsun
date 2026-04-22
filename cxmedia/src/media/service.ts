import { randomUUID } from "node:crypto"
import path from "node:path"

import type { AuthenticatedUser } from "../auth/contracts.js"
import type { CxmediaConfig } from "../config/env.js"
import { signOpaquePayload, verifyOpaquePayload } from "../auth/jwt.js"
import { sanitizeObjectPath, sanitizePrefix, slugifyFileName } from "../http/path.js"
import { RuntimeSettingsService } from "../settings/service.js"
import { S3Client } from "../storage/s3-client.js"

import type { MediaObjectSummary, MediaVisibility } from "./contracts.js"

type SignedUrlAction = "download" | "upload"

export class MediaService {
  constructor(
    private readonly config: CxmediaConfig,
    private readonly storage: S3Client,
    private readonly runtimeSettings: RuntimeSettingsService
  ) {}

  async initialize() {
    if (this.config.storage.autoCreateBucket) {
      await this.storage.ensureBucket()
    }
  }

  async uploadObject(input: {
    actor: AuthenticatedUser
    buffer: Buffer
    contentType: string
    originalName: string
    prefix?: string
    visibility: MediaVisibility
  }) {
    await this.assertAllowedMimeType(input.contentType)
    const prefix = sanitizePrefix(input.prefix || input.actor.email.split("@")[0] || "admin")
    const extension = path.extname(slugifyFileName(input.originalName)).toLowerCase()
    const uniqueName = `${Date.now()}-${randomUUID().slice(0, 8)}${extension}`
    const objectPath = sanitizeObjectPath(`${prefix}${uniqueName}`)

    await this.storage.putObject(objectPath, input.buffer, {
      contentType: input.contentType,
      metadata: {
        original_name: input.originalName,
        uploaded_by: input.actor.email,
        visibility: input.visibility,
      },
    })

    const item = await this.buildSummary(objectPath)

    return {
      item,
      cdnUrl: item.publicUrl,
    }
  }

  async listObjects(prefix?: string) {
    const objects = await this.storage.listObjects(sanitizePrefix(prefix))

    return {
      items: await Promise.all(objects.map((item) => this.buildSummary(item.path, item))),
    }
  }

  async deleteObject(objectPath: string) {
    const normalizedPath = sanitizeObjectPath(objectPath)
    await this.storage.deleteObject(normalizedPath)

    return {
      deleted: true as const,
      path: normalizedPath,
    }
  }

  async getObject(objectPath: string) {
    const normalizedPath = sanitizeObjectPath(objectPath)
    const object = await this.storage.getObject(normalizedPath)

    return {
      body: object.body,
      byteSize: object.contentLength,
      contentType: object.contentType,
      lastModified: object.lastModified ?? null,
      visibility: (object.metadata.visibility as MediaVisibility | undefined) ?? "private",
    }
  }

  async getObjectSummary(objectPath: string) {
    return this.buildSummary(sanitizeObjectPath(objectPath))
  }

  async createSignedUrl(input: {
    action: SignedUrlAction
    expiresInSeconds?: number
    objectPath: string
  }) {
    const objectPath = sanitizeObjectPath(input.objectPath)
    const encodedPath = objectPath.split("/").map(encodeURIComponent).join("/")
    const expiresAt =
      Math.floor(Date.now() / 1000) +
      Math.max(
        1,
        input.expiresInSeconds ?? (await this.runtimeSettings.getRuntimeSettings()).signedUrlExpiresInSeconds
      )
    const token = signOpaquePayload(
      {
        action: input.action,
        exp: expiresAt,
        path: objectPath,
      },
      this.config.signedUrls.secret
    )
    const routePrefix = input.action === "upload" ? "signed-upload" : "p"

    return {
      action: input.action,
      expiresAt: new Date(expiresAt * 1000).toISOString(),
      token,
      url: `${this.config.publicBaseUrl}/${routePrefix}/${encodedPath}?token=${encodeURIComponent(token)}`,
    }
  }

  verifySignedUrl(token: string, expectedAction: SignedUrlAction, objectPath: string) {
    const payload = verifyOpaquePayload<{
      action: SignedUrlAction
      exp: number
      path: string
    }>(token, this.config.signedUrls.secret)

    if (payload.action !== expectedAction) {
      throw new Error("Signed URL action is invalid.")
    }

    if (payload.path !== sanitizeObjectPath(objectPath)) {
      throw new Error("Signed URL path is invalid.")
    }

    if (payload.exp <= Math.floor(Date.now() / 1000)) {
      throw new Error("Signed URL has expired.")
    }

    return payload
  }

  buildTransformUrl(
    mode: "resize" | "crop",
    size: string,
    objectPath: string,
    format?: string | null
  ) {
    const normalizedPath = sanitizeObjectPath(objectPath)
    const encodedPath = normalizedPath.split("/").map(encodeURIComponent).join("/")
    const query = format?.trim() ? `?format=${encodeURIComponent(format.trim().toLowerCase())}` : ""

    return `${this.config.publicBaseUrl}/${mode}/${size}/${encodedPath}${query}`
  }

  buildThumborUrl(
    mode: "resize" | "crop",
    size: string,
    objectPath: string,
    format?: string | null
  ) {
    const normalizedPath = sanitizeObjectPath(objectPath)
    const encodedPath = normalizedPath.split("/").map(encodeURIComponent).join("/")

    if (!this.config.thumborInternalBaseUrl) {
      return `${this.config.cdnBaseUrl}/f/${encodedPath}`
    }

    const filters = format?.trim()
      ? `filters:format(${format.trim().toLowerCase()})/`
      : ""
    const operationPrefix =
      mode === "crop"
        ? `unsafe/${size}/smart/${filters}`
        : `unsafe/fit-in/${size}/${filters}`
    const sourceUrl = `${this.config.thumborSourceBaseUrl}/f/${encodedPath}`

    return `${this.config.thumborInternalBaseUrl}/${operationPrefix}${encodeURIComponent(sourceUrl)}`
  }

  private async buildSummary(
    objectPath: string,
    source?: {
      byteSize: number | null
      contentType: string
      createdAt: string | null
      etag: string | null
      metadata: Record<string, string>
      path: string
    }
  ): Promise<MediaObjectSummary> {
    const detailed = source ?? (await this.storage.headObject(objectPath))
    const visibility = (detailed.metadata.visibility as MediaVisibility | undefined) ?? "private"
    const encodedPath = objectPath.split("/").map(encodeURIComponent).join("/")
    const privateSigned = await this.createSignedUrl({
      action: "download",
      objectPath,
    })

    return {
      byteSize: detailed.byteSize,
      contentType: detailed.contentType,
      createdAt: detailed.createdAt,
      etag: detailed.etag,
      path: objectPath,
      privateUrl: privateSigned.url,
      publicUrl: `${this.config.cdnBaseUrl}/f/${encodedPath}`,
      transformUrls: {
        crop: this.buildTransformUrl("crop", "300x300", objectPath, "webp"),
        resize: this.buildTransformUrl("resize", "300x300", objectPath, "webp"),
      },
      visibility,
    }
  }

  private async assertAllowedMimeType(contentType: string) {
    const allowedMimeTypes = (await this.runtimeSettings.getRuntimeSettings()).allowedMimeTypes

    if (!allowedMimeTypes.includes(contentType)) {
      throw new Error(`Unsupported media type: ${contentType}`)
    }
  }
}
