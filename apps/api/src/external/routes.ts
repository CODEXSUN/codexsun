import type { AppSuite } from "../../../framework/src/application/app-manifest.js"
import { defineExternalRoute } from "../../../framework/src/runtime/http/route-manifest.js"
import type { HttpRouteDefinition } from "../../../framework/src/runtime/http/route-types.js"

import { createAuthExternalRoutes } from "./auth-routes.js"
import { createEcommerceExternalRoutes } from "./ecommerce-routes.js"
import { createFrameworkExternalRoutes } from "./framework-routes.js"

export function createExternalApiRoutes(appSuite: AppSuite): HttpRouteDefinition[] {
  return [
    defineExternalRoute("/apps", {
      legacyPaths: ["/api/apps"],
      summary: "External app registry for public and partner-facing consumption.",
      handler: () => ({
        statusCode: 200,
        headers: { "content-type": "application/json; charset=utf-8" },
        body: JSON.stringify({
          scope: "external",
          apps: appSuite.apps.map((app: AppSuite["apps"][number]) => ({
            id: app.id,
            name: app.name,
            kind: app.kind,
            description: app.description,
            surfaces: {
              externalApi: app.surfaces.externalApi ?? false,
              web: app.surfaces.web ?? false,
              connector: app.surfaces.connector ?? false,
            },
          })),
        }),
      }),
    }),
    ...createAuthExternalRoutes(),
    ...createFrameworkExternalRoutes(),
    ...createEcommerceExternalRoutes(),
  ]
}
