import type { AppSuite } from "../../application/app-manifest.js"

export type HttpRouteSurface = "internal" | "external" | "public"
export type HttpRouteVersion = "v1"
export type HttpRouteAuth = "none" | "internal" | "external"

export type HttpRouteResponse = {
  statusCode: number
  headers?: Record<string, string>
  body: string
}

export type HttpRouteDefinition = {
  auth: HttpRouteAuth
  legacyPaths?: string[]
  method: "GET" | "HEAD"
  path: string
  summary: string
  surface: HttpRouteSurface
  version: HttpRouteVersion
  handler: (context: { appSuite: AppSuite; route: Pick<HttpRouteDefinition, "auth" | "path" | "surface" | "version"> }) => Promise<HttpRouteResponse> | HttpRouteResponse
}
