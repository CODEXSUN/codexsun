import type { AppManifest } from "../../framework/src/application/app-manifest.js"
import { billingAppWorkspace } from "../shared/index.js"

export const billingAppManifest: AppManifest = {
  id: "billing",
  name: "Billing",
  kind: "business",
  description:
    "Accounting, vouchers, inventory, ledgers, billing documents, and reporting foundations.",
  standalone: true,
  dependencies: ["framework", "core", "api", "ui"],
  workspace: billingAppWorkspace,
  surfaces: {
    web: true,
    internalApi: true,
    externalApi: true,
    desktop: true,
  },
}
