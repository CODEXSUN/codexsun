import type { AppSuite } from "../../application/app-manifest.js"

import type { HttpRouteDefinition, HttpRouteResponse } from "./route-types.js"

export function createRequestContext(
  route: Pick<HttpRouteDefinition, "auth" | "path" | "surface" | "version">,
  appSuite: AppSuite
) {
  return {
    appSuite,
    route,
  }
}

function defineVersionedRoute(
  surface: HttpRouteDefinition["surface"],
  prefix: string,
  resourcePath: string,
  config: {
    auth: HttpRouteDefinition["auth"]
    legacyPaths?: string[]
    method?: HttpRouteDefinition["method"]
    summary: string
    handler: (
      context: ReturnType<typeof createRequestContext>
    ) => Promise<HttpRouteResponse> | HttpRouteResponse
  }
): HttpRouteDefinition {
  return {
    auth: config.auth,
    handler: config.handler,
    legacyPaths: config.legacyPaths,
    method: config.method ?? "GET",
    path: `${prefix}${resourcePath}`,
    summary: config.summary,
    surface,
    version: "v1",
  }
}

export function defineInternalRoute(
  resourcePath: string,
  config: Omit<Parameters<typeof defineVersionedRoute>[3], "auth"> & {
    auth?: HttpRouteDefinition["auth"]
  }
) {
  return defineVersionedRoute("internal", "/internal/v1", resourcePath, {
    auth: config.auth ?? "internal",
    ...config,
  })
}

export function defineExternalRoute(
  resourcePath: string,
  config: Omit<Parameters<typeof defineVersionedRoute>[3], "auth"> & {
    auth?: HttpRouteDefinition["auth"]
  }
) {
  return defineVersionedRoute("external", "/api/v1", resourcePath, {
    auth: config.auth ?? "external",
    ...config,
  })
}

export function definePublicRoute(
  resourcePath: string,
  config: Omit<Parameters<typeof defineVersionedRoute>[3], "auth"> & {
    auth?: HttpRouteDefinition["auth"]
  }
) {
  return defineVersionedRoute("public", "/public/v1", resourcePath, {
    auth: config.auth ?? "none",
    ...config,
  })
}
