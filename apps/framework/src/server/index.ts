import { randomUUID } from "node:crypto"
import { readFileSync } from "node:fs"
import { readFile } from "node:fs/promises"
import type { IncomingMessage, ServerResponse } from "node:http"
import { createServer as createHttpServer } from "node:http"
import { createServer as createHttpsServer } from "node:https"
import type { Socket } from "node:net"
import path from "node:path"
import { pathToFileURL } from "node:url"
import { ZodError } from "zod"

import type { AppSuite } from "../application/app-manifest.js"
import { createFrameworkServerContainer } from "../di/server-container.js"
import { FRAMEWORK_TOKENS } from "../di/tokens.js"
import type { ServerConfig } from "../runtime/config/index.js"
import {
  prepareApplicationDatabase,
  type RuntimeDatabases,
} from "../runtime/database/index.js"
import { ApplicationError } from "../runtime/errors/application-error.js"
import { ensurePublicMediaSymlink } from "../runtime/media/media-storage.js"
import { createRuntimeLogger, resolveRequestId } from "../runtime/observability/runtime-logger.js"
import { startDatabaseBackupScheduler } from "../runtime/operations/database-backup-service.js"
import {
  createRequestContext,
  matchHttpRoute,
  type HttpRouteDefinition,
} from "../runtime/http/index.js"

const mimeTypes: Record<string, string> = {
  ".avif": "image/avif",
  ".css": "text/css; charset=utf-8",
  ".gif": "image/gif",
  ".html": "text/html; charset=utf-8",
  ".ico": "image/x-icon",
  ".jpeg": "image/jpeg",
  ".jpg": "image/jpeg",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".txt": "text/plain; charset=utf-8",
  ".webp": "image/webp",
  ".woff2": "font/woff2",
}

function json(body: unknown, statusCode = 200) {
  return {
    body: JSON.stringify(body),
    headers: { "content-type": "application/json; charset=utf-8" },
    statusCode,
  }
}

function html(body: string, statusCode = 200) {
  return {
    body,
    headers: { "content-type": "text/html; charset=utf-8" },
    statusCode,
  }
}

async function serveFile(filePath: string) {
  const extension = path.extname(filePath)
  const body = await readFile(filePath)
  const headers: Record<string, string> = {
    "content-type": mimeTypes[extension] ?? "application/octet-stream",
  }

  if (extension === ".html") {
    headers["cache-control"] = "no-store, max-age=0, must-revalidate"
  }

  return {
    body,
    headers,
    statusCode: 200,
  }
}

function renderWelcomePage(appName: string) {
  return html(`<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${appName} Framework</title>
  </head>
  <body>
    <main style="font-family: sans-serif; padding: 32px;">
      <p>${appName}</p>
      <h1>Framework host is running.</h1>
      <p>Build the web app to serve the framework shell from this host.</p>
    </main>
  </body>
</html>`)
}

type RuntimeStartupState = {
  errorMessage: string | null
  startedAt: string
  status: "starting" | "ready" | "failed"
}

export function readForwardedProtocol(headers: IncomingMessage["headers"]) {
  const forwardedProto = headers["x-forwarded-proto"]
  const cfVisitor = headers["cf-visitor"]
  const resolvedForwardedProto = Array.isArray(forwardedProto)
    ? forwardedProto[0]
    : forwardedProto
  const resolvedCfVisitor = Array.isArray(cfVisitor) ? cfVisitor[0] : cfVisitor

  if (resolvedForwardedProto?.trim()) {
    return resolvedForwardedProto.split(",")[0]?.trim().toLowerCase() ?? null
  }

  if (resolvedCfVisitor?.includes("https")) {
    return "https"
  }

  return null
}

export function isRequestSecure(
  headers: IncomingMessage["headers"],
  protocol: "http" | "https"
) {
  if (protocol === "https") {
    return true
  }

  return readForwardedProtocol(headers) === "https"
}

