import { readFileSync } from "node:fs"
import { readFile } from "node:fs/promises"
import type { IncomingMessage, ServerResponse } from "node:http"
import { createServer as createHttpServer } from "node:http"
import { createServer as createHttpsServer } from "node:https"
import type { Socket } from "node:net"
import path from "node:path"
import { pathToFileURL } from "node:url"

import type { AppSuite } from "../application/app-manifest.js"
import { createFrameworkServerContainer } from "../di/server-container.js"
import { FRAMEWORK_TOKENS } from "../di/tokens.js"
import type { ServerConfig } from "../runtime/config/index.js"
import {
  prepareApplicationDatabase,
  type RuntimeDatabases,
} from "../runtime/database/index.js"
import { ApplicationError } from "../runtime/errors/application-error.js"
import {
  createRequestContext,
  matchHttpRoute,
  type HttpRouteDefinition,
} from "../runtime/http/index.js"

const mimeTypes: Record<string, string> = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".txt": "text/plain; charset=utf-8",
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

  return {
    body,
    headers: {
      "content-type": mimeTypes[extension] ?? "application/octet-stream",
    },
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
  const assetPath = path.join(webRoot, sanitizedPath)

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

  try {
    await prepareApplicationDatabase(databases, { logger: console })
  } catch (error) {
    await databases.destroy()
    throw error
  }

  type ListenerServer =
    | ReturnType<typeof createHttpServer>
    | ReturnType<typeof createHttpsServer>

  const sockets = new Set<Socket>()
  const listeningServers = new Set<ListenerServer>()
  let isShuttingDown = false

  const requestHandler = async (
    request: IncomingMessage,
    response: ServerResponse<IncomingMessage>
  ) => {
    if (isShuttingDown) {
      response.writeHead(503, {
        "content-type": "application/json; charset=utf-8",
        connection: "close",
      })
      response.end(JSON.stringify({ message: "Server is shutting down" }))
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
      response.writeHead(405, { "content-type": "application/json; charset=utf-8" })
      response.end(JSON.stringify({ message: "Method not allowed" }))
      return
    }

    const requestUrl = new URL(
      request.url ?? "/",
      `http://${request.headers.host ?? "localhost"}`
    )

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
          requestBody,
          requestHeaders: request.headers,
          requestUrl,
          tlsEnabled,
          webRoot,
        }
      )

      response.writeHead(resolved.statusCode, resolved.headers)

      if (request.method === "HEAD") {
        response.end()
        return
      }

      response.end(resolved.body)
    } catch (error) {
      if (error instanceof ApplicationError) {
        response.writeHead(error.statusCode, {
          "content-type": "application/json; charset=utf-8",
        })
        response.end(
          JSON.stringify({
            error: error.message,
            context: error.context,
          })
        )
        return
      }

      response.writeHead(500, { "content-type": "application/json; charset=utf-8" })
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
    void requestHandler(request, response)
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
        void requestHandler(request, response)
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
    try {
      await databases.destroy()
    } catch (error) {
      console.error(`${appName} database shutdown error:`, error)
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
    console.log(`${appName} received ${signal}, shutting down gracefully`)

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

        console.error(`${appName} shutdown error:`, error)
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
    console.error(`${appName} uncaught exception:`, error)
    shutdown("uncaughtException")
  })

  process.on("unhandledRejection", (reason) => {
    console.error(`${appName} unhandled rejection:`, reason)
  })

  function listen(server: ListenerServer, port: number, protocol: "http" | "https") {
    server.once("error", async (error: NodeJS.ErrnoException) => {
      if (error.code === "EADDRINUSE") {
        console.error(
          `${appName} ${protocol} port ${port} is already in use. Stop the existing process or change ${protocol === "http" ? "APP_HTTP_PORT" : "APP_HTTPS_PORT"}.`
        )
      } else {
        console.error(`${appName} ${protocol} startup error:`, error)
      }

      await destroyRuntimeResources()
      process.exit(1)
    })

    server.listen(port, appHost, () => {
      listeningServers.add(server)
      console.log(`${appName} ${protocol} listening on ${protocol}://${appHost}:${port}`)
    })
  }

  listen(httpServer, appHttpPort, "http")

  if (httpsServer) {
    listen(httpsServer, appHttpsPort, "https")
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  void startFrameworkServer()
}
