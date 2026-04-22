import { existsSync, readFileSync } from "node:fs"
import path from "node:path"

type EnvMap = Record<string, string | undefined>

function parseEnvFile(filePath: string): Record<string, string> {
  if (!existsSync(filePath)) {
    return {}
  }

  const file = readFileSync(filePath, "utf8")
  const values: Record<string, string> = {}

  for (const rawLine of file.split(/\r?\n/)) {
    const line = rawLine.trim()

    if (!line || line.startsWith("#")) {
      continue
    }

    const separatorIndex = line.indexOf("=")

    if (separatorIndex <= 0) {
      continue
    }

    const key = line.slice(0, separatorIndex).trim()
    const value = line.slice(separatorIndex + 1).trim().replace(/^['"]|['"]$/g, "")

    values[key] = value
  }

  return values
}

function resolveEnv(cwd = process.cwd()): EnvMap {
  const localEnv = parseEnvFile(path.resolve(cwd, "cxmedia", ".env"))
  const rootEnv = parseEnvFile(path.resolve(cwd, ".env"))

  return {
    ...rootEnv,
    ...localEnv,
    ...process.env,
  }
}

function readBoolean(value: string | undefined, fallback = false) {
  if (value === undefined) {
    return fallback
  }

  return ["1", "true", "yes", "on"].includes(value.trim().toLowerCase())
}

function readNumber(value: string | undefined, fallback: number, label: string) {
  if (!value?.trim()) {
    return fallback
  }

  const parsed = Number(value)

  if (!Number.isFinite(parsed) || parsed <= 0) {
    throw new Error(`Invalid ${label} value: ${value}`)
  }

  return parsed
}

function readStringList(value: string | undefined) {
  return (value ?? "")
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean)
}

export type CxmediaConfig = {
  appName: string
  host: string
  port: number
  nodeEnv: string
  publicBaseUrl: string
  cdnBaseUrl: string
  thumborBaseUrl: string | null
  thumborInternalBaseUrl: string | null
  thumborSourceBaseUrl: string
  maxUploadBytes: number
  allowedMimeTypes: string[]
  auth: {
    bootstrapAdminEmail: string | null
    bootstrapAdminName: string
    bootstrapAdminPassword: string | null
    bootstrapAdminPasswordHash: string | null
    jwtSecret: string
    jwtExpiresInSeconds: number
    usersFilePath: string
  }
  internalSync: {
    secret: string | null
  }
  handoff: {
    secret: string | null
  }
  signedUrls: {
    secret: string
    expiresInSeconds: number
  }
  rateLimit: {
    windowSeconds: number
    maxRequests: number
  }
  storage: {
    endpoint: string
    region: string
    accessKeyId: string
    secretAccessKey: string
    bucket: string
    pathStyle: boolean
      autoCreateBucket: boolean
  }
  runtimeSettings: {
    filePath: string
  }
  cors: {
    allowedOrigins: string[]
  }
  security: {
    productionMode: boolean
    strictConfig: boolean
  }
}

export function getCxmediaConfig(cwd = process.cwd()): CxmediaConfig {
  const env = resolveEnv(cwd)
  const nodeEnv = env.CXMEDIA_NODE_ENV?.trim() || env.NODE_ENV?.trim() || "development"
  const productionMode = nodeEnv === "production"
  const strictConfig = readBoolean(env.CXMEDIA_STRICT_CONFIG, productionMode)
  const adminEmail = env.CXMEDIA_ADMIN_EMAIL?.trim().toLowerCase() || null
  const jwtSecret = env.CXMEDIA_JWT_SECRET?.trim()
  const signedUrlSecret = env.CXMEDIA_SIGNED_URL_SECRET?.trim()
  const s3Endpoint = env.CXMEDIA_S3_ENDPOINT?.trim()
  const accessKeyId = env.CXMEDIA_S3_ACCESS_KEY_ID?.trim()
  const secretAccessKey = env.CXMEDIA_S3_SECRET_ACCESS_KEY?.trim()
  const bucket = env.CXMEDIA_S3_BUCKET?.trim()
  const publicBaseUrl = (env.CXMEDIA_PUBLIC_BASE_URL?.trim() || "http://localhost:4100").replace(/\/+$/, "")
  const defaultCorsOrigin = new URL(publicBaseUrl).origin

  if (!jwtSecret || jwtSecret.length < 16) {
    throw new Error("CXMEDIA_JWT_SECRET must be at least 16 characters.")
  }

  if (!signedUrlSecret || signedUrlSecret.length < 16) {
    throw new Error("CXMEDIA_SIGNED_URL_SECRET must be at least 16 characters.")
  }

  if (!s3Endpoint || !accessKeyId || !secretAccessKey || !bucket) {
    throw new Error(
      "CXMEDIA_S3_ENDPOINT, CXMEDIA_S3_ACCESS_KEY_ID, CXMEDIA_S3_SECRET_ACCESS_KEY, and CXMEDIA_S3_BUCKET are required."
    )
  }

  const corsOrigins = readStringList(env.CXMEDIA_CORS_ORIGINS)
  const allowedOrigins = corsOrigins.length > 0 ? corsOrigins : [defaultCorsOrigin]

  if (strictConfig) {
    if (jwtSecret === "change-this-secret-value") {
      throw new Error("CXMEDIA_JWT_SECRET must be replaced before strict startup.")
    }

    if (signedUrlSecret === "change-this-signed-secret") {
      throw new Error("CXMEDIA_SIGNED_URL_SECRET must be replaced before strict startup.")
    }

    if (allowedOrigins.includes("*")) {
      throw new Error("CXMEDIA_CORS_ORIGINS cannot contain '*' during strict startup.")
    }
  }

  return {
    appName: env.CXMEDIA_APP_NAME?.trim() || "cxmedia",
    host: env.CXMEDIA_HOST?.trim() || "0.0.0.0",
    port: readNumber(env.CXMEDIA_PORT, 4100, "CXMEDIA_PORT"),
    nodeEnv,
    publicBaseUrl,
    cdnBaseUrl: (env.CXMEDIA_CDN_BASE_URL?.trim() || "http://localhost:4100").replace(/\/+$/, ""),
    thumborBaseUrl: env.CXMEDIA_THUMBOR_BASE_URL?.trim()
      ? env.CXMEDIA_THUMBOR_BASE_URL.trim().replace(/\/+$/, "")
      : null,
    thumborInternalBaseUrl: env.CXMEDIA_THUMBOR_INTERNAL_BASE_URL?.trim()
      ? env.CXMEDIA_THUMBOR_INTERNAL_BASE_URL.trim().replace(/\/+$/, "")
      : env.CXMEDIA_THUMBOR_BASE_URL?.trim()
        ? env.CXMEDIA_THUMBOR_BASE_URL.trim().replace(/\/+$/, "")
        : null,
    thumborSourceBaseUrl:
      (env.CXMEDIA_THUMBOR_SOURCE_BASE_URL?.trim() ||
        env.CXMEDIA_PUBLIC_BASE_URL?.trim() ||
        "http://localhost:4100").replace(/\/+$/, ""),
    maxUploadBytes: readNumber(
      env.CXMEDIA_MAX_UPLOAD_BYTES,
      10 * 1024 * 1024,
      "CXMEDIA_MAX_UPLOAD_BYTES"
    ),
    allowedMimeTypes: readStringList(env.CXMEDIA_ALLOWED_MIME_TYPES),
    auth: {
      bootstrapAdminEmail: adminEmail,
      bootstrapAdminName: env.CXMEDIA_ADMIN_NAME?.trim() || "Primary Admin",
      bootstrapAdminPassword: env.CXMEDIA_ADMIN_PASSWORD?.trim() || null,
      bootstrapAdminPasswordHash: env.CXMEDIA_ADMIN_PASSWORD_HASH?.trim() || null,
      jwtSecret,
      jwtExpiresInSeconds: readNumber(
        env.CXMEDIA_JWT_EXPIRES_IN_SECONDS,
        28_800,
        "CXMEDIA_JWT_EXPIRES_IN_SECONDS"
      ),
      usersFilePath:
        env.CXMEDIA_USERS_FILE?.trim() || path.resolve(cwd, "cxmedia", "data", "users.json"),
    },
    internalSync: {
      secret: env.CXMEDIA_SYNC_SECRET?.trim() || null,
    },
    handoff: {
      secret: env.CXMEDIA_HANDOFF_SECRET?.trim() || null,
    },
    signedUrls: {
      secret: signedUrlSecret,
      expiresInSeconds: readNumber(
        env.CXMEDIA_SIGNED_URL_EXPIRES_IN_SECONDS,
        900,
        "CXMEDIA_SIGNED_URL_EXPIRES_IN_SECONDS"
      ),
    },
    rateLimit: {
      windowSeconds: readNumber(
        env.CXMEDIA_RATE_LIMIT_WINDOW_SECONDS,
        60,
        "CXMEDIA_RATE_LIMIT_WINDOW_SECONDS"
      ),
      maxRequests: readNumber(
        env.CXMEDIA_RATE_LIMIT_MAX_REQUESTS,
        120,
        "CXMEDIA_RATE_LIMIT_MAX_REQUESTS"
      ),
    },
    storage: {
      endpoint: s3Endpoint.replace(/\/+$/, ""),
      region: env.CXMEDIA_S3_REGION?.trim() || "garage",
      accessKeyId,
      secretAccessKey,
      bucket,
      pathStyle: readBoolean(env.CXMEDIA_S3_PATH_STYLE, true),
      autoCreateBucket: readBoolean(env.CXMEDIA_S3_AUTO_CREATE_BUCKET, true),
    },
    runtimeSettings: {
      filePath:
        env.CXMEDIA_RUNTIME_SETTINGS_FILE?.trim() ||
        path.resolve(cwd, "cxmedia", "data", "runtime-settings.json"),
    },
    cors: {
      allowedOrigins,
    },
    security: {
      productionMode,
      strictConfig,
    },
  }
}