export function createHttpsRedirectUrl(
  requestUrl: URL,
  headers: IncomingMessage["headers"],
  config: ServerConfig
) {
  const hostHeader = headers.host ?? ""
  const requestHost = hostHeader.split(",")[0]?.trim() ?? ""
  const canonicalHost = requestHost || config.frontendDomain || config.appDomain
  const hostWithoutPort = canonicalHost.replace(/:\d+$/, "")
  const portSuffix =
    config.tlsEnabled && config.appHttpsPort !== 443 ? `:${config.appHttpsPort}` : ""

  return `https://${hostWithoutPort}${portSuffix}${requestUrl.pathname}${requestUrl.search}`
}

async function resolveResponse(
  urlPath: string,
  method: HttpRouteDefinition["method"],
  context: {
    config: ServerConfig
    appDomain: string
    appHost: string
    appHttpPort: number
    appHttpsPort: number
    appName: string
    appSuite: AppSuite
    cloudflareEnabled: boolean
    databases: RuntimeDatabases
    frontendDomain: string
    frontendHttpPort: number
    frontendHttpsPort: number
    httpRoutes: HttpRouteDefinition[]
    remoteAddress: string | null
    requestId: string
    requestBody: string | null
    requestHeaders: IncomingMessage["headers"]
    requestUrl: URL
    tlsEnabled: boolean
    webRoot: string
  }
) {
  const {
    config,
    appDomain,
    appHost,
    appHttpPort,
    appHttpsPort,
    appName,
    appSuite,
    cloudflareEnabled,
    databases,
    frontendDomain,
    frontendHttpPort,
    frontendHttpsPort,
    httpRoutes,
    remoteAddress,
    requestId,
    requestBody,
    requestHeaders,
    requestUrl,
    tlsEnabled,
    webRoot,
  } = context
  const matchedRoute = matchHttpRoute(httpRoutes, method, urlPath)
  const contentTypeHeader = requestHeaders["content-type"]
  const contentType = Array.isArray(contentTypeHeader)
    ? contentTypeHeader[0]
    : contentTypeHeader
  let jsonBody: unknown | null = null

  if (requestBody && contentType?.includes("application/json")) {
    try {
      jsonBody = JSON.parse(requestBody)
    } catch {
      throw new ApplicationError("Invalid JSON request body.", {}, 400)
    }
  }

  if (matchedRoute) {
    return matchedRoute.handler(
      createRequestContext(matchedRoute, appSuite, {
        config,
        databases,
        request: {
          bodyText: requestBody,
          headers: requestHeaders,
          jsonBody,
          method,
          pathname: urlPath,
          remoteAddress,
          requestId,
          url: requestUrl,
        },
      })
    )
  }

  if (urlPath === "/health" || urlPath === "/public/v1/health") {
    return json({
      app: appName,
      status: "ok",
      timestamp: new Date().toISOString(),
      uptimeSeconds: process.uptime(),
      host: appHost,
      httpPort: appHttpPort,
      httpsPort: tlsEnabled ? appHttpsPort : null,
      appDomain,
      frontendDomain,
      frontendHttpPort,
      frontendHttpsPort,
      tlsEnabled,
      cloudflareEnabled,
      suite: appSuite.apps.map((app: AppSuite["apps"][number]) => app.id),
      database: databases.metadata,
      route: {
        surface: "public",
        version: "v1",
      },
    })
  }

  if (urlPath === "/") {
    try {
      return await serveFile(path.join(webRoot, "index.html"))
    } catch {
      return renderWelcomePage(appName)
    }
  }

  const sanitizedPath = path
    .normalize(urlPath)
    .replace(/^(\.\.[/\\])+/, "")
    .replace(/^[/\\]+/, "")
  const repositoryPublicAssetPath = path.join(webRoot, "..", "..", "..", "..", "public", sanitizedPath)
  const assetPath = path.join(webRoot, sanitizedPath)

  try {
    return await serveFile(repositoryPublicAssetPath)
  } catch {
    // Fall through to built assets when the root public file is not present.
  }

  try {
    return await serveFile(assetPath)
  } catch {
    try {
      return await serveFile(path.join(webRoot, "index.html"))
    } catch {
      return json({ message: "Not found" }, 404)
    }
  }
}

