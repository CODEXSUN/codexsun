import type { AppSuite } from "../../../framework/src/application/app-manifest.js"
import { createWorkspaceHostBaseline } from "../../../framework/src/application/workspace-baseline.js"
import { defineInternalRoute } from "../../../framework/src/runtime/http/index.js"
import type { HttpRouteDefinition } from "../../../framework/src/runtime/http/index.js"

export function createInternalApiRoutes(appSuite: AppSuite): HttpRouteDefinition[] {
  return [
    defineInternalRoute("/apps", {
      legacyPaths: ["/internal/apps"],
      summary: "Internal suite registry for first-party shells and tools.",
      handler: () => ({
        statusCode: 200,
        headers: { "content-type": "application/json; charset=utf-8" },
        body: JSON.stringify({
          scope: "internal",
          framework: appSuite.framework,
          apps: appSuite.apps,
        }),
      }),
    }),
    defineInternalRoute("/baseline", {
      legacyPaths: ["/internal/baseline"],
      summary: "Workspace and host baseline for first-party diagnostics.",
      handler: () => ({
        statusCode: 200,
        headers: { "content-type": "application/json; charset=utf-8" },
        body: JSON.stringify({
          scope: "internal",
          baseline: createWorkspaceHostBaseline(appSuite),
        }),
      }),
    }),
  ]
}
