import type { AppSuite } from "../../../framework/src/application/app-manifest.js"
import { createWorkspaceHostBaseline } from "../../../framework/src/application/workspace-baseline.js"
import { defineInternalRoute } from "../../../framework/src/runtime/http/index.js"
import type { HttpRouteDefinition } from "../../../framework/src/runtime/http/index.js"

import { createBillingInternalRoutes } from "./billing-routes.js"
import { createCoreInternalRoutes } from "./core-routes.js"
import { createCxappAuthInternalRoutes } from "./cxapp-auth-routes.js"
import { createCxappInternalRoutes } from "./cxapp-routes.js"
import { createDemoInternalRoutes } from "./demo-routes.js"
import { createEcommerceInternalRoutes } from "./ecommerce-routes.js"
import { createFrappeInternalRoutes } from "./frappe-routes.js"
import { createFrameworkInternalRoutes } from "./framework-routes.js"
import { createTaskInternalRoutes } from "./task-routes.js"
import { createCrmInternalRoutes } from "./crm-routes.js"
import { createStockInternalRoutes } from "./stock-routes.js"

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
    ...createCoreInternalRoutes(),
    ...createCxappInternalRoutes(),
    ...createCxappAuthInternalRoutes(),
    ...createFrameworkInternalRoutes(),
    ...createDemoInternalRoutes(),
    ...createEcommerceInternalRoutes(),
    ...createBillingInternalRoutes(),
    ...createStockInternalRoutes(),
    ...createFrappeInternalRoutes(),
    ...createTaskInternalRoutes(),
    ...createCrmInternalRoutes(),
  ]
}
