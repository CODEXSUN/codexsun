import type { AppSuite } from "../application/app-manifest.js"
import { createAppSuite } from "../application/app-suite.js"

import { ServiceContainer } from "./service-container.js"
import { FRAMEWORK_TOKENS } from "./tokens.js"

export function createFrameworkBrowserContainer() {
  const container = new ServiceContainer()
  const appSuite = createAppSuite()

  container.register<AppSuite>(FRAMEWORK_TOKENS.appSuite, appSuite)

  return container
}
