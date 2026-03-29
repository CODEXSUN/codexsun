import type { AppSuite } from "../application/app-manifest.js"
import { createAppSuite } from "../application/app-suite.js"
import type { ServerConfig } from "../runtime/config/index.js"
import { getServerConfig } from "../runtime/config/index.js"
import type { RuntimeDatabases } from "../runtime/database/index.js"
import { createRuntimeDatabases } from "../runtime/database/index.js"
import {
  createHttpRouteAssemblies,
  type HttpRouteDefinition,
} from "../runtime/http/index.js"

import { ServiceContainer } from "./service-container.js"
import { FRAMEWORK_TOKENS } from "./tokens.js"

export function createFrameworkServerContainer(cwd = process.cwd()) {
  const container = new ServiceContainer()
  const config = getServerConfig(cwd)
  const appSuite = createAppSuite()
  const databases = createRuntimeDatabases(config)
  const httpRoutes = createHttpRouteAssemblies(appSuite)

  container.register<ServerConfig>(FRAMEWORK_TOKENS.config, config)
  container.register<AppSuite>(FRAMEWORK_TOKENS.appSuite, appSuite)
  container.register<RuntimeDatabases>(FRAMEWORK_TOKENS.databases, databases)
  container.register<HttpRouteDefinition[]>(
    FRAMEWORK_TOKENS.httpRoutes,
    httpRoutes
  )

  return container
}
