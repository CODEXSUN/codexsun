import type { AppSuite } from "@framework/application/app-manifest"
import { createFrameworkBrowserContainer } from "@framework/di/browser-container"
import { FRAMEWORK_TOKENS } from "@framework/di/tokens"
import SiteHomePage from "@site/web/src/pages/home"

const container = createFrameworkBrowserContainer()
const appSuite = container.resolve<AppSuite>(FRAMEWORK_TOKENS.appSuite)

export function SiteHomeRoute() {
  return <SiteHomePage appSuite={appSuite} />
}
