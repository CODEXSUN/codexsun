import { createFrameworkBrowserContainer } from "@framework/di/browser-container"
import { FRAMEWORK_TOKENS } from "@framework/di/tokens"
import type { AppSuite } from "@framework/application/app-manifest"

import HomePage from "./pages/home"

const container = createFrameworkBrowserContainer()

function AppShell() {
  const appSuite = container.resolve<AppSuite>(FRAMEWORK_TOKENS.appSuite)

  return <HomePage appSuite={appSuite} />
}

export default AppShell
