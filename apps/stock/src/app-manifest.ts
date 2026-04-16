import type { AppManifest } from "../../framework/src/application/app-manifest.js"
import { stockAppWorkspace } from "../shared/index.js"

export const stockAppManifest: AppManifest = {
  id: "stock",
  name: "Stock",
  kind: "business",
  description:
    "Operational stock workspace for inward, stock identity, movement, transfers, reservations, reconciliation, and warehouse execution.",
  standalone: true,
  dependencies: ["framework", "core", "api", "ui", "billing", "cxapp"],
  workspace: stockAppWorkspace,
  surfaces: {
    web: true,
    internalApi: true,
    externalApi: false,
  },
}
