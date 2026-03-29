import type { AppSuite } from "../../../framework/src/application/app-manifest.js"
import type { HttpRouteDefinition } from "../../../framework/src/runtime/http/route-types.js"

export function createInternalApiRoutes(appSuite: AppSuite): HttpRouteDefinition[] {
  return [
    {
      method: "GET",
      path: "/internal/apps",
      visibility: "internal",
      handler: () => ({
        statusCode: 200,
        headers: { "content-type": "application/json; charset=utf-8" },
        body: JSON.stringify({
          scope: "internal",
          framework: appSuite.framework,
          apps: appSuite.apps,
        }),
      }),
    },
  ]
}
