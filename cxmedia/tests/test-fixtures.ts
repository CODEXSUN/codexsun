import { randomUUID } from "node:crypto"
import path from "node:path"
import { tmpdir } from "node:os"

import type { CxmediaConfig } from "../src/config/env.js"
import type { AuthenticatedUser } from "../src/auth/contracts.js"

type StoredObject = {
  body: Buffer
  contentType: string
  createdAt: string
  etag: string
  metadata: Record<string, string>
}

export class InMemoryS3Client {
  private readonly objects = new Map<string, StoredObject>()

  async ensureBucket() {
    return undefined
  }

  async putObject(
    objectPath: string,
    content: Buffer,
    options: {
      contentType: string
      metadata?: Record<string, string>
    }
  ) {
    this.objects.set(objectPath, {
      body: Buffer.from(content),
      contentType: options.contentType,
      createdAt: new Date().toISOString(),
      etag: `etag-${objectPath}`,
      metadata: { ...(options.metadata ?? {}) },
    })
  }

  async deleteObject(objectPath: string) {
    this.objects.delete(objectPath)
  }

  async getObject(objectPath: string) {
    const object = this.requireObject(objectPath)

    return {
      body: Buffer.from(object.body),
      contentLength: object.body.byteLength,
      contentType: object.contentType,
      etag: object.etag,
      lastModified: object.createdAt,
      metadata: { ...object.metadata },
    }
  }

  async headObject(objectPath: string) {
    const object = this.requireObject(objectPath)

    return {
      byteSize: object.body.byteLength,
      contentType: object.contentType,
      createdAt: object.createdAt,
      etag: object.etag,
      metadata: { ...object.metadata },
      path: objectPath,
    }
  }

  async listObjects(prefix: string) {
    return [...this.objects.entries()]
      .filter(([objectPath]) => objectPath.startsWith(prefix))
      .map(([objectPath, object]) => ({
        byteSize: object.body.byteLength,
        contentType: object.contentType,
        createdAt: object.createdAt,
        etag: object.etag,
        metadata: { ...object.metadata },
        path: objectPath,
      }))
  }

  private requireObject(objectPath: string) {
    const object = this.objects.get(objectPath)

    if (!object) {
      throw new Error(`Object not found: ${objectPath}`)
    }

    return object
  }
}

export function createTestConfig(overrides: Partial<CxmediaConfig> = {}): CxmediaConfig {
  const dataRoot = path.join(tmpdir(), `cxmedia-tests-${randomUUID()}`)

  return {
    appName: "cxmedia-test",
    host: "127.0.0.1",
    port: 4100,
    nodeEnv: "test",
    publicBaseUrl: "http://localhost:4100",
    cdnBaseUrl: "http://cdn.local",
    thumborBaseUrl: "http://thumbor.local",
    thumborInternalBaseUrl: "http://thumbor.local",
    thumborSourceBaseUrl: "http://localhost:4100",
    maxUploadBytes: 10 * 1024 * 1024,
    allowedMimeTypes: ["image/jpeg", "image/png", "image/webp"],
    auth: {
      bootstrapAdminEmail: "admin@example.com",
      bootstrapAdminName: "Primary Admin",
      bootstrapAdminPassword: "Password@123",
      bootstrapAdminPasswordHash: null,
      jwtSecret: "jwt-secret-123456",
      jwtExpiresInSeconds: 3600,
      usersFilePath: path.join(dataRoot, "users.json"),
    },
    internalSync: {
      secret: "sync-secret-123456",
    },
    handoff: {
      secret: "handoff-secret-123456",
    },
    signedUrls: {
      secret: "signed-secret-123456",
      expiresInSeconds: 900,
    },
    rateLimit: {
      windowSeconds: 60,
      maxRequests: 120,
    },
    storage: {
      endpoint: "http://garage.local",
      region: "garage",
      accessKeyId: "garage-access-key",
      secretAccessKey: "garage-secret-key",
      bucket: "cxmedia",
      pathStyle: true,
      autoCreateBucket: true,
    },
    runtimeSettings: {
      filePath: path.join(dataRoot, "runtime-settings.json"),
    },
    cors: {
      allowedOrigins: ["http://localhost:4100"],
    },
    security: {
      productionMode: false,
      strictConfig: false,
    },
    ...overrides,
    auth: {
      bootstrapAdminEmail: "admin@example.com",
      bootstrapAdminName: "Primary Admin",
      bootstrapAdminPassword: "Password@123",
      bootstrapAdminPasswordHash: null,
      jwtSecret: "jwt-secret-123456",
      jwtExpiresInSeconds: 3600,
      usersFilePath: path.join(dataRoot, "users.json"),
      ...(overrides.auth ?? {}),
    },
    internalSync: {
      secret: "sync-secret-123456",
      ...(overrides.internalSync ?? {}),
    },
    handoff: {
      secret: "handoff-secret-123456",
      ...(overrides.handoff ?? {}),
    },
    signedUrls: {
      secret: "signed-secret-123456",
      expiresInSeconds: 900,
      ...(overrides.signedUrls ?? {}),
    },
    rateLimit: {
      windowSeconds: 60,
      maxRequests: 120,
      ...(overrides.rateLimit ?? {}),
    },
    storage: {
      endpoint: "http://garage.local",
      region: "garage",
      accessKeyId: "garage-access-key",
      secretAccessKey: "garage-secret-key",
      bucket: "cxmedia",
      pathStyle: true,
      autoCreateBucket: true,
      ...(overrides.storage ?? {}),
    },
    runtimeSettings: {
      filePath: path.join(dataRoot, "runtime-settings.json"),
      ...(overrides.runtimeSettings ?? {}),
    },
    cors: {
      allowedOrigins: ["http://localhost:4100"],
      ...(overrides.cors ?? {}),
    },
    security: {
      productionMode: false,
      strictConfig: false,
      ...(overrides.security ?? {}),
    },
  }
}

export function createAdminActor(
  overrides: Partial<AuthenticatedUser> = {}
): AuthenticatedUser {
  return {
    active: true,
    email: "admin@example.com",
    name: "Primary Admin",
    role: "admin",
    ...overrides,
  }
}
