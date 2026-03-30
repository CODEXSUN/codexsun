import type { AppManifest } from "../../framework/src/application/app-manifest.js"
import { frappeAppWorkspace } from "../shared/index.js"

export const frappeAppManifest: AppManifest = {
  id: "frappe",
  name: "Frappe",
  kind: "integration",
  description:
    "Standalone connector boundary for Frappe data contracts and bidirectional ERP integrations.",
  standalone: true,
  dependencies: ["framework", "api", "core", "ecommerce"],
  workspace: frappeAppWorkspace,
  surfaces: {
    internalApi: true,
    externalApi: false,
    web: true,
    connector: true,
  },
}
