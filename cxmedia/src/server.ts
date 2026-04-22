import { createServer } from "node:http"
import { access, readFile } from "node:fs/promises"
import path from "node:path"
import { fileURLToPath } from "node:url"

import { AuthService } from "./auth/service.js"
import { UserStore } from "./auth/user-store.js"
import { getCxmediaConfig } from "./config/env.js"
import { verifyJwt } from "./auth/jwt.js"
import { parseMultipartFormData } from "./http/multipart.js"
import { sanitizeObjectPath } from "./http/path.js"
import { readJsonBody, readRequestBody } from "./http/request-body.js"
import { sendBuffer, sendJson } from "./http/response.js"
import { MediaService } from "./media/service.js"
import { RateLimiter } from "./security/rate-limit.js"
import { RuntimeSettingsService } from "./settings/service.js"
import { S3Client } from "./storage/s3-client.js"

const config = getCxmediaConfig()
const storage = new S3Client(config.storage)
const userStore = new UserStore(config)
const authService = new AuthService(config, userStore)
const runtimeSettings = new RuntimeSettingsService(config)
const mediaService = new MediaService(config, storage, runtimeSettings)
const rateLimiter = new RateLimiter({
  maxRequests: config.rateLimit.maxRequests,
  windowMs: config.rateLimit.windowSeconds * 1000,
})

const mimeTypes: Record<string, string> = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".ico": "image/x-icon",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
}

function resolvePublicFile(fileName: string) {
  const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..")
  return path.join(root, "cxmedia", "public", fileName)
}

function resolveWebBuildFile(fileName: string) {
  const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..")
  return path.join(root, "build", "cxmedia", "web", fileName)
}

function getIpAddress(headers: Record<string, string | string[] | undefined>, fallback: string | null) {
  const forwardedFor = headers["x-forwarded-for"]
  const value = Array.isArray(forwardedFor) ? forwardedFor[0] : forwardedFor
  return value?.split(",")[0]?.trim() || fallback || "unknown"
}

function getOrigin(headers: Record<string, string | string[] | undefined>) {
  const origin = headers.origin
  return Array.isArray(origin) ? origin[0] : origin
}

function enforceRateLimit(key: string) {
  const result = rateLimiter.check(key)

  if (!result.allowed) {
    throw new Error("Too many requests. Please try again later.")
  }
}

function requireUser(headers: Record<string, string | string[] | undefined>) {
  return authService.getAuthenticatedUser(headers)
}

function requireMinimumRole(
  headers: Record<string, string | string[] | undefined>,
  minimumRole: "admin" | "editor" | "viewer"
) {
  const user = requireUser(headers)
  authService.requireRole(user, minimumRole)
  return user
}

function requireInternalSync(headers: Record<string, string | string[] | undefined>) {
  if (!config.internalSync.secret) {
    throw new Error("Internal sync is not configured.")
  }

  const providedSecret = headers["x-cxmedia-sync-secret"]
  const value = Array.isArray(providedSecret) ? providedSecret[0] : providedSecret

  if (!value || value !== config.internalSync.secret) {
    throw new Error("Invalid internal sync secret.")
  }
}

function requireHandoffSecret() {
  if (!config.handoff.secret) {
    throw new Error("Trusted handoff is not configured.")
  }

  return config.handoff.secret
}

function getRelativeWildcardPath(prefix: string, pathname: string) {
  return pathname.slice(prefix.length).replace(/^\/+/, "")
}

function applySecurityHeaders(response: import("node:http").ServerResponse) {
  response.setHeader("x-content-type-options", "nosniff")
  response.setHeader("x-frame-options", "DENY")
  response.setHeader("referrer-policy", "strict-origin-when-cross-origin")
  response.setHeader("permissions-policy", "camera=(), geolocation=(), microphone=()")
  response.setHeader(
    "content-security-policy",
    [
      "default-src 'self'",
      "base-uri 'self'",
      "connect-src 'self'",
      "font-src 'self' data:",
      "form-action 'self'",
      "frame-ancestors 'none'",
      "img-src 'self' data: blob: http: https:",
      "object-src 'none'",
      "script-src 'self'",
      "style-src 'self' 'unsafe-inline'",
    ].join("; ")
  )
}

