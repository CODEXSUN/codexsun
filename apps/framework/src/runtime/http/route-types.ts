import type { IncomingHttpHeaders } from "node:http"

import type { AppSuite } from "../../application/app-manifest.js"
import type { ServerConfig } from "../config/index.js"
import type { RuntimeDatabases } from "../database/index.js"

export type HttpRouteSurface = "internal" | "external" | "public"
export type HttpRouteVersion = "v1"
export type HttpRouteAuth = "none" | "internal" | "external"
export type HttpRouteMethod =
  | "GET"
  | "HEAD"
  | "POST"
  | "PATCH"
  | "PUT"
  | "DELETE"

export type HttpRouteResponse = {
  statusCode: number
  headers?: Record<string, string>
  body: string | Buffer | Uint8Array
}

export type HttpRouteRequestContext = {
  method: HttpRouteDefinition["method"]
  pathname: string
  url: URL
  headers: IncomingHttpHeaders
  bodyText: string | null
  jsonBody: unknown | null
}

export type HttpRouteHandlerContext = {
  appSuite: AppSuite
  config: ServerConfig
  databases: RuntimeDatabases
  request: HttpRouteRequestContext
  route: Pick<HttpRouteDefinition, "auth" | "path" | "surface" | "version">
}

export type HttpRouteDefinition = {
  auth: HttpRouteAuth
  legacyPaths?: string[]
  method: HttpRouteMethod
  path: string
  summary: string
  surface: HttpRouteSurface
  version: HttpRouteVersion
  handler: (
    context: HttpRouteHandlerContext
  ) => Promise<HttpRouteResponse> | HttpRouteResponse
}