async function readRequestBody(request: IncomingMessage) {
  const chunks: Buffer[] = []
  let size = 0

  for await (const chunk of request) {
    const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk)
    size += buffer.length

    if (size > 1_048_576) {
      throw new ApplicationError("Request body exceeds 1 MB limit.", {}, 413)
    }

    chunks.push(buffer)
  }

  if (chunks.length === 0) {
    return null
  }

  return Buffer.concat(chunks).toString("utf8")
}

export async function startFrameworkServer(cwd = process.cwd()) {
  return startFrameworkServerWithOptions(cwd)
}

export async function startFrameworkServerWithOptions(
  cwd = process.cwd(),
  options: {
    onReady?: (context: {
      config: ServerConfig
      databases: RuntimeDatabases
      logger: ReturnType<typeof createRuntimeLogger>
    }) => Promise<(() => void) | void> | (() => void) | void
  } = {}
) {
  const container = createFrameworkServerContainer(cwd)
  const config = container.resolve<ServerConfig>(FRAMEWORK_TOKENS.config)
  const databases = container.resolve<RuntimeDatabases>(FRAMEWORK_TOKENS.databases)
  const appSuite = container.resolve<AppSuite>(FRAMEWORK_TOKENS.appSuite)
  const httpRoutes = container.resolve<HttpRouteDefinition[]>(
    FRAMEWORK_TOKENS.httpRoutes
  )
  const {
    appDomain,
    appHost,
    appHttpPort,
    appHttpsPort,
    appName,
    cloudflareEnabled,
    frontendDomain,
    frontendHttpPort,
    frontendHttpsPort,
    tlsCertPath,
    tlsEnabled,
    tlsKeyPath,
    webRoot,
  } = config
  const startupState: RuntimeStartupState = {
    errorMessage: null,
    startedAt: new Date().toISOString(),
    status: "starting",
  }
  const logger = createRuntimeLogger(config)

  type ListenerServer =
    | ReturnType<typeof createHttpServer>
    | ReturnType<typeof createHttpsServer>

  const sockets = new Set<Socket>()
  const listeningServers = new Set<ListenerServer>()
  let isShuttingDown = false
  let stopBackupScheduler: (() => void) | null = null
  let stopReadyHook: (() => void) | null = null

  const requestHandler = async (
    request: IncomingMessage,
    response: ServerResponse<IncomingMessage>,
    protocol: "http" | "https"
  ) => {
    const requestId =
      resolveRequestId(request.headers["x-request-id"]) ?? randomUUID()
    const startedAt = Date.now()
    const remoteAddress = request.socket.remoteAddress ?? null
    const requestUrl = new URL(
      request.url ?? "/",
      `http://${request.headers.host ?? "localhost"}`
    )

    response.setHeader("x-request-id", requestId)

    if (isShuttingDown) {
      response.writeHead(503, {
        "content-type": "application/json; charset=utf-8",
        connection: "close",
        "x-request-id": requestId,
      })
      response.end(JSON.stringify({ message: "Server is shutting down" }))
      return
    }

    if (config.security.httpsOnly && !isRequestSecure(request.headers, protocol)) {
      const location = createHttpsRedirectUrl(requestUrl, request.headers, config)
      logger.info("http.request.redirected_to_https", {
        requestId,
        method: request.method ?? "GET",
        pathname: requestUrl.pathname,
        remoteAddress,
        location,
      })
      response.writeHead(308, {
        location,
        "x-request-id": requestId,
      })
      response.end()
      return
    }

    if (startupState.status !== "ready") {
      const isHealthRoute =
        requestUrl.pathname === "/health" ||
        requestUrl.pathname === "/public/v1/health"

      response.writeHead(startupState.status === "failed" ? 500 : 503, {
        "content-type": "application/json; charset=utf-8",
        "retry-after": "2",
        "x-request-id": requestId,
      })
      response.end(
        JSON.stringify(
          isHealthRoute
            ? {
                app: appName,
                status:
                  startupState.status === "failed"
                    ? "startup_failed"
                    : "starting_up",
                startedAt: startupState.startedAt,
                detail: startupState.errorMessage,
              }
            : {
                message:
                  startupState.status === "failed"
                    ? "Server startup failed"
                    : "Server is starting up",
                status:
                  startupState.status === "failed"
                    ? "startup_failed"
                    : "starting_up",
                startedAt: startupState.startedAt,
                detail: startupState.errorMessage,
              }
        )
      )
      return
    }

    if (
      request.method !== "GET" &&
      request.method !== "HEAD" &&
      request.method !== "POST" &&
      request.method !== "PATCH" &&
      request.method !== "PUT" &&
      request.method !== "DELETE"
    ) {
      response.writeHead(405, {
        "content-type": "application/json; charset=utf-8",
        "x-request-id": requestId,
      })
      response.end(JSON.stringify({ message: "Method not allowed" }))
      return
    }

    try {
      const requestBody =
        request.method === "GET" || request.method === "HEAD"
          ? null
          : await readRequestBody(request)

      const resolved = await resolveResponse(
        requestUrl.pathname,
        request.method as HttpRouteDefinition["method"],
        {
          config,
          appDomain,
          appHost,
          appHttpPort,
          appHttpsPort,
          appName,
          appSuite,
          cloudflareEnabled,
          databases,
          frontendDomain,
          frontendHttpPort,
          frontendHttpsPort,
          httpRoutes,
          remoteAddress,
          requestId,
          requestBody,
          requestHeaders: request.headers,
          requestUrl,
          tlsEnabled,
          webRoot,
        }
      )

      response.writeHead(resolved.statusCode, {
        ...resolved.headers,
        "x-request-id": requestId,
      })

      logger.info("http.request.completed", {
        requestId,
        method: request.method ?? "GET",
        pathname: requestUrl.pathname,
        statusCode: resolved.statusCode,
        durationMs: Date.now() - startedAt,
        remoteAddress,
      })

      if (request.method === "HEAD") {
        response.end()
        return
      }

      response.end(resolved.body)
    } catch (error) {
      if (error instanceof ApplicationError) {
        response.writeHead(error.statusCode, {
          "content-type": "application/json; charset=utf-8",
          "x-request-id": requestId,
        })
        logger.warn("http.request.application_error", {
          requestId,
          method: request.method ?? "GET",
          pathname: requestUrl.pathname,
          statusCode: error.statusCode,
          durationMs: Date.now() - startedAt,
          remoteAddress,
          error: error.message,
        })
        response.end(
          JSON.stringify({
            error: error.message,
            context: error.context,
          })
        )
        return
      }

      if (error instanceof ZodError) {
        response.writeHead(400, {
          "content-type": "application/json; charset=utf-8",
          "x-request-id": requestId,
        })
        logger.warn("http.request.validation_error", {
          requestId,
          method: request.method ?? "GET",
          pathname: requestUrl.pathname,
          statusCode: 400,
          durationMs: Date.now() - startedAt,
          remoteAddress,
          issues: error.issues.length,
        })
        response.end(
          JSON.stringify({
            error: "Invalid request payload.",
            context: {
              issues: error.issues,
            },
          })
        )
        return
      }

      response.writeHead(500, {
        "content-type": "application/json; charset=utf-8",
        "x-request-id": requestId,
      })
      logger.error("http.request.unhandled_error", {
        requestId,
        method: request.method ?? "GET",
        pathname: requestUrl.pathname,
        statusCode: 500,
        durationMs: Date.now() - startedAt,
        remoteAddress,
        error: error instanceof Error ? error.message : "Unknown error",
      })
      response.end(
        JSON.stringify({
          error: "Internal server error",
          context: {
            detail: error instanceof Error ? error.message : "Unknown error",
          },
        })
      )
    }
  }

  const httpServer = createHttpServer((request, response) => {
    void requestHandler(request, response, "http")
  })
  const servers: ListenerServer[] = [httpServer]
  let httpsServer: ReturnType<typeof createHttpsServer> | undefined

  if (tlsEnabled && tlsKeyPath && tlsCertPath) {
    httpsServer = createHttpsServer(
      {
        key: readFileSync(tlsKeyPath),
        cert: readFileSync(tlsCertPath),
        minVersion: "TLSv1.2",
      },
      (request, response) => {
        void requestHandler(request, response, "https")
      }
    )
    servers.push(httpsServer)
  }

  for (const server of servers) {
    server.requestTimeout = 15_000
    server.headersTimeout = 10_000
    server.keepAliveTimeout = 5_000
    server.maxHeadersCount = 100

    server.on("connection", (socket) => {
      sockets.add(socket)
      socket.setTimeout(15_000)
      socket.on("close", () => {
        sockets.delete(socket)
      })
      socket.on("timeout", () => {
        socket.destroy()
      })
    })

    server.on("clientError", (_error, socket) => {
      if (socket.writable) {
        socket.end("HTTP/1.1 400 Bad Request\r\nConnection: close\r\n\r\n")
      }
    })
  }

  let shutdownTimer: NodeJS.Timeout | undefined

  async function destroyRuntimeResources() {
    stopReadyHook?.()
    stopReadyHook = null
    stopBackupScheduler?.()
    stopBackupScheduler = null

    try {
      await databases.destroy()
    } catch (error) {
      logger.error("runtime.database_shutdown_error", {
        error: error instanceof Error ? error.message : String(error),
      })
    }
  }

  function closeServer(server: ListenerServer) {
    return new Promise<void>((resolve, reject) => {
      if (!listeningServers.has(server)) {
        resolve()
        return
      }

      server.close((error) => {
        if (error && "code" in error && error.code === "ERR_SERVER_NOT_RUNNING") {
          listeningServers.delete(server)
          resolve()
          return
        }

        if (error) {
          reject(error)
          return
        }

        listeningServers.delete(server)
        resolve()
      })
    })
  }

  function shutdown(signal: string) {
    if (isShuttingDown) {
      return
    }

    isShuttingDown = true
    logger.warn("runtime.shutdown_requested", { signal })

    shutdownTimer = setTimeout(() => {
      for (const socket of sockets) {
        socket.destroy()
      }
    }, 10_000)

    Promise.all(servers.map((server) => closeServer(server)))
      .then(async () => {
        await destroyRuntimeResources()

        if (shutdownTimer) {
          clearTimeout(shutdownTimer)
        }

        process.exit()
      })
      .catch((error) => {
        if (shutdownTimer) {
          clearTimeout(shutdownTimer)
        }

        logger.error("runtime.shutdown_error", {
          error: error instanceof Error ? error.message : String(error),
        })
        process.exitCode = 1
        process.exit()
      })
  }

  process.on("SIGINT", () => {
    shutdown("SIGINT")
  })

  process.on("SIGTERM", () => {
    shutdown("SIGTERM")
  })

  process.on("uncaughtException", (error) => {
    logger.error("runtime.uncaught_exception", {
      error: error instanceof Error ? error.message : String(error),
    })
    shutdown("uncaughtException")
  })

  process.on("unhandledRejection", (reason) => {
    logger.error("runtime.unhandled_rejection", {
      reason: reason instanceof Error ? reason.message : String(reason),
    })
  })

  function listen(server: ListenerServer, port: number, protocol: "http" | "https") {
    server.once("error", async (error: NodeJS.ErrnoException) => {
      if (error.code === "EADDRINUSE") {
        logger.error("runtime.listen_port_in_use", { protocol, port })
      } else {
        logger.error("runtime.listen_startup_error", {
          protocol,
          port,
          error: error.message,
        })
      }

      await destroyRuntimeResources()
      process.exit(1)
    })

    server.listen(port, appHost, () => {
      listeningServers.add(server)
      logger.info("runtime.listening", {
        protocol,
        host: appHost,
        port,
      })
    })
  }

  listen(httpServer, appHttpPort, "http")

  if (httpsServer) {
    listen(httpsServer, appHttpsPort, "https")
  }

  try {
    await ensurePublicMediaSymlink(config)
    await prepareApplicationDatabase(databases, { logger: console })
    stopBackupScheduler = startDatabaseBackupScheduler({
      config,
      databases,
      logger,
    })
    stopReadyHook = (await options.onReady?.({ config, databases, logger })) ?? null
    startupState.status = "ready"
    logger.info("runtime.ready")
  } catch (error) {
    startupState.status = "failed"
    startupState.errorMessage =
      error instanceof Error ? error.message : "Unknown startup error"
    logger.error("runtime.startup_preparation_error", {
      error: error instanceof Error ? error.message : String(error),
    })
    shutdown("startupFailure")
    throw error
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  void startFrameworkServer()
}