function applyCorsHeaders(
  request: import("node:http").IncomingMessage,
  response: import("node:http").ServerResponse
) {
  const origin = getOrigin(request.headers)

  if (!origin) {
    return
  }

  if (!config.cors.allowedOrigins.includes(origin)) {
    throw new Error("Origin is not allowed.")
  }

  response.setHeader("vary", "Origin")
  response.setHeader("access-control-allow-origin", origin)
  response.setHeader("access-control-allow-headers", "authorization, content-type")
  response.setHeader("access-control-allow-methods", "GET,HEAD,POST,PUT,DELETE,OPTIONS,PATCH")
  response.setHeader("access-control-max-age", "600")
}

async function serveStaticAsset(fileName: string) {
  const buildFilePath = resolveWebBuildFile(fileName)
  const filePath = (await access(buildFilePath).then(() => buildFilePath).catch(() => resolvePublicFile(fileName)))
  const body = await readFile(filePath)

  return {
    body,
    contentType: mimeTypes[path.extname(fileName)] || "application/octet-stream",
  }
}

async function proxyThumborTransform(
  mode: "resize" | "crop",
  size: string,
  objectPath: string,
  format: string | null,
  response: import("node:http").ServerResponse
) {
  const targetUrl = mediaService.buildThumborUrl(mode, size, objectPath, format)
  const upstream = await fetch(targetUrl)

  if (!upstream.ok) {
    throw new Error(`Thumbor transform failed with status ${upstream.status}.`)
  }

  const body = Buffer.from(await upstream.arrayBuffer())
  sendBuffer(response, 200, body, {
    "cache-control": "public, max-age=31536000, immutable",
    "content-type": upstream.headers.get("content-type") || "application/octet-stream",
  })
}

function serializeUser(user: Awaited<ReturnType<UserStore["listUsers"]>>[number]) {
  return {
    active: user.active,
    createdAt: user.createdAt,
    email: user.email,
    lastLoginAt: user.lastLoginAt,
    name: user.name,
    role: user.role,
    updatedAt: user.updatedAt,
  }
}

