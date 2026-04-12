import { apiAppManifest } from "../../../api/src/app-manifest.js"
import { billingAppManifest } from "../../../billing/src/app-manifest.js"
import { cliAppManifest } from "../../../cli/src/app-manifest.js"
import { coreAppManifest } from "../../../core/src/app-manifest.js"
import { cxappAppManifest } from "../../../cxapp/src/app-manifest.js"
import { demoAppManifest } from "../../../demo/src/app-manifest.js"
import { ecommerceAppManifest } from "../../../ecommerce/src/app-manifest.js"
import { frappeAppManifest } from "../../../frappe/src/app-manifest.js"
import { siteAppManifest } from "../../../site/src/app-manifest.js"
import { tallyAppManifest } from "../../../tally/src/app-manifest.js"
import { taskAppManifest } from "../../../task/src/app-manifest.js"
import { crmAppManifest } from "../../../crm/src/app-manifest.js"
import { uiAppManifest } from "../../../ui/src/app-manifest.js"
import { zetroAppManifest } from "../../../zetro/src/app-manifest.js"
import { frameworkAppManifest } from "../app-manifest.js"

import type { AppSuite } from "./app-manifest.js"

export function createAppSuite(): AppSuite {
  return {
    framework: frameworkAppManifest,
    apps: [
      cxappAppManifest,
      coreAppManifest,
      apiAppManifest,
      uiAppManifest,
      siteAppManifest,
      billingAppManifest,
      ecommerceAppManifest,
      demoAppManifest,
      taskAppManifest,
      crmAppManifest,
      zetroAppManifest,
      frappeAppManifest,
      tallyAppManifest,
      cliAppManifest,
    ],
  }
}
