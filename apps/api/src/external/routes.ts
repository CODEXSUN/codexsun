import type { AppSuite } from "../../../framework/src/application/app-manifest.js"
import type { HttpRouteDefinition } from "../../../framework/src/runtime/http/route-types.js"

export function createExternalApiRoutes(appSuite: AppSuite): HttpRouteDefinition[] {
  return [
    {
      method: "GET",
      path: "/api/apps",
      visibility: "external",
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
    },
  ]
}
