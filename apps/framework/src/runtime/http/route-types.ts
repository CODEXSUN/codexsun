import type { AppSuite } from "../../application/app-manifest.js"
import type { RuntimeDatabases } from "../database/index.js"

export type HttpRouteSurface = "internal" | "external" | "public"
export type HttpRouteVersion = "v1"
export type HttpRouteAuth = "none" | "internal" | "external"

export type HttpRouteResponse = {
  statusCode: number
  headers?: Record<string, string>
  body: string
}

export type HttpRouteRequestContext = {
  method: HttpRouteDefinition["method"]
  pathname: string
  url: URL
}

export type HttpRouteHandlerContext = {
  appSuite: AppSuite
  databases: RuntimeDatabases
  request: HttpRouteRequestContext
  route: Pick<HttpRouteDefinition, "auth" | "path" | "surface" | "version">
}

export type HttpRouteDefinition = {
  auth: HttpRouteAuth
  legacyPaths?: string[]
  method: "GET" | "HEAD"
  path: string
  summary: string
  surface: HttpRouteSurface
  version: HttpRouteVersion
  handler: (
    context: HttpRouteHandlerContext
  ) => Promise<HttpRouteResponse> | HttpRouteResponse
}