async function main() {
  await Promise.all([authService.initialize(), runtimeSettings.initialize(), mediaService.initialize()])

  const server = createServer(async (request, response) => {
    const requestUrl = new URL(request.url || "/", `http://${request.headers.host || "localhost"}`)
    const pathname = requestUrl.pathname
    const ipAddress = getIpAddress(request.headers, request.socket.remoteAddress ?? null)

    response.setHeader("x-powered-by", "cxmedia")
    applySecurityHeaders(response)

    try {
      applyCorsHeaders(request, response)

      if (request.method === "OPTIONS") {
        response.writeHead(204)
        response.end()
        return
      }

      if (pathname === "/health") {
        sendJson(response, 200, {
          app: config.appName,
          environment: config.nodeEnv,
          status: "ok",
          storageBucket: config.storage.bucket,
          timestamp: new Date().toISOString(),
        })
        return
      }

      if (pathname === "/" || pathname === "/index.html") {
        const asset = await serveStaticAsset("index.html")
        sendBuffer(response, 200, asset.body, {
          "cache-control": "no-store, max-age=0",
          "content-type": asset.contentType,
        })
        return
      }

      if (pathname === "/app.js" || pathname === "/app.css" || pathname.startsWith("/assets/")) {
        const asset = await serveStaticAsset(pathname.slice(1))
        sendBuffer(response, 200, asset.body, {
          "cache-control": "public, max-age=31536000, immutable",
          "content-type": asset.contentType,
        })
        return
      }

      if (pathname === "/api/auth/login" && request.method === "POST") {
        enforceRateLimit(`login:${ipAddress}`)
        const payload = readJsonBody<{ email?: string; password?: string }>(
          await readRequestBody(request, 64 * 1024)
        )

        if (!payload.email || !payload.password) {
          throw new Error("Email and password are required.")
        }

        sendJson(response, 200, await authService.login(payload.email, payload.password))
        return
      }

      if (pathname === "/api/auth/me" && request.method === "GET") {
        sendJson(response, 200, { user: requireUser(request.headers) })
        return
      }

      if (pathname === "/api/auth/handoff/consume" && request.method === "POST") {
        const payload = readJsonBody<{
          token?: string
        }>(await readRequestBody(request, 64 * 1024))

        if (!payload.token) {
          throw new Error("Trusted handoff token is required.")
        }

        const handoff = verifyJwt<{
          email?: string
          name?: string
          role?: string
          type?: string
        }>(payload.token, requireHandoffSecret())

        if (handoff.type !== "cxmedia-handoff" || !handoff.email) {
          throw new Error("Invalid trusted handoff token.")
        }

        sendJson(response, 200, await authService.createTrustedSession(handoff.email))
        return
      }

      if (pathname === "/api/settings" && request.method === "GET") {
        const user = requireMinimumRole(request.headers, "viewer")
        sendJson(response, 200, {
          ...(await runtimeSettings.getSettingsPayload()),
          user,
        })
        return
      }

      if (pathname === "/api/settings" && request.method === "PATCH") {
        requireMinimumRole(request.headers, "admin")
        const payload = readJsonBody<{
          allowedMimeTypes?: string[]
          defaultUploadVisibility?: "public" | "private"
          signedUrlExpiresInSeconds?: number
        }>(await readRequestBody(request, 64 * 1024))

        sendJson(response, 200, await runtimeSettings.updateRuntimeSettings(payload))
        return
      }

      if (pathname === "/api/admin/users" && request.method === "GET") {
        requireMinimumRole(request.headers, "admin")
        const users = await userStore.listUsers()
        sendJson(response, 200, {
          users: users.map((user) => serializeUser(user)),
        })
        return
      }

      if (pathname === "/api/admin/users" && request.method === "POST") {
        requireMinimumRole(request.headers, "admin")
        const payload = readJsonBody<{
          email?: string
          name?: string
          password?: string
          role?: "admin" | "editor" | "viewer"
        }>(await readRequestBody(request, 64 * 1024))

        if (!payload.email || !payload.name || !payload.password || !payload.role) {
          throw new Error("Email, name, role, and password are required.")
        }

        const user = await userStore.createUser({
          email: payload.email,
          name: payload.name,
          password: payload.password,
          role: payload.role,
        })
        sendJson(response, 201, { user: serializeUser(user) })
        return
      }

      if (pathname === "/api/admin/users" && request.method === "PATCH") {
        requireMinimumRole(request.headers, "admin")
        const payload = readJsonBody<{
          active?: boolean
          email?: string
          name?: string
          password?: string
          role?: "admin" | "editor" | "viewer"
        }>(await readRequestBody(request, 64 * 1024))

        if (!payload.email) {
          throw new Error("User email is required.")
        }

        const user = await userStore.updateUser(payload.email, payload)
        sendJson(response, 200, { user: serializeUser(user) })
        return
      }

      if (pathname === "/api/internal/users/sync" && request.method === "POST") {
        requireInternalSync(request.headers)
        const payload = readJsonBody<{
          active?: boolean
          email?: string
          name?: string
          passwordHash?: string
          previousEmail?: string | null
          role?: "admin" | "editor" | "viewer"
        }>(await readRequestBody(request, 64 * 1024))

        if (!payload.email || !payload.name || !payload.passwordHash || !payload.role) {
          throw new Error("Email, name, role, and password hash are required.")
        }

        const user = await userStore.upsertUser({
          active: payload.active ?? true,
          email: payload.email,
          name: payload.name,
          passwordHash: payload.passwordHash,
          previousEmail: payload.previousEmail,
          role: payload.role,
        })
        sendJson(response, 200, { user: serializeUser(user) })
        return
      }

      if (pathname === "/api/internal/users/delete" && request.method === "POST") {
        requireInternalSync(request.headers)
        const payload = readJsonBody<{
          email?: string
        }>(await readRequestBody(request, 64 * 1024))

        if (!payload.email) {
          throw new Error("User email is required.")
        }

        sendJson(response, 200, {
          deleted: await userStore.deleteUserByEmail(payload.email),
        })
        return
      }

      if (pathname === "/api/upload" && request.method === "POST") {
        enforceRateLimit(`upload:${ipAddress}`)
        const actor = requireMinimumRole(request.headers, "editor")
        const contentType = Array.isArray(request.headers["content-type"])
          ? request.headers["content-type"][0]
          : request.headers["content-type"]

        if (!contentType?.includes("multipart/form-data")) {
          throw new Error("multipart/form-data is required.")
        }

        const { files, fields } = parseMultipartFormData(
          await readRequestBody(request, config.maxUploadBytes),
          contentType
        )
        const file = files[0]

        if (!file) {
          throw new Error("One upload file is required.")
        }

        const currentSettings = await runtimeSettings.getRuntimeSettings()
        const prefix = fields.find((item) => item.fieldName === "prefix")?.value
        const visibilityValue = fields.find((item) => item.fieldName === "visibility")?.value
        const visibility =
          visibilityValue === "public" || visibilityValue === "private"
            ? visibilityValue
            : currentSettings.defaultUploadVisibility
        const result = await mediaService.uploadObject({
          actor,
          buffer: file.buffer,
          contentType: file.contentType,
          originalName: file.fileName,
          prefix,
          visibility,
        })

        sendJson(response, 201, result)
        return
      }

      if (pathname === "/api/files" && request.method === "GET") {
        enforceRateLimit(`files:${ipAddress}`)
        requireMinimumRole(request.headers, "viewer")
        sendJson(
          response,
          200,
          await mediaService.listObjects(requestUrl.searchParams.get("prefix") ?? undefined)
        )
        return
      }

      if (pathname === "/api/signed-url" && request.method === "POST") {
        const user = requireMinimumRole(request.headers, "viewer")
        const payload = readJsonBody<{
          action?: "download" | "upload"
          expiresInSeconds?: number
          path?: string
        }>(await readRequestBody(request, 64 * 1024))

        if (!payload.path || !payload.action) {
          throw new Error("Action and path are required.")
        }

        if (payload.action === "upload") {
          authService.requireRole(user, "editor")
        }

        sendJson(
          response,
          200,
          await mediaService.createSignedUrl({
            action: payload.action,
            expiresInSeconds: payload.expiresInSeconds,
            objectPath: payload.path,
          })
        )
        return
      }

      if ((pathname.startsWith("/api/file/") || pathname.startsWith("/file/")) && request.method === "GET") {
        requireMinimumRole(request.headers, "viewer")
        const routePrefix = pathname.startsWith("/api/file/") ? "/api/file/" : "/file/"
        const objectPath = sanitizeObjectPath(getRelativeWildcardPath(routePrefix, pathname))
        const object = await mediaService.getObject(objectPath)

        sendBuffer(response, 200, object.body, {
          "cache-control": "private, no-store",
          "content-type": object.contentType,
        })
        return
      }

      if (pathname === "/api/file" && request.method === "DELETE") {
        requireMinimumRole(request.headers, "editor")
        const targetPath = requestUrl.searchParams.get("path")

        if (!targetPath) {
          throw new Error("File path is required.")
        }

        sendJson(response, 200, await mediaService.deleteObject(targetPath))
        return
      }

      if (pathname.startsWith("/signed-upload/") && request.method === "PUT") {
        const objectPath = sanitizeObjectPath(getRelativeWildcardPath("/signed-upload/", pathname))
        const token = requestUrl.searchParams.get("token")

        if (!token) {
          throw new Error("Signed upload token is required.")
        }

        mediaService.verifySignedUrl(token, "upload", objectPath)
        const contentType = Array.isArray(request.headers["content-type"])
          ? request.headers["content-type"][0]
          : request.headers["content-type"] || "application/octet-stream"
        const body = await readRequestBody(request, config.maxUploadBytes)

        await storage.putObject(objectPath, body, {
          contentType,
          metadata: {
            uploaded_by: "signed-upload",
            visibility: "private",
          },
        })

        sendJson(response, 201, {
          path: objectPath,
          uploaded: true,
        })
        return
      }

      if (pathname.startsWith("/f/") && request.method === "GET") {
        const objectPath = sanitizeObjectPath(getRelativeWildcardPath("/f/", pathname))
        const summary = await mediaService.getObjectSummary(objectPath)

        if (summary.visibility !== "public") {
          sendJson(response, 404, { error: "Object is not public." })
          return
        }

        const object = await mediaService.getObject(objectPath)
        sendBuffer(response, 200, object.body, {
          "cache-control": "public, max-age=31536000, immutable",
          "content-type": object.contentType,
        })
        return
      }

      if (pathname.startsWith("/p/") && request.method === "GET") {
        const objectPath = sanitizeObjectPath(getRelativeWildcardPath("/p/", pathname))
        const token = requestUrl.searchParams.get("token")

        if (!token) {
          throw new Error("Signed download token is required.")
        }

        mediaService.verifySignedUrl(token, "download", objectPath)
        const object = await mediaService.getObject(objectPath)

        sendBuffer(response, 200, object.body, {
          "cache-control": "private, max-age=60",
          "content-type": object.contentType,
        })
        return
      }

      if ((pathname.startsWith("/resize/") || pathname.startsWith("/crop/")) && request.method === "GET") {
        const mode = pathname.startsWith("/resize/") ? "resize" : "crop"
        const modePrefix = mode === "resize" ? "/resize/" : "/crop/"
        const relative = getRelativeWildcardPath(modePrefix, pathname)
        const slashIndex = relative.indexOf("/")

        if (slashIndex <= 0) {
          throw new Error("Transform size and object path are required.")
        }

        const size = relative.slice(0, slashIndex)
        const objectPath = sanitizeObjectPath(relative.slice(slashIndex + 1))
        const format = requestUrl.searchParams.get("format")

        if (!config.thumborInternalBaseUrl) {
          const fallbackObject = await mediaService.getObject(objectPath)
          sendBuffer(response, 200, fallbackObject.body, {
            "cache-control": "public, max-age=60",
            "content-type": fallbackObject.contentType,
          })
          return
        }

        await proxyThumborTransform(mode, size, objectPath, format, response)
        return
      }

      if (request.method === "GET" && !pathname.startsWith("/api/")) {
        const asset = await serveStaticAsset("index.html")
        sendBuffer(response, 200, asset.body, {
          "cache-control": "no-store, max-age=0",
          "content-type": asset.contentType,
        })
        return
      }

      sendJson(response, 404, { error: "Not found." })
    } catch (error) {
      const message = error instanceof Error ? error.message : "Internal server error."
      const statusCode =
        message.includes("Authorization") ||
        message.includes("Invalid token") ||
        message.includes("Signed URL") ||
        message === "Invalid email or password." ||
        message === "Invalid trusted user." ||
        message.includes("Invalid trusted handoff") ||
        message.includes("Trusted handoff")
          ? 401
          : message.includes("permission") ||
              message.includes("Origin is not allowed") ||
              message.includes("Invalid internal sync secret")
            ? 403
          : message.includes("Too many requests")
              ? 429
              : message.includes("already exists")
                ? 409
                : message.includes("not found")
                  ? 404
                  : message.includes("Internal sync is not configured")
                    ? 404
                  : message.includes("required") ||
                      message.includes("Unsupported") ||
                      message.includes("cannot include") ||
                      message.includes("At least one active admin")
                    ? 400
                    : 500

      sendJson(response, statusCode, { error: message })
    }
  })

  server.listen(config.port, config.host, () => {
    console.info(`cxmedia listening on http://${config.host}:${config.port}`)
  })
}

void main()
