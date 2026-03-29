import type { AppSuite } from "../../application/app-manifest.js"

export type HttpRouteResponse = {
  statusCode: number
  headers?: Record<string, string>
  body: string
}

export type HttpRouteDefinition = {
  method: "GET" | "HEAD"
  path: string
  visibility: "internal" | "external"
  handler: (context: { appSuite: AppSuite }) => Promise<HttpRouteResponse> | HttpRouteResponse
}
