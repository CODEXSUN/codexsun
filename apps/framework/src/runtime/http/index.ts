import { createExternalApiRoutes } from "../../../../api/src/external/routes.js"
import { createPublicApiRoutes } from "../../../../api/src/external/public-routes.js"
import { createInternalApiRoutes } from "../../../../api/src/internal/routes.js"
import type { AppSuite } from "../../application/app-manifest.js"
import type { HttpRouteDefinition } from "./route-types.js"

export function createHttpRouteAssemblies(appSuite: AppSuite) {
  return [
    ...createInternalApiRoutes(appSuite),
    ...createExternalApiRoutes(appSuite),
    ...createPublicApiRoutes(appSuite),
  ]
}

export function matchHttpRoute(
  routes: HttpRouteDefinition[],
  method: string,
  pathname: string
) {
  return routes.find(
    (route) =>
      route.method === method &&
      (route.path === pathname || route.legacyPaths?.includes(pathname) === true)
  )
}

export type { HttpRouteDefinition, HttpRouteResponse } from "./route-types.js"
export {
  createRequestContext,
  defineExternalRoute,
  defineInternalRoute,
  definePublicRoute,
} from "./route-manifest.js"
